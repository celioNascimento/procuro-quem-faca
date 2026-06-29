// components/EditarPerfilTab.tsx
'use client'

import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import type { User } from '@supabase/supabase-js'
import type { PrestadorFormData } from '@/types/prestador'

// UI Components
import ModalConfirmacao from '@/components/ui/ModalConfirmacao'
import { Loader2 } from 'lucide-react'
import { ErrorModal } from '@/components/ui/ErrorModal'

// Componentes Modulares (Vitrine)
import { FotoUpload } from '@/components/perfil/FotoUpload'
import { SecaoOQueVoceFaz } from '@/components/perfil/SecaoOQueVoceFaz'
import { SecaoDadosPessoais } from '@/components/perfil/SecaoDadosPessoais'
import { SecaoLocalizacao } from '@/components/perfil/SecaoLocalizacao'

// Hooks e Utils (Laboratório)
import { usePrestadorForm } from '@/hooks/usePrestadorForm'
import { useCategorias } from '@/hooks/useCategorias'
import { useLocalizacao } from '@/hooks/useLocalizacao'
import { useSlugCheck } from '@/hooks/useSlugCheck'
import { fazerUploadFoto } from '@/lib/uploadFoto'

const inputStyleBase = `w-full px-5 py-4 rounded-2xl border border-slate-100 outline-none transition-all font-medium text-[14px] text-slate-800 bg-white shadow-sm placeholder-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-50 disabled:bg-slate-50 disabled:text-slate-400`

export default function EditarPerfilTab() {
  const router = useRouter()

  // ── Instanciação dos Hooks ───────────────────────────────────────────────
  const form = usePrestadorForm()
  const categorias = useCategorias()
  const loc = useLocalizacao()
  const slugCheck = useSlugCheck({ slug: form.formData.slug || '', idAtual: form.formData.id })

  const inicializadoRef = useRef(false)

  // ── Estados Locais ───────────────────────────────────────────────────────
  const [loading, setLoading] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [status, setStatus] = useState('')
  const [tentouEnviar, setTentouEnviar] = useState(false)
  const [userLogado, setUserLogado] = useState<User | null>(null)

  const [isModalExcluirOpen, setIsModalExcluirOpen] = useState(false)
  const [errorModal, setErrorModal] = useState({ show: false, title: '', message: '' })

  // ── Inicialização ────────────────────────────────────────────────────────
  useEffect(() => {

    if (inicializadoRef.current) return  // ← evita rodar duas vezes
    inicializadoRef.current = true

    async function inicializar() {
      try {
        setLoading(true)
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) return router.push('/login')
        setUserLogado(session.user)

        // Busca perfil + dados base ao mesmo tempo
        const [, , perfilResult] = await Promise.all([
          categorias.carregarGrupos(),
          loc.carregarEstados(),
          supabase
            .from('prestadores')
            .select('*')
            .eq('user_id', session.user.id)
            .maybeSingle()
        ])

        const perfilCarregado = perfilResult.data as PrestadorFormData | null

        if (perfilCarregado) {
          // Busca dependentes do perfil ao mesmo tempo
          await Promise.all([
            perfilCarregado.grupo_id
              ? categorias.carregarCategorias(perfilCarregado.grupo_id)
              : Promise.resolve(),
            loc.carregarRegioes(perfilCarregado.estado_sigla || 'PR'),
            loc.carregarCidades(
              perfilCarregado.regiao_id,
              perfilCarregado.estado_sigla || 'PR'
            )
          ])
          form.carregarPerfil(perfilCarregado)
        } else {
          await Promise.all([
            loc.carregarRegioes('PR'),
            loc.carregarCidades(null, 'PR')
          ])
        }
      } catch (err) {
        console.error('Erro inicialização:', err)
      } finally {
        setLoading(false)
      }
    }

    inicializar()
  }, []) 

  // ── Handlers de Ação ─────────────────────────────────────────────────────
  const handleUploadFotoProcess = async (file: File) => {
    setUploading(true)
    const res = await fazerUploadFoto(file, userLogado?.id || 'temp', form.formData.foto_perfil || undefined)

    if (res.ok) {
      form.set({ foto_perfil: res.url })
      setStatus('✅ Foto atualizada!')
      setTimeout(() => setStatus(''), 2000)
    } else if (res.error === 'TOO_LARGE') {
      setErrorModal(prev => ({ ...prev, show: true, title: 'Arquivo muito pesado', message: `Sua imagem possui ${res.sizeMB.toFixed(1)}MB. O limite é de 10MB.` }))
    } else {
      setErrorModal(prev => ({ ...prev, show: true, title: 'Erro no Upload', message: 'Não conseguimos processar sua imagem. Tente novamente ou use outro arquivo.' }))
    }
    setUploading(false)
  }

  const handleExcluirContaTotal = async () => {
    setStatus('Excluindo tudo...')
    try {
      if (form.formData.foto_perfil) {
        try {
          const bucketMarker = '/object/public/fotos-perfil/'
          const markerIdx = form.formData.foto_perfil.indexOf(bucketMarker)
          if (markerIdx !== -1) {
            const oldPath = form.formData.foto_perfil.slice(markerIdx + bucketMarker.length).split('?')[0]
            if (oldPath) await supabase.storage.from('fotos-perfil').remove([oldPath])
          }
        } catch { /* silencioso */ }
      }

      if (userLogado) {
        const { error: dbError } = await supabase.from('prestadores').delete().eq('user_id', userLogado.id)
        if (dbError) throw dbError
      }

      await supabase.auth.signOut()
      router.push('/')
      router.refresh()
    } catch (err) {
      setStatus('❌ Erro na exclusão')
    }
  }

 const handleSalvar = async (e: React.FormEvent) => {
    e.preventDefault()
    setTentouEnviar(true)

    if (!form.formData.foto_perfil) {
      setStatus('❌ A foto de perfil é obrigatória.')
      return
    }
    if (!slugCheck.disponivel) {
      setStatus('❌ URL indisponível. Escolha outra.')
      return
    }

    setSalvando(true)
    setStatus('')

    try {
      const cidadeSedeNome = loc.listaCidades.find(c => String(c.id) === String(form.formData.cidade_id))?.nome
      const cidadesLimpo = (form.formData.cidades_atendidas || []).filter(c => c !== cidadeSedeNome)

      // Verifica se todos os campos obrigatórios da vitrine estão preenchidos
      const camposObrigatoriosOk =
        !!form.formData.nome &&
        !!form.formData.foto_perfil &&
        !!form.formData.whatsapp &&
        !!form.formData.slug &&
        !!form.formData.cidade_id &&
        !!form.formData.grupo_id &&
        !!form.formData.categoria_id

      // Só "promove" o status para perfil_completo se ainda não passou por outra etapa do funil de ativação.
      // Evita sobrescrever estados como 'respondeu_positivo' / 'sem_whatsapp' que vêm de outro fluxo.
      const statusAtual = form.formData.ativacao_status
      const novoAtivacaoStatus =
        camposObrigatoriosOk && (statusAtual === 'nao_enviado' || !statusAtual)
          ? 'perfil_completo'
          : statusAtual

      // 1. Montamos os dados desestruturando o 'id' para fora do restante (restData)
      const { id, ...restData } = {
        ...form.formData,
        cidade_id: form.formData.cidade_id || null,
        regiao_id: form.formData.regiao_id || null,
        grupo_id: form.formData.grupo_id || null,
        categoria_id: form.formData.categoria_id || null,
        cidades_atendidas: cidadesLimpo,
        user_id: userLogado?.id,
        status: form.formData.status || 'ativo',
        ativacao_status: novoAtivacaoStatus,
      }

      // 2. Se houver ID (edição), anexamos ele de volta. Se não (criação), mandamos sem ID.
      const finalPayload = id ? { id, ...restData } : restData;

      const { error } = await supabase
        .from('prestadores')
        .upsert(finalPayload)
        .select('id')
        .single()

      if (error) throw error

      // Reflete o novo status no estado local, pra UI já refletir sem precisar recarregar o perfil
      if (novoAtivacaoStatus !== statusAtual) {
        form.set({ ativacao_status: novoAtivacaoStatus })
      }

      setStatus('✅ Perfil Atualizado!')
      setTentouEnviar(false)
    } catch (err: any) {
      setStatus(`❌ Erro: ${err.message || 'Verifique os dados'}`)
    } finally {
      setSalvando(false)
      setTimeout(() => setStatus(''), 3000)
    }
  }

  // ── Renderização ─────────────────────────────────────────────────────────
  if (loading) return (
    <div className="p-20 text-center animate-pulse font-bold text-slate-300 uppercase tracking-widest">
      Sincronizando perfil...
    </div>
  )

  return (
    <main className="min-h-screen bg-[#F8FAFC] pb-24 font-sans antialiased">
      <ErrorModal
        show={errorModal.show}
        title={errorModal.title}
        message={errorModal.message}
        onClose={() => setErrorModal(prev => ({ ...prev, show: false }))}
      />

      <div className="max-w-5xl mx-auto px-2 md:px-4 pt-2 md:pt-4 space-y-6 md:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">

        <header className="border-b border-slate-100 pb-6 md:pb-8">
          <h2 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">Configurações de Perfil</h2>
          <p className="text-slate-400 text-[11px] font-bold uppercase tracking-widest mt-2">Personalize sua vitrine profissional</p>
        </header>

        <form onSubmit={handleSalvar} className="grid grid-cols-1 md:grid-cols-12 gap-8">

          {/* ── Coluna Esquerda: Foto ── */}
          <div className="col-span-1 md:col-span-4 space-y-6">
            <FotoUpload
              fotoUrl={form.formData.foto_perfil}
              uploading={uploading}
              tentouEnviar={tentouEnviar}
              onChange={handleUploadFotoProcess}
              variant="dashboard" // Estilo levemente diferente configurado no componente
            />
          </div>

          {/* ── Coluna Direita: Campos ── */}
          <div className="col-span-1 md:col-span-8 space-y-6">

            {userLogado && (
              <section className="bg-white p-6 rounded-[2rem] border border-slate-100 flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm">
                <div className="text-center md:text-left">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Conta conectada</p>
                  <p className="font-bold text-slate-700 text-sm">{userLogado.email}</p>
                </div>
                <Link href="/login" className="px-5 py-2.5 bg-slate-50 text-slate-500 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-slate-100 transition-all border border-slate-100">
                  Trocar Acesso
                </Link>
              </section>
            )}

            <SecaoOQueVoceFaz
              grupoId={form.formData.grupo_id}
              categoriaId={form.formData.categoria_id}
              habilidades={form.formData.habilidades || []}
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
              bairro={form.formData.bairro || ''}
              cidadesAtendidas={form.formData.cidades_atendidas || []}
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

            {/* Ações Finais */}
            <div className="space-y-4 pt-4">
              {status && (
                <div className={`w-full p-4 rounded-2xl text-[10px] font-black text-center uppercase tracking-wider animate-in fade-in ${status.startsWith('❌') ? 'bg-red-50 text-red-500 border border-red-100' : 'bg-blue-50 text-blue-600'
                  }`}>
                  {status}
                </div>
              )}

              <button
                type="submit"
                disabled={salvando || uploading}
                className="w-full py-6 bg-blue-600 text-white rounded-[2rem] font-bold uppercase tracking-[0.2em] text-[13px] shadow-2xl hover:bg-blue-700 active:scale-95 transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-3"
              >
                {salvando ? <><Loader2 size={18} className="animate-spin" /> Salvando...</> : 'Atualizar Meu Perfil'}
              </button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => setIsModalExcluirOpen(true)}
                  className="text-[10px] font-bold text-slate-300 uppercase tracking-widest hover:text-red-400 transition-colors py-4"
                >
                  Excluir meu perfil permanentemente
                </button>
              </div>
            </div>

          </div>
        </form>
      </div>

      <ModalConfirmacao
        isOpen={isModalExcluirOpen}
        onClose={() => setIsModalExcluirOpen(false)}
        onConfirm={handleExcluirContaTotal}
        title="Deseja excluir seu perfil?"
        message="Atenção: Seu perfil profissional, fotos e histórico serão apagados para sempre. Esta ação não tem volta."
      />
    </main>
  )
}