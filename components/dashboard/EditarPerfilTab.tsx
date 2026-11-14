'use client'

import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import type { User } from '@supabase/supabase-js'
import type { PrestadorFormData } from '@/types/prestador'

// UI Components
import { ExternalLink, Loader2, Camera } from 'lucide-react'
import DangerZone from '@/components/account/DangerZone'
import { ErrorModal } from '@/components/ui/ErrorModal'

// Componentes Modulares (Vitrine)
import { FotoUpload } from '@/components/perfil/FotoUpload'
import { SecaoOQueVoceFaz } from '@/components/perfil/SecaoOQueVoceFaz'
import { SecaoDadosPessoais } from '@/components/perfil/SecaoDadosPessoais'
import { SecaoLocalizacao } from '@/components/perfil/SecaoLocalizacao'
import { SecaoGarantia } from '@/components/perfil/SecaoGarantia'
import { PortfolioToggle } from '@/components/dashboard/PortfolioToggle'
import { CartaoSecao, estiloCampo } from '@/components/perfil/CartaoSecao'
import EditarPerfilSkeleton from '@/components/skeletons/EditarPerfilSkeleton'

// Hooks e Utils (Laboratório)
import { usePrestadorForm } from '@/hooks/usePrestadorForm'
import { useCategorias } from '@/hooks/useCategorias'
import { useLocalizacao } from '@/hooks/useLocalizacao'
import { useSlugCheck } from '@/hooks/useSlugCheck'
import { fazerUploadFoto, removerFotoAntiga } from '@/lib/uploadFoto'

const inputStyleBase = estiloCampo

export default function EditarPerfilTab({ onSalvar }: { onSalvar?: () => void } = {}) {
  const router = useRouter()

  // ── Instanciação dos Hooks ───────────────────────────────────────────────
  const form = usePrestadorForm()
  const categorias = useCategorias()
  const loc = useLocalizacao()
  const slugCheck = useSlugCheck({ slug: form.formData.slug || '', idAtual: form.formData.id })

  const inicializadoRef = useRef(false)
  // Foto que está gravada no perfil agora. A anterior só é apagada do storage depois de salvar a nova.
  const fotoGravadaRef = useRef<string | null>(null)

  // ── Estados Locais ───────────────────────────────────────────────────────
  const [loading, setLoading] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [status, setStatus] = useState('')
  const [tentouEnviar, setTentouEnviar] = useState(false)
  const [userLogado, setUserLogado] = useState<User | null>(null)
  const [portfolioOb, setPortfolioOb] = useState(true) // Estado local sincronizado com DB

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
          fotoGravadaRef.current = perfilCarregado.foto_perfil || null
          // Carregar configuração de portfólio do Supabase
          const portfolioValue = (perfilCarregado as { portfolio_obrigatorio?: unknown }).portfolio_obrigatorio
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
  }, [categorias, form, loc, router])

  // ── Handlers de Ação ─────────────────────────────────────────────────────
  const handleUploadFotoProcess = async (file: File) => {
    setUploading(true)
    const res = await fazerUploadFoto(file, userLogado?.id || 'temp')

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

      const { id, ...restData } = {
        ...form.formData,
        cidade_id: form.formData.cidade_id || null,
        regiao_id: form.formData.regiao_id || null,
        grupo_id: form.formData.grupo_id || null,
        categoria_id: form.formData.categoria_id || null,
        cidades_atendidas: cidadesLimpo,
        user_id: userLogado?.id,
        status: 'ativo',
        // portfolio_obrigatorio não existe em usePrestadorForm/form.formData
        // — precisa ser injetado explicitamente a partir do state local
        // (portfolioOb), senão o upsert envia esse campo ausente/undefined
        // e o Postgres reaplica o DEFAULT da coluna (true), sobrescrevendo
        // o valor que o PortfolioToggle acabou de gravar no banco.
        portfolio_obrigatorio: portfolioOb,
        sessao_fotos_titulo: (form.formData.sessao_fotos_titulo || '').trim().slice(0, 60) || null,
        sessao_fotos_urls: (form.formData.sessao_fotos_urls || []).slice(0, 5),
      }

      const finalPayload = id ? { id, ...restData } : restData;

      const { error } = await supabase
        .from('prestadores')
        .upsert(finalPayload)
        .select('id')
        .single()

      if (error) throw error

      // Perfil salvo com a foto nova: agora sim a antiga pode sair do storage.
      const fotoAnterior = fotoGravadaRef.current
      fotoGravadaRef.current = form.formData.foto_perfil || null
      if (fotoAnterior && fotoAnterior !== fotoGravadaRef.current) void removerFotoAntiga(fotoAnterior)

      // O funil de ativação é interno (tabela só do admin): quem avança é uma função do banco, que só
      // muda "não enviado" para "perfil completo". Falha aqui não pode impedir o salvamento do perfil.
      if (camposObrigatoriosOk) {
        const { error: erroAtivacao } = await supabase.rpc('ativacao_marcar_perfil_completo')
        if (erroAtivacao) console.error('Não foi possível atualizar o funil de ativação:', erroAtivacao)
      }

      setStatus('Perfil atualizado com sucesso.')
      setTentouEnviar(false)
      onSalvar?.()
    } catch (err: unknown) {
      const mensagem = err instanceof Error ? err.message : 'verifique os dados.'
      setStatus(`Erro: ${mensagem}`)
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
        <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex min-w-0 flex-col gap-1">
            <p className="text-xs font-bold uppercase tracking-widest text-blue-600">Dados profissionais</p>
            <h2 id="profile-settings-title" className="text-balance text-xl font-black tracking-tight text-slate-900 sm:text-2xl">Seu perfil na vitrine</h2>
            <p className="max-w-xl text-sm leading-relaxed text-slate-500">Mantenha seus dados em dia: é com eles que os clientes encontram e chamam você.</p>
          </div>
          {form.formData.id && form.formData.slug && (
            <Link
              href={`/${form.formData.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 self-start rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 shadow-sm transition-colors hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-100"
            >
              <ExternalLink size={16} aria-hidden="true" />
              Ver meu perfil público
            </Link>
          )}
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

            {userLogado && (
              <section className="flex flex-col gap-3 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm" aria-label="Conta conectada">
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-500">Conta conectada</p>
                  <p className="mt-0.5 truncate text-sm font-bold text-slate-800">{userLogado.email}</p>
                </div>
                <Link href="/login" className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-bold text-slate-600 transition-colors hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-100">
                  Trocar de conta
                </Link>
              </section>
            )}
          </div>

          <div className="flex min-w-0 flex-col gap-6 lg:col-span-8">
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
              regiaoId={form.formData.regiao_id ?? ''}
              cidadeId={form.formData.cidade_id ?? ''}
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

            <SecaoGarantia
              garantiaDias={form.formData.garantia_dias}
              onChange={(dias) => form.set({ garantia_dias: dias })}
            />

            {form.formData.id && (
              <CartaoSecao
                titulo="Ao registrar um trabalho"
                descricao="Escolha como prefere começar. Essa opção é salva na hora."
                icone={<Camera size={20} />}
              >
                <PortfolioToggle
                  prestadorId={form.formData.id}
                  inicial={portfolioOb}
                  onSuccess={(novoValor) => {
                    // Atualizar estado LOCAL imediatamente após sucesso no Supabase
                    setPortfolioOb(novoValor)
                    setStatus(`Registro com fotos ${novoValor ? 'ligado' : 'desligado'} como opção inicial.`)
                    setTimeout(() => setStatus(''), 3000)
                  }}
                />
              </CartaoSecao>
            )}

            {/* Barra de salvar sempre ao alcance, mesmo no fim de um formulário longo */}
            <div className="sticky bottom-3 z-30 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white/95 p-3 shadow-lg shadow-slate-200/60 backdrop-blur">
              {status && (
                <div
                  role="status"
                  className={`w-full rounded-xl border px-4 py-3 text-center text-sm font-bold leading-relaxed animate-in fade-in ${
                    status.startsWith('Erro:')
                      ? 'border-red-100 bg-red-50 text-red-700'
                      : 'border-blue-100 bg-blue-50 text-blue-700'
                  }`}
                >
                  {status}
                </div>
              )}

              <button
                type="submit"
                disabled={salvando || uploading}
                className="flex min-h-12 w-full items-center justify-center gap-3 rounded-xl bg-blue-600 px-6 py-3 text-base font-black text-white shadow-sm transition-colors hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {salvando ? <><Loader2 size={18} className="animate-spin" aria-hidden="true" /> Salvando...</> : 'Salvar alterações'}
              </button>
            </div>

            <DangerZone audience="prestador" />
          </div>
        </form>
      </div>

    </section>
  )
}
