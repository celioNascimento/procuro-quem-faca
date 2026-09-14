// app/acompanhamento/[token]/page.tsx

'use client'
import { use, useState, useEffect } from 'react'
import Link                         from 'next/link'
import { Star, ArrowRight }         from 'lucide-react'
import { useAcompanhamento }        from '@/hooks/useAcompanhamento'
import { useCasoGarantiaDoProjeto } from '@/hooks/useCasoGarantiaDoProjeto'
import { supabase }                 from '@/lib/supabase'
import HeaderCliente                from '@/components/perfil/HeaderCliente'
import { CardPrestador }            from '@/components/acompanhamento/CardPrestador'
import { LinhaDeTempo }             from '@/components/acompanhamento/LinhaDeTempo'
import { LinhaDeTempoSemFotos }     from '@/components/acompanhamento/LinhaDeTempoSemFotos'
import { StatusMini }               from '@/components/acompanhamento/StatusMini'
import { ModalDiscussao }           from '@/components/acompanhamento/ModalDiscussao'
import { RodapeSeguranca }          from '@/components/acompanhamento/RodapeSeguranca'
import { GarantiaSecaoCliente }     from '@/components/acompanhamento/garantia/GarantiaSecaoCliente'
import { AdCardPainelCliente }      from '@/components/painel/AdCardPainelCliente'
import AcompanhamentoSkeleton       from '@/components/skeletons/AcompanhamentoSkeleton'
import { ContextualHelp }            from '@/components/help/HelpCenter'

export default function PaginaAcompanhamento({
  params: paramsPromise,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = use(paramsPromise)

  useEffect(() => {
    window.history.scrollRestoration = 'manual'
    const irParaTopo = () => window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
    irParaTopo()
    const frame = requestAnimationFrame(() => {
      irParaTopo()
      requestAnimationFrame(irParaTopo)
    })
    return () => cancelAnimationFrame(frame)
  }, [token])

  const {
    projeto, comentarios, fotosOrdenadas, temConclusao, labelEtapaAtual,
    loading, mounted, fotoSelecionada, setFotoSelecionada,
    novoComentario, setNovoComentario, enviandoComentario,
    handleShare, handleEnviarComentario,
  } = useAcompanhamento(token)

  const semFotos = projeto?.sem_fotos ?? false

  const podeAvaliar = semFotos
    ? !!projeto?.marcado_concluido_at
    : fotosOrdenadas.some(f => f.ordem === 3)

  const {
    caso: casoGarantia,
    loading: loadingCaso,
    recarregar: recarregarCaso,
    temGarantiaAtiva,
  } = useCasoGarantiaDoProjeto(projeto?.id ?? null)

  const [clienteUserId, setClienteUserId] = useState<string | null>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setClienteUserId(data.user?.id ?? null))
  }, [])

  if (!mounted || loading) {
    return <AcompanhamentoSkeleton />
  }

  if (!projeto) return null

  const projetoFinalizado = projeto.status === 'finalizado'
  const mostrarBotaoAvaliar = podeAvaliar && projeto.status === 'em_execucao'

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans antialiased">
      <HeaderCliente nomeCliente={projeto.cliente_nome} />

      {/*
        AJUSTE 1: pt-16 → pt-24 no mobile.
        O header fixo tem ~56-64px de altura; com pt-16 (64px) o card ficava
        colado. pt-24 (96px) abre o respiro necessário sem mexer no desktop
        (md:pt-28 permanece igual).
      */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 pt-24 md:pt-28 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="flex flex-col lg:flex-row lg:items-start gap-3 lg:gap-6">

          <aside className="w-full lg:w-80 shrink-0 lg:sticky lg:top-32 space-y-4">
            <CardPrestador
              projeto={projeto}
              onShare={handleShare}
              temGarantiaAtiva={temGarantiaAtiva}
            />
            {temConclusao && (
              <StatusMini
                labelEtapaAtual={labelEtapaAtual}
                totalFotos={fotosOrdenadas.length}
                temGarantiaAtiva={temGarantiaAtiva}
                statusGarantia={casoGarantia?.status}
              />
            )}
            {/* Rodapé visível só em desktop — em mobile aparece no fim
                da coluna principal para respeitar o fluxo de leitura. */}
            <div className="hidden lg:block">
              <RodapeSeguranca />
            </div>
          </aside>

          <div className="flex-1 min-w-0 space-y-5">

            {/*
              AJUSTE 2: AdCard + LinhaDeTempo dentro de um wrapper com gap-3
              em vez de herdar o space-y-5 da coluna pai.
              O anúncio e a linha do tempo ficam visualmente agrupados (12px)
              enquanto o restante dos cards mantém o espaçamento original (20px).
            */}
            <div className="flex flex-col gap-3">
              <AdCardPainelCliente
                servicos={[]}
                prestadorId={projeto.prestador_id}
              />

              {semFotos ? (
                <LinhaDeTempoSemFotos
                  status={projeto.status}
                  aceitoEm={projeto.aceito_at ?? null}
                  marcadoConcluidoEm={projeto.marcado_concluido_at ?? null}
                />
              ) : (
                <LinhaDeTempo
                  fotosOrdenadas={fotosOrdenadas}
                  comentarios={comentarios}
                  labelEtapaAtual={labelEtapaAtual}
                  status={projeto.status}
                  onFotoClick={setFotoSelecionada}
                  temGarantiaAtiva={temGarantiaAtiva}
                />
              )}
            </div>

            {mostrarBotaoAvaliar && (
              <Link
                href={`/avaliar/${projeto.avaliacao_token}`}
                className="flex w-full items-center gap-4 rounded-[2rem] bg-blue-600 p-5 text-left shadow-lg shadow-blue-100 transition-transform hover:-translate-y-0.5 active:translate-y-0 animate-in fade-in duration-500 sm:p-6"
              >
                <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center shrink-0">
                  <Star size={22} className="text-white" fill="white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-black text-sm uppercase italic tracking-tight leading-none">
                    Serviço concluído
                  </p>
                  <p className="text-blue-200 text-[11px] font-medium mt-1">Toque para avaliar e concluir</p>
                </div>
                <ArrowRight size={20} className="text-white/70 shrink-0" />
              </Link>
            )}

            {projeto.avaliacoes_clientes?.[0] && (
              <section className="rounded-[2rem] border border-emerald-100 bg-emerald-50/70 p-6" aria-labelledby="feedback-prestador">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-700">Feedback do prestador</p>
                    <h2 id="feedback-prestador" className="mt-1 text-lg font-black uppercase italic tracking-tight text-slate-800">Avaliação sobre o cliente</h2>
                  </div>
                  <div className="flex items-center gap-1 rounded-full bg-white px-3 py-2 text-emerald-700 shadow-sm" aria-label={`Nota ${projeto.avaliacoes_clientes[0].nota} de 5`}>
                    {Array.from({ length: 5 }, (_, index) => (
                      <Star key={index} size={14} fill={index < projeto.avaliacoes_clientes![0].nota ? 'currentColor' : 'none'} />
                    ))}
                  </div>
                </div>
                {projeto.avaliacoes_clientes[0].motivos?.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {projeto.avaliacoes_clientes[0].motivos.map((motivo) => (
                      <span key={motivo} className="rounded-full border border-emerald-100 bg-white px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide text-slate-600">{motivo}</span>
                    ))}
                  </div>
                )}
                <p className="mt-4 text-[10px] font-medium uppercase tracking-wide text-slate-400">
                  Registrada em {new Date(projeto.avaliacoes_clientes[0].created_at).toLocaleDateString('pt-BR')}
                </p>
              </section>
            )}

            {projetoFinalizado && clienteUserId && (
              <GarantiaSecaoCliente
                projetoId={projeto.id}
                clienteUserId={clienteUserId}
                caso={casoGarantia}
                loadingCaso={loadingCaso}
                recarregar={recarregarCaso}
              />
            )}

            {/* Rodapé em mobile — no desktop está na aside. */}
            <div className="lg:hidden">
              <RodapeSeguranca />
            </div>

            <ContextualHelp
              context="acompanhamento"
              title="Dúvidas sobre este acompanhamento?"
            />
          </div>

        </div>
      </main>

      {fotoSelecionada && (
        <ModalDiscussao
          foto={fotoSelecionada}
          projeto={projeto}
          comentarios={comentarios}
          novoComentario={novoComentario}
          setNovoComentario={setNovoComentario}
          enviando={enviandoComentario}
          onEnviar={handleEnviarComentario}
          onClose={() => setFotoSelecionada(null)}
        />
      )}
    </div>
  )
}
