'use client'

import { useState, useEffect, Suspense, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import type { User } from '@supabase/supabase-js'

// Layout genérico
import Header from '@/components/Header'
import BackButton from '@/components/BackButton'
import CadastroCard from '@/components/auth/CadastroCard'
import ModalConfirmacao from '@/components/ui/ModalConfirmacao'
import { Loader2 } from 'lucide-react'

// Hooks e Utils (Laboratório)
import { usePrestadorForm } from '@/hooks/usePrestadorForm'
import { useCategorias } from '@/hooks/useCategorias'
import { useLocalizacao } from '@/hooks/useLocalizacao'
import { useSlugCheck } from '@/hooks/useSlugCheck'
import { fazerUploadFoto } from '@/lib/uploadFoto'

// Componentes Modulares (Vitrine)
import { SecaoAcessoCadastro } from '@/components/auth/SecaoAcessoCadastro'
import { SecaoAcessoLogado } from '@/components/auth/SecaoAcessoLogado'
import { FotoUpload } from '@/components/perfil/FotoUpload'
import { SecaoOQueVoceFaz } from '@/components/perfil/SecaoOQueVoceFaz'
import { SecaoDadosPessoais } from '@/components/perfil/SecaoDadosPessoais'
import { SecaoLocalizacao } from '@/components/perfil/SecaoLocalizacao'
import { SecaoTermos } from '@/components/perfil/SecaoTermos'
import { ErrorModal } from '@/components/ui/ErrorModal'

import type { PrestadorFormData } from '@/types/prestador'

const inputStyleBase = `w-full px-5 py-4 rounded-2xl border border-slate-100 outline-none transition-all font-medium text-[14px] text-slate-800 bg-white shadow-sm placeholder-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-50 disabled:bg-slate-50 disabled:text-slate-400`

function CadastroSkeleton() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center pt-32 px-4 animate-pulse">
      <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="h-64 bg-white rounded-[3rem] border border-slate-100 shadow-sm col-span-1" />
        <div className="h-[500px] bg-white rounded-[3rem] border border-slate-100 shadow-sm col-span-2" />
      </div>
    </div>
  )
}

function FormularioCadastro() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const reivindicarId = searchParams.get('reivindicar')

  // ── Instanciação dos Hooks ───────────────────────────────────────────────
  const form = usePrestadorForm()
  const categorias = useCategorias()
  const loc = useLocalizacao()
  const slugCheck = useSlugCheck({ slug: form.formData.slug || '', idAtual: form.formData.id })
  const inicializadoRef = useRef(false)

  // ── Estados Locais (Acesso e UI) ─────────────────────────────────────────
  const [mounted, setMounted] = useState(false)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [isRedirecting, setIsRedirecting] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [status, setStatus] = useState('')
  const [tentouEnviar, setTentouEnviar] = useState(false)
  const [modoEdicao, setModoEdicao] = useState(false)

  const [userLogado, setUserLogado] = useState<User | null>(null)
  const [email, setEmail] = useState(() => {
    if (typeof window === 'undefined') return ''
    try {
      const prefill = sessionStorage.getItem('pqf_prefill')
      if (prefill) return JSON.parse(prefill).email || ''
    } catch { }
    return ''
  })

  const [senha, setSenha] = useState(() => {
    if (typeof window === 'undefined') return ''
    try {
      const prefill = sessionStorage.getItem('pqf_prefill')
      if (prefill) return JSON.parse(prefill).password || ''
    } catch { }
    return ''
  })
  const [confirmarSenha, setConfirmarSenha] = useState('')
  const [aceitouTermos, setAceitouTermos] = useState(false)
  const [aceitouPrivacidade, setAceitouPrivacidade] = useState(false)

  const [errorModal, setErrorModal] = useState({ show: false, title: '', message: '', actionText: 'Entendido', actionUrl: '' })

  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    sessionStorage.removeItem('pqf_prefill')
  }, [])

  // ── Inicialização de Dados ───────────────────────────────────────────────
  useEffect(() => {
    if (inicializadoRef.current) return  // ← adiciona essa linha
    inicializadoRef.current = true
    const carregarTudo = async () => {
      try {
        setLoading(true)
        const { data: { session } } = await supabase.auth.getSession()
        const user = session?.user || null
        setUserLogado(user)
     
        // Tipagem explícita adicionada aqui
        let perfilExistente: PrestadorFormData | null = null
        if (user) {
          const { data } = await supabase.from('prestadores').select('*').eq('user_id', user.id).maybeSingle()
          perfilExistente = data as PrestadorFormData | null
        }

        // Regra de negócio intacta: bloqueia cadastro duplicado
        if (user && !reivindicarId && perfilExistente && perfilExistente.origem_tipo !== 'curadoria_publica' && perfilExistente.categoria_id) {
          setIsRedirecting(true)
          router.replace('/dashboard')
          return
        }

        // Carga paralela de listas base
        await Promise.all([
          categorias.carregarGrupos(),
          categorias.carregarHabilidades(),
          loc.carregarEstados()
        ])

        // Tipagem explícita adicionada aqui
        let perfilParaCarregar: PrestadorFormData | null = null

        if (reivindicarId) {
          const { data: perfilReivindicar } = await supabase.from('prestadores').select('*').eq('id', reivindicarId).maybeSingle()
          if (!perfilReivindicar) {
            setErrorModal({ show: true, title: 'Perfil não encontrado', message: 'Este perfil pode ter sido removido.', actionText: 'Voltar', actionUrl: '/' })
            setIsRedirecting(true); return
          }
          if (perfilReivindicar.user_id) {
            if (user && user.id === perfilReivindicar.user_id) {
              setIsRedirecting(true); router.push('/dashboard'); return
            }
            setErrorModal({ show: true, title: 'Perfil Indisponível', message: 'Este perfil já foi reivindicado por outro profissional. Caso seja você, faça login.', actionText: 'Fazer Login', actionUrl: '/login' })
            setIsRedirecting(true); return
          }
          perfilParaCarregar = perfilReivindicar as PrestadorFormData
          setAceitouTermos(true)
          setAceitouPrivacidade(true)
          setModoEdicao(false)
        } else if (perfilExistente) {
          perfilParaCarregar = perfilExistente
          setModoEdicao(true)
        }

        if (perfilParaCarregar) {
          if (perfilParaCarregar.grupo_id) await categorias.carregarCategorias(perfilParaCarregar.grupo_id)
          if (perfilParaCarregar.estado_sigla) await loc.carregarRegioes(perfilParaCarregar.estado_sigla)
          await loc.carregarCidades(perfilParaCarregar.regiao_id, perfilParaCarregar.estado_sigla)
          form.carregarPerfil(perfilParaCarregar)
        } else {
          const nomeSocial = user?.user_metadata?.full_name || ''
          form.set({ nome: nomeSocial, slug: form.handleNomeChange(nomeSocial) as any })
          await loc.carregarRegioes('PR')
          await loc.carregarCidades(null, 'PR')
        }
      } catch (error) {
        console.error('Erro inicialização:', error)
      } finally {
        setLoading(false)
      }
    }
    carregarTudo()
  }, [reivindicarId])

  // ── Handlers de Interface ────────────────────────────────────────────────
  const handleUploadFotoProcess = async (file: File) => {
    setUploading(true)
    setStatus('Subindo foto...')
    const res = await fazerUploadFoto(file, userLogado?.id || 'temp', form.formData.foto_perfil || undefined)

    if (res.ok) {
      form.set({ foto_perfil: res.url })
      setStatus('✅ Foto atualizada!')
    } else if (res.error === 'TOO_LARGE') {
      // Usando o prev para manter as propriedades actionText e actionUrl intocadas
      setErrorModal(prev => ({
        ...prev,
        show: true,
        title: 'Arquivo muito pesado',
        message: `Sua imagem possui ${res.sizeMB.toFixed(1)}MB. O limite é de 10MB.`
      }))
      setStatus('Erro no upload')
    } else {
      // O mesmo aqui
      setErrorModal(prev => ({
        ...prev,
        show: true,
        title: 'Erro no Upload',
        message: 'Não conseguimos processar sua imagem. Tente novamente.'
      }))
      setStatus('Erro no upload')
    }

    setUploading(false)
    setTimeout(() => setStatus(''), 2000)
  }

  const handleExcluirPerfil = async () => {
    setStatus('Excluindo...')
    try {
      const targetId = reivindicarId || form.formData.id
      if (!targetId) return
      const { error } = await supabase.from('prestadores').delete().eq('id', targetId)
      if (error) throw error
      router.push('/')
    } catch (err) { setStatus('Erro ao excluir') }
  }

  const calcularProgresso = () => {
    const senhaNovoOk = !userLogado ? (email.includes('@') && senha.length >= 6 && senha === confirmarSenha) : true
    const f = form.formData
    const campos = [
      f.nome?.trim().length > 3,
      f.whatsapp?.replace(/\D/g, "").length >= 10,
      f.grupo_id, f.categoria_id, f.cidade_id,
      f.foto_perfil && f.foto_perfil.length > 10,
      aceitouTermos, aceitouPrivacidade,
      slugCheck.disponivel,
      senhaNovoOk
    ]
    return Math.round((campos.filter(Boolean).length / campos.length) * 100)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setTentouEnviar(true)

    const f = form.formData
    if (!f.foto_perfil) { setStatus('❌ A foto de perfil é obrigatória.'); return }
    if (!slugCheck.disponivel) { setStatus('❌ Escolha uma URL diferente.'); return }
    if (!userLogado && (senha.length < 6 || senha !== confirmarSenha)) { setStatus('❌ Verifique as senhas.'); return }
    if (userLogado && (senha.length > 0 || confirmarSenha.length > 0) && (senha.length < 6 || senha !== confirmarSenha)) { setStatus('❌ Verifique a nova senha.'); return }
    if (loading || uploading || calcularProgresso() < 100) return

    setLoading(true); setStatus('Sincronizando...')

    try {
      let userId = userLogado?.id

      if (!userId) {
        const { data: auth, error: aErr } = await supabase.auth.signUp({ email, password: senha, options: { data: { nome: f.nome } } })
        if (aErr) {
          if (aErr.message.toLowerCase().includes('already registered')) {
            const { data: loginData, error: lErr } = await supabase.auth.signInWithPassword({ email, password: senha })
            if (lErr) throw new Error("ALREADY_REGISTERED")
            userId = loginData.user?.id
          } else throw aErr
        } else {
          userId = auth.user?.id
        }
        if (!userId) throw new Error("Erro de conexão ao criar/autenticar usuário")
      }

      if (userLogado && senha.length >= 6) {
        setStatus('Atualizando credenciais de acesso...')
        const { error: passErr } = await supabase.auth.updateUser({ password: senha })
        if (passErr) throw passErr
      }

      const cidadeSedeNome = loc.listaCidades.find(c => String(c.id) === String(f.cidade_id))?.nome
      const cidadesAtendidasLimpo = [...new Set(f.cidades_atendidas || [])].filter(nome => nome !== cidadeSedeNome && nome !== "")

      if (reivindicarId && userId) {
        await supabase.from('prestadores').delete().eq('user_id', userId).neq('id', reivindicarId)
      }

      const payload = {
        ...f,
        cidades_atendidas: cidadesAtendidasLimpo,
        id: f.id ? Number(f.id) : undefined,
        user_id: userId,
        status: 'ativo',
        origem_tipo: reivindicarId ? 'reivindicado' : 'registro_direto',
        verificado: false
      }

      const { error: dbError } = await supabase.from('prestadores').upsert(payload)
      if (dbError) {
        if (dbError.code === '23505') throw new Error("DB_UNIQUE_CONSTRAINT")
        throw dbError
      }

      if (!userLogado) await supabase.auth.signInWithPassword({ email, password: senha })
      window.location.href = '/dashboard'

    } catch (err: any) {
      if (err.message === "ALREADY_REGISTERED") {
        setErrorModal({ show: true, title: 'E-mail já cadastrado', message: 'Parece que você já tem uma conta. Use a senha correta para assumir este perfil aqui mesmo ou faça login.', actionText: 'Ir para o Login', actionUrl: '/login' })
      } else if (err.message === "DB_UNIQUE_CONSTRAINT") {
        setErrorModal({ show: true, title: 'Conflito de Perfil', message: 'Ocorreu um erro ao vincular a conta a este perfil.', actionText: 'Ir para Dashboard', actionUrl: '/dashboard' })
      } else {
        setStatus(`❌ Não foi possível concluir. Verifique os dados.`)
      }
      setStatus('')
      setLoading(false)
    }
  }

  if (!mounted || loading || isRedirecting) return <CadastroSkeleton />

  return (
    <main className="min-h-screen bg-[#F8FAFC] pb-20 font-sans antialiased overflow-x-hidden">

      <ErrorModal
        show={errorModal.show}
        title={errorModal.title}
        message={errorModal.message}
        actionText={errorModal.actionText}
        actionUrl={errorModal.actionUrl}
        onClose={() => setErrorModal({ ...errorModal, show: false })}
      />

      <Header href="/" />

      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100 h-16 md:h-20 flex items-center px-6">
        <div className="max-w-5xl mx-auto w-full flex justify-between items-center">
          <BackButton href="/" />
          <Link href="/"><img src="/logo.png" alt="Logo" className="h-10 md:h-12 w-auto" /></Link>
          <div className="w-10"></div>
        </div>
        <div className="absolute bottom-0 left-0 w-full h-1 bg-slate-50">
          <div className="h-full bg-blue-600 transition-all duration-700" style={{ width: `${calcularProgresso()}%` }} />
        </div>
      </nav>

      <div className="w-full px-4 pt-32 md:pt-40 max-w-5xl mx-auto">
        <CadastroCard
          title={reivindicarId ? 'Assumir Perfil' : modoEdicao ? 'Meu Perfil' : 'Cadastro'}
          progresso={calcularProgresso()}
          isReivindicando={!!reivindicarId || modoEdicao}
          onExcluir={() => setIsModalOpen(true)}
        >
          <form onSubmit={handleSubmit} className="grid grid-cols-12 gap-8">

            {/* ── Coluna Esquerda: Upload de Foto ── */}
            <div className="col-span-12 md:col-span-4 space-y-6">
              <FotoUpload
                fotoUrl={form.formData.foto_perfil}
                uploading={uploading}
                tentouEnviar={tentouEnviar}
                onChange={handleUploadFotoProcess}
                variant="cadastro"
              />
            </div>

            {/* ── Coluna Direita: Os Módulos Visuais ── */}
            <div className="col-span-12 md:col-span-8 space-y-6">

              {!userLogado ? (
                <SecaoAcessoCadastro
                  email={email}
                  senha={senha}
                  confirmarSenha={confirmarSenha}
                  tentouEnviar={tentouEnviar}
                  onEmailChange={setEmail}
                  onSenhaChange={setSenha}
                  onConfirmarSenhaChange={setConfirmarSenha}
                />
              ) : (
                <SecaoAcessoLogado
                  user={userLogado}
                  senha={senha}
                  confirmarSenha={confirmarSenha}
                  tentouEnviar={tentouEnviar}
                  inputStyle={inputStyleBase}
                  onSenhaChange={setSenha}
                  onConfirmarSenhaChange={setConfirmarSenha}
                  onLogout={async () => { await supabase.auth.signOut(); router.push('/login') }}
                />
              )}

              <SecaoOQueVoceFaz
                grupoId={form.formData.grupo_id}
                categoriaId={form.formData.categoria_id}
                habilidades={form.formData.habilidades}
                listaGrupos={categorias.listaGrupos}
                listaCategorias={categorias.listaCategorias}
                inputStyle={inputStyleBase}
                onGrupoChange={(id) => { form.handleGrupoChange(id); categorias.carregarCategorias(id) }}
                onCategoriaChange={(id) => form.set({ categoria_id: id, habilidades: [] })}
                onToggleHabilidade={(h) => form.toggleItem(h, 'habilidades')}
              />

              <SecaoDadosPessoais
                nome={form.formData.nome}
                slug={form.formData.slug}
                whatsapp={form.formData.whatsapp}
                bio={form.formData.bio}
                slugDisponivel={slugCheck.disponivel}
                checandoSlug={slugCheck.checando}
                inputStyle={inputStyleBase}
                onNomeChange={form.handleNomeChange}
                onSlugChange={form.handleSlugChange}
                onWhatsappChange={form.handleWhatsappChange}
                onBioChange={(v) => form.set({ bio: v })}
              />

              <SecaoLocalizacao
                estadoSigla={form.formData.estado_sigla}
                regiaoId={form.formData.regiao_id}
                cidadeId={form.formData.cidade_id}
                bairro={form.formData.bairro || ''} // ← Garante que sempre enviará uma string
                cidadesAtendidas={form.formData.cidades_atendidas || []} // ← Garante array
                listaEstados={loc.listaEstados}
                listaRegioes={loc.listaRegioes}
                listaCidades={loc.listaCidades}
                cidadesRegiao={loc.cidadesRegiao}
                inputStyle={inputStyleBase}
                onEstadoChange={(sigla) => { form.handleEstadoChange(sigla); loc.carregarRegioes(sigla); loc.carregarCidades(null, sigla) }}
                onRegiaoChange={(id) => { form.handleRegiaoChange(id); loc.carregarCidades(id, form.formData.estado_sigla) }}
                onCidadeChange={(id) => form.set({ cidade_id: id })}
                onBairroChange={(v) => form.set({ bairro: v })}
                onToggleCidade={(nome) => form.toggleItem(nome, 'cidades_atendidas')}
              />

              <SecaoTermos
                aceitouTermos={aceitouTermos}
                aceitouPrivacidade={aceitouPrivacidade}
                onTermosChange={setAceitouTermos}
                onPrivacidadeChange={setAceitouPrivacidade}
              />

              {/* Botão de Envio */}
              <div className="flex flex-col items-center">
                {status && (
                  <div className={`w-full mb-4 p-4 rounded-2xl text-[10px] font-black text-center uppercase tracking-wider animate-in fade-in ${status.startsWith('❌') ? 'bg-red-50 text-red-500 border border-red-100' : 'bg-blue-50 text-blue-600'
                    }`}>
                    {status}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading || uploading || calcularProgresso() < 100}
                  className={`w-full py-6 rounded-[2rem] font-bold text-[13px] uppercase tracking-widest transition-all shadow-xl ${calcularProgresso() === 100 && slugCheck.disponivel && !uploading
                    ? 'bg-blue-600 text-white shadow-blue-100 hover:bg-blue-700 active:scale-95'
                    : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                    }`}
                >
                  {loading || uploading ? 'Sincronizando...' : (modoEdicao ? 'Salvar Alterações' : (reivindicarId ? 'Assumir Perfil' : 'Finalizar Cadastro'))}
                </button>
              </div>

            </div>
          </form>
        </CadastroCard>
      </div>

      <ModalConfirmacao isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onConfirm={handleExcluirPerfil} title="Excluir Perfil?" message="Esta ação apagará seus dados permanentemente." />
    </main>
  )
}

export default function CadastroPage() {
  return <Suspense fallback={<CadastroSkeleton />}><FormularioCadastro /></Suspense>
}