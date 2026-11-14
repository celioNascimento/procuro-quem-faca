'use client'
// app/prestadores/page.tsx

export const dynamic = 'force-dynamic'

import { Suspense, useEffect, useState } from 'react'
import { usePrestadores } from '@/hooks/usePrestadores'
import { useFiltrosParams } from '@/hooks/useFiltrosParams'
import { useFiltrosPrestadores } from '@/hooks/useFiltrosPrestadores'
import { useSession } from '@/hooks/useSession'
import { useRestaurarScroll } from '@/hooks/useRestaurarScroll'
import Header from '@/components/Header'
import { AdCard } from '@/components/ads/AdCard'
import { FiltroSidebar } from '@/components/filtros/FiltroSidebar'
import { FiltroBottomSheet } from '@/components/filtros/FiltroBottomSheet'
import { CidadeDaBusca } from '@/components/busca/CidadeDaBusca'
import { ConviteLocalizacao } from '@/components/busca/ConviteLocalizacao'
import { ResultadosPaginados, RESULTADOS_POR_VEZ } from '@/components/busca/ResultadosPaginados'
import { MapPin, AlertCircle } from 'lucide-react'
import { getTituloBusca } from '@/lib/prestadorUtils'
import { quantidadeVisivelSalva } from '@/lib/navegacao'
import { useLocation } from '@/lib/contexts/LocationContext'
import { ListaSkeleton } from '@/components/skeletons/ListaSkeletonPrestadores'
import { buscarAnuncioTopoBusca } from '@/lib/services/anunciosPublicos.service'
import type { Anuncio } from '@/types/ads'

// ─── ListaConteudo ─────────────────────────────────────────────────────────

function SidebarCarregando() {
  return (
    <div className="space-y-3" aria-hidden="true">
      {[0, 1, 2].map(i => (
        <div key={i} className="h-12 animate-pulse rounded-2xl border border-slate-100 bg-white" />
      ))}
    </div>
  )
}

function ListaConteudo() {
  const {
    queryBusca, filtroHab, filtroCidade, filtroEstado, filtroRegiao, filtroGrupo, filtroCategoria, ampliar,
  } = useFiltrosParams()

  const {
    prestadoresBase,
    prestadoresExibidos,
    estadosDisponiveis,
    regioesDisponiveis,
    cidadesDisponiveis,
    gruposDisponiveis,
    categoriasDisponiveis,
    loading,
    erro,
    cidadeNome,
    origemCidade,
    cidadeFiltroId,
    recarregar,
  } = usePrestadores()

  const { totalAtivos, aplicar, limparFiltros, verOutrasCidades, voltarParaMinhaCidade } = useFiltrosPrestadores()
  const { cidadeAtual } = useLocation()

  // Voltar do perfil devolve o usuário ao ponto da lista onde estava.
  useRestaurarScroll(!loading)

  const session   = useSession()
  const temFiltro = totalAtivos > 0

  // Muda sempre que a busca muda: a lista (ResultadosPaginados) recomeça nos 10 primeiros.
  const assinaturaBusca = JSON.stringify([
    queryBusca, filtroHab, filtroCidade, filtroEstado, filtroRegiao, filtroGrupo, filtroCategoria,
    ampliar, cidadeAtual?.id ?? null,
  ])
  // Ao voltar do perfil, reabre com a quantidade que estava aberta (só para a mesma busca).
  const [aoEntrar] = useState(() => ({ assinatura: assinaturaBusca, quantidade: quantidadeVisivelSalva() }))
  const quantidadeInicial =
    aoEntrar.assinatura === assinaturaBusca && aoEntrar.quantidade ? aoEntrar.quantidade : RESULTADOS_POR_VEZ

  const [anuncioTopo, setAnuncioTopo] = useState<Anuncio | null | undefined>(undefined)

  useEffect(() => {
    let cancelado = false
    buscarAnuncioTopoBusca()
      .then(anuncio => { if (!cancelado) setAnuncioTopo(anuncio) })
      .catch(() => { if (!cancelado) setAnuncioTopo(null) })
    return () => { cancelado = true }
  }, [])

  const tituloBusca = getTituloBusca(queryBusca, cidadeNome, origemCidade === 'texto')
  const restritoACidade = Boolean(cidadeNome) && origemCidade !== 'texto'
  // Convite de localização: só quando não sabemos a cidade da pessoa e ela não escolheu nenhum recorte.
  const convidarLocalizacao =
    !cidadeAtual && !cidadeNome && !filtroEstado && !filtroRegiao && !filtroCidade

  const filtrosProps = {
    filtroEstado,
    filtroRegiao,
    filtroCidade: cidadeFiltroId,
    filtroGrupo,
    filtroCategoria,
    totalAtivos,
    estadosDisponiveis,
    regioesDisponiveis,
    cidadesDisponiveis,
    gruposDisponiveis,
    categoriasDisponiveis,
    onAplicar: aplicar,
    onLimpar: limparFiltros,
  }

  // Na primeira carga ainda não há opções; depois, mantém as antigas enquanto recarrega (o menu não some).
  const sidebarPronta = !loading || prestadoresBase.length > 0

  return (
    <>
      {/* Bottom sheet mobile — botão flutuante + drawer */}
      <FiltroBottomSheet {...filtrosProps} />

      <div className="max-w-6xl mx-auto px-5 md:px-6 pt-3 lg:grid lg:grid-cols-[260px_1fr] lg:gap-6">

        {/* Sidebar desktop: a coluna existe sempre, para a lista não "pular" de lugar ao carregar */}
        <aside className="hidden lg:block">
          {sidebarPronta ? <FiltroSidebar {...filtrosProps} /> : <SidebarCarregando />}
        </aside>

        {/* Coluna principal */}
        <div className="flex min-w-0 flex-col gap-4">

          {/* Título + contagem */}
          <div className="flex items-center justify-between border-l-4 border-blue-600 pl-4 py-1">
            <div>
              <h1 className="text-base md:text-lg font-bold text-slate-800 leading-tight text-balance">
                {tituloBusca}
              </h1>
              <p className="text-xs text-slate-500 mt-1.5 uppercase tracking-widest font-medium">
                Resultados da busca
              </p>
            </div>
            {!loading && prestadoresExibidos.length > 0 && (
              <span
                role="status"
                className="text-sm font-bold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-full border border-blue-100 shrink-0"
              >
                {prestadoresExibidos.length}{' '}
                {prestadoresExibidos.length === 1 ? 'encontrado' : 'encontrados'}
              </span>
            )}
          </div>

          <CidadeDaBusca
            cidadeNome={cidadeNome}
            origem={origemCidade}
            ampliar={ampliar}
            cidadeSalvaNome={cidadeAtual?.nome ?? null}
            onVerOutrasCidades={verOutrasCidades}
            onVoltarParaMinhaCidade={voltarParaMinhaCidade}
          />

          {!loading && !erro && convidarLocalizacao && <ConviteLocalizacao />}

          {/* Erro */}
          {erro && (
            <div role="alert" className="flex flex-wrap items-center gap-3 bg-red-50 border border-red-100 rounded-3xl px-6 py-4">
              <AlertCircle size={18} className="text-red-400 shrink-0" />
              <p className="flex-1 text-sm font-medium text-red-600">
                Não foi possível carregar os profissionais. Verifique sua conexão e tente de novo.
              </p>
              <button
                type="button"
                onClick={recarregar}
                className="min-h-11 rounded-xl bg-white border border-red-200 px-5 text-sm font-bold text-red-600 hover:bg-red-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 active:scale-95"
              >
                Tentar de novo
              </button>
            </div>
          )}

          {/* Skeleton */}
          {loading ? (
            <div className="grid grid-cols-1 gap-3 lg:grid-cols-2" aria-busy="true" aria-label="Carregando profissionais">
              {[1, 2, 3, 4].map(i => (
                <div
                  key={i}
                  className="w-full min-h-[190px] bg-white rounded-[2rem] border border-slate-100 animate-pulse"
                />
              ))}
            </div>
          ) : (
            prestadoresExibidos.length > 0 && (
              <>
                {/* Anúncio de topo */}
                <AdCard
                  page="lista_topo"
                  anuncio={anuncioTopo}
                  categoria={queryBusca || filtroHab || ''}
                />

                <ResultadosPaginados
                  key={assinaturaBusca}
                  prestadores={prestadoresExibidos}
                  quantidadeInicial={quantidadeInicial}
                  session={session}
                  contextoAnuncio={queryBusca || filtroHab}
                />
              </>
            )
          )}

          {/* Empty state */}
          {!loading && !erro && prestadoresExibidos.length === 0 && (
            <div className="py-20 lg:py-28 flex flex-col items-center justify-center text-center min-h-[50vh] lg:min-h-[55vh]">
              <div className="w-20 h-20 lg:w-28 lg:h-28 bg-slate-50 rounded-3xl lg:rounded-[2rem] flex items-center justify-center border border-slate-100 shadow-inner mb-5 lg:mb-7">
                <MapPin size={32} className="text-slate-300 lg:hidden" />
                <MapPin size={44} className="text-slate-300 hidden lg:block" />
              </div>
              <div className="max-w-xs lg:max-w-sm">
                <h2 className="text-lg lg:text-xl font-bold text-slate-700 mb-1 lg:mb-2">
                  {restritoACidade ? `Nenhum profissional em ${cidadeNome}` : 'Nenhum profissional encontrado'}
                </h2>
                <p className="text-sm lg:text-base text-slate-500 font-medium leading-relaxed">
                  {restritoACidade
                    ? 'Veja os profissionais de outras cidades ou tente buscar por outro serviço.'
                    : 'Tente remover os filtros ou buscar por uma categoria diferente.'}
                </p>
              </div>
              <div className="mt-5 lg:mt-7 flex flex-wrap items-center justify-center gap-3">
                {restritoACidade && (
                  <button
                    type="button"
                    onClick={verOutrasCidades}
                    className="min-h-11 px-6 bg-blue-600 text-white rounded-2xl text-sm font-bold hover:bg-blue-700 transition-all active:scale-95 shadow-sm shadow-blue-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
                  >
                    Ver outras cidades
                  </button>
                )}
                {temFiltro && (
                  <button
                    type="button"
                    onClick={limparFiltros}
                    className="min-h-11 px-6 bg-white border border-slate-200 text-slate-600 rounded-2xl text-sm font-bold hover:border-blue-400 hover:text-blue-600 transition-all active:scale-95 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
                  >
                    Remover filtros
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Espaço extra no mobile para não sobrepor o botão flutuante */}
          <div className="h-16 lg:hidden" />
        </div>
      </div>
    </>
  )
}

// ─── Export ────────────────────────────────────────────────────────────────

export default function PaginaPrestadores() {
  return (
    <div className="min-h-screen bg-slate-50 pb-4 antialiased selection:bg-blue-100">
      <Header href="/" />
      {/* O Header é fixo e mede h-16 (64px) no celular e md:h-28 (112px) daí em diante.
          Este espaço precisa acompanhar essas alturas; com menos, o título da busca
          e o contador de resultados ficam por baixo do cabeçalho. */}
      <div className="pt-16 md:pt-28">
        <Suspense fallback={<ListaSkeleton />}>
          <ListaConteudo />
        </Suspense>
      </div>
    </div>
  )
}