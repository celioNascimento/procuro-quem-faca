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
import { SecaoGarantia } from '@/components/perfil/SecaoGarantia'
import { PortfolioToggle } from '@/components/dashboard/PortfolioToggle'
import EditarPerfilSkeleton from '@/components/skeletons/EditarPerfilSkeleton'

// Hooks e Utils (Laboratório)
import { usePrestadorForm } from '@/hooks/usePrestadorForm'
import { useCategorias } from '@/hooks/useCategorias'
import { useLocalizacao } from '@/hooks/useLocalizacao'
import { useSlugCheck } from '@/hooks/useSlugCheck'
import { fazerUploadFoto } from '@/lib/uploadFoto'

const inputStyleBase = `w-full px-5 py-4 rounded-2xl border border-slate-100 outline-none transition-all font-medium text-[14px] text-slate-800 bg-white shadow-sm placeholder-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-50 disabled:bg-slate-50 disabled:text-slate-400`

export default function EditarPerfilTab({ onSalvar }: { onSalvar?: () => void } = {}) {
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
  const [portfolioOb, setPortfolioOb] = useState(true) // Estado local sincronizado com DB

  const [isModalExcluirOpen, setIsModalExcluirOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
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
          // Carregar configuração de portfólio do Supabase
          const portfolioValue = (perfilCarregado as any).portfolio_obrigatorio
          setPortfolioOb(typeof portfolioValue === 'boolean' ? portfolioValue : true)
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
      setStatus('Foto atualizada com sucesso.')
      setTimeout(() => setStatus(''), 2000)
    } else if (res.error === 'TOO_LARGE') {
      setErrorModal(prev => ({ ...prev, show: true, title: 'Arquivo muito pesado', message: `Sua imagem possui ${res.sizeMB.toFixed(1)}MB. O limite é de 10MB.` }))
    } else {
      setErrorModal(prev => ({ ...prev, show: true, title: 'Erro no Upload', message: 'Não conseguimos processar sua imagem. Tente novamente ou use outro arquivo.' }))
    }
    setUploading(false)
  }

  const handleExcluirContaTotal = async () => {
    setDeleting(true)
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

      await fetch('/api/delete-account', { method: 'POST' })
      await supabase.auth.signOut()
      router.push('/')
      router.refresh()
    } catch (err) {
      setStatus('Erro: não foi possível concluir a exclusão.')
      setDeleting(false)
    }
  }

  const handleSalvar = async (e: React.FormEvent) => {
    e.preventDefault()
    setTentouEnviar(true)

    if (!form.formData.foto_perfil) {
      setStatus('Erro: a foto de perfil é obrigatória.')
      return
    }
    if (!slugCheck.disponivel) {
      setStatus('Erro: URL indisponível. Escolha outra.')
      return
    }

    setSalvando(true)
    setStatus('')

    try {
      const cidadeSedeNome = loc.listaCidades.find(c => String(c.id) === String(form.formData.cidade_id))?.nome
      const cidadesLimpo = (form.formData.cidades_atendidas || []).filter(c => c !== cidadeSedeNome)

      const camposObrigatoriosOk =
        !!form.formData.nome &&
        !!form.formData.foto_perfil &&
        !!form.formData.whatsapp &&
        !!form.formData.slug &&
        !!form.formData.cidade_id &&
        !!form.formData.grupo_id &&
        !!form.formData.categoria_id

      const statusAtual = form.formData.ativacao_status
      const novoAtivacaoStatus =
        camposObrigatoriosOk && (statusAtual === 'nao_enviado' || !statusAtual)
          ? 'perfil_completo'
          : statusAtual

      const { id, ...restData } = {
        ...form.formData,
        cidade_id: form.formData.cidade_id || null,
        regiao_id: form.formData.regiao_id || null,
        grupo_id: form.formData.grupo_id || null,
        categoria_id: form.formData.categoria_id || null,
        cidades_atendidas: cidadesLimpo,
        user_id: userLogado?.id,
        status: 'ativo',
        ativacao_status: novoAtivacaoStatus,
        // portfolio_obrigatorio não existe em usePrestadorForm/form.formData
        // — precisa ser injetado explicitamente a partir do state local
        // (portfolioOb), senão o upsert envia esse campo ausente/undefined
        // e o Postgres reaplica o DEFAULT da coluna (true), sobrescrevendo
        // o valor que o PortfolioToggle acabou de gravar no banco.
        portfolio_obrigatorio: portfolioOb,
      }

      const finalPayload = id ? { id, ...restData } : restData;

      const { error } = await supabase
        .from('prestadores')
        .upsert(finalPayload)
        .select('id')
        .single()

      if (error) throw error

      if (novoAtivacaoStatus !== statusAtual) {
        form.set({ ativacao_status: novoAtivacaoStatus })
      }

      setStatus('Perfil atualizado com sucesso.')
      setTentouEnviar(false)
      onSalvar?.()
    } catch (err: any) {
      setStatus(`Erro: ${err.message || 'verifique os dados.'}`)
    } finally {
      setSalvando(false)
      setTimeout(() => setStatus(''), 3000)
    }
  }

  // ── Renderização ─────────────────────────────────────────────────────────
  if (loading) return <EditarPerfilSkeleton />

  return (
    <section className="pb-12 sm:pb-16" aria-labelledby="profile-settings-title">
      <ErrorModal
        show={errorModal.show}
        title={errorModal.title}
        message={errorModal.message}
        onClose={() => setErrorModal(prev => ({ ...prev, show: false }))}
      />

      <div className="flex flex-col gap-6 animate-in fade-in duration-500 sm:gap-8">
        <header className="flex flex-col gap-1.5">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-600">Dados profissionais</p>
          <h2 id="profile-settings-title" className="text-balance text-xl font-black tracking-tight text-slate-900 sm:text-2xl">Configurações do perfil</h2>
          <p className="text-sm font-medium leading-relaxed text-slate-500">Mantenha sua vitrine completa para transmitir confiança aos clientes.</p>
        </header>

        <form onSubmit={handleSalvar} className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12 lg:gap-8">
          <div className="flex flex-col gap-6 lg:sticky lg:top-48 lg:col-span-4">
            <FotoUpload
              fotoUrl={form.formData.foto_perfil}
              uploading={uploading}
              tentouEnviar={tentouEnviar}
              onChange={handleUploadFotoProcess}
              variant="dashboard"
            />
          </div>

          <div className="flex min-w-0 flex-col gap-6 lg:col-span-8">
            {userLogado && (
              <section className="flex flex-col gap-4 rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-6" aria-label="Conta conectada">
                <div className="min-w-0 text-left">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Conta conectada</p>
                  <p className="mt-1 truncate text-sm font-bold text-slate-700">{userLogado.email}</p>
                </div>
                <Link href="/login" className="flex min-h-11 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-[10px] font-black uppercase tracking-widest text-slate-500 transition-colors hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-100">
                  Trocar acesso
                </Link>
              </section>
            )}

            {/* Seção de configuração de portfólio */}
            {form.formData.id && (
              <section className="flex flex-col gap-4 rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm sm:p-6" aria-label="Configuração de portfólio">
                <div className="flex flex-col gap-1.5">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Portfólio</p>
                  <h3 className="text-sm font-black text-slate-900">Fotos por padrão</h3>
                  <p className="text-[13px] font-medium leading-relaxed text-slate-500">Defina se novos serviços já nascem pedindo fotos. Você pode dispensar em projetos específicos a qualquer momento.</p>
                </div>
                <PortfolioToggle
                  prestadorId={form.formData.id}
                  inicial={portfolioOb}
                  onSuccess={(novoValor) => {
                    // Atualizar estado LOCAL imediatamente após sucesso no Supabase
                    setPortfolioOb(novoValor)
                    setStatus(`Configuração de fotos ${novoValor ? 'ativada' : 'desativada'} com sucesso!`)
                    setTimeout(() => setStatus(''), 3000)
                  }}
                />
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

            <SecaoGarantia
              garantiaDias={form.formData.garantia_dias}
              onChange={(dias) => form.set({ garantia_dias: dias })}
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

            <div className="flex flex-col gap-4 pt-2">
              {status && (
                <div
                  role="status"
                  className={`w-full rounded-2xl border p-4 text-center text-xs font-bold leading-relaxed animate-in fade-in ${
                    status.startsWith('Erro:')
                      ? 'border-red-100 bg-red-50 text-red-600'
                      : 'border-blue-100 bg-blue-50 text-blue-600'
                  }`}
                >
                  {status}
                </div>
              )}

              <button
                type="submit"
                disabled={salvando || uploading}
                className="flex min-h-14 w-full items-center justify-center gap-3 rounded-2xl bg-blue-600 px-6 py-4 text-[11px] font-black uppercase tracking-[0.18em] text-white shadow-lg shadow-blue-100 transition-colors hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {salvando ? <><Loader2 size={18} className="animate-spin" aria-hidden="true" /> Salvando...</> : 'Atualizar meu perfil'}
              </button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => setIsModalExcluirOpen(true)}
                  className="min-h-11 rounded-xl px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-400 transition-colors hover:bg-red-50 hover:text-red-500 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-red-100"
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
    </section>
  )
}
