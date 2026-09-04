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
import AcompanhamentoSkeleton       from '@/components/skeletons/AcompanhamentoSkeleton'

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

  // Fluxo sem_fotos: travado na criação do projeto (ver migration
  // portfolio_projetos.sem_fotos). Quando true, a página usa a timeline
  // simplificada e desativa a seção de garantia (decisão de produto —
  // garantia depende de evidência fotográfica para abertura de caso).
  const semFotos = projeto?.sem_fotos ?? false

  // "Pronto para avaliar" — mesma regra usada em useServicosCliente.ts
  // (estaProntoParaAvaliar): fluxo com fotos depende da foto 3 enviada,
  // fluxo sem_fotos depende do prestador ter marcado como concluído.
  // Antes, essa condição só liberava o link de avaliação enviado pelo
  // prestador via WhatsApp; agora também libera um botão direto aqui,
  // sem tirar a opção do prestador continuar enviando o link manualmente.
  const podeAvaliar = semFotos
    ? !!projeto?.marcado_concluido_at
    : fotosOrdenadas.some(f => f.ordem === 3)

  const {
    caso: casoGarantia,
    loading: loadingCaso,
    recarregar: recarregarCaso,
    temGarantiaAtiva,          // derivado pelo hook — ativo só para status em andamento
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
  // Botão só aparece enquanto ainda não foi avaliado (status='em_execucao')
  // — depois de finalizado, a avaliação já foi feita e o botão some,
  // mesmo comportamento do link de WhatsApp que já existia.
  const mostrarBotaoAvaliar = podeAvaliar && projeto.status === 'em_execucao'

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans antialiased">
      <HeaderCliente nomeCliente={projeto.cliente_nome} />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 pt-20 md:pt-36 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="flex flex-col lg:flex-row lg:items-start gap-6">

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
            <RodapeSeguranca />
          </aside>

          <div className="flex-1 min-w-0 space-y-5">
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

            {/* Botão direto para avaliar — não depende mais só do link
                enviado pelo prestador via WhatsApp (que continua existindo
                como alternativa). Mesma condição nos dois fluxos. */}
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

            {/* Garantia elegível por garantia_dias (verificarElegibilidadeGarantia),
                independente de sem_fotos */}
            {projetoFinalizado && clienteUserId && (
              <GarantiaSecaoCliente
                projetoId={projeto.id}
                clienteUserId={clienteUserId}
                caso={casoGarantia}
                loadingCaso={loadingCaso}
                recarregar={recarregarCaso}
              />
            )}

            <div className="lg:hidden">
              <RodapeSeguranca />
            </div>
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

