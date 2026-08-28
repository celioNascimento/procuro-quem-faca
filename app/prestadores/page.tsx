'use client'
// app/prestadores/page.tsx

export const dynamic = 'force-dynamic'

import { Fragment, Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { usePrestadores } from '@/hooks/usePrestadores'
import { useFiltrosParams } from '@/hooks/useFiltrosParams'
import { useFiltrosPrestadores } from '@/hooks/useFiltrosPrestadores'
import { useSession } from '@/hooks/useSession'
import Header from '@/components/Header'
import PrestadorCard from '@/components/cards/PrestadorCard'
import { AdCard } from '@/components/ads/AdCard'
import { FiltroSidebar } from '@/components/filtros/FiltroSidebar'
import { FiltroBottomSheet } from '@/components/filtros/FiltroBottomSheet'
import { MapPin, AlertCircle } from 'lucide-react'
import { getTituloBusca } from '@/lib/prestadorUtils'
import { ListaSkeleton } from '@/components/skeletons/ListaSkeletonPrestadores'
import { supabase } from '@/lib/supabase/client'
import {
  listarAnunciosAtivosPorPraca,
  verificarInventarioSegmento,
  type AnuncioComAnunciante,
} from '@/lib/services/adminAnuncios.service'
import type { Prestador } from '@/types/prestador'
import type { Anuncio } from '@/types/ads'

// ─── Utilitários de anúncio ────────────────────────────────────────────────

function shuffleArray<T>(array: T[]): T[] {
  const newArray = [...array]
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[newArray[i], newArray[j]] = [newArray[j], newArray[i]]
  }
  return newArray
}

function criarSorteador<T>(itens: T[]) {
  let ciclo: T[] = []
  let ponteiro = 0
  return function proximo(): T | null {
    if (itens.length === 0) return null
    if (ponteiro >= ciclo.length) {
      ciclo = shuffleArray(itens)
      ponteiro = 0
    }
    return ciclo[ponteiro++]
  }
}

type ChavePraca = string // `${cidadeId}::${categoriaId}`

function chavePracaDe(prestador: Prestador): ChavePraca | null {
  const cidadeId    = prestador.cidade_id    ? String(prestador.cidade_id)    : null
  const categoriaId = prestador.categoria_id ? String(prestador.categoria_id) : null
  return cidadeId && categoriaId ? `${cidadeId}::${categoriaId}` : null
}

const PISO_TAXA_EXIBICAO = 0.65

function calcularPosicoesComAnuncio(
  totalPosicoesNaPraca: number,
  ocupados: number,
  vagasTotais: number
): Set<number> {
  if (ocupados <= 0 || vagasTotais <= 0 || totalPosicoesNaPraca === 0) return new Set()
  const indices   = Array.from({ length: totalPosicoesNaPraca }, (_, i) => i)
  const ocupacao  = Math.min(1, ocupados / vagasTotais)
  const taxa      = PISO_TAXA_EXIBICAO + (1 - PISO_TAXA_EXIBICAO) * ocupacao
  const quantidade = Math.min(totalPosicoesNaPraca, Math.max(1, Math.round(totalPosicoesNaPraca * taxa)))
  return new Set(shuffleArray(indices).slice(0, quantidade))
}

// ─── AdCardEntreCards ──────────────────────────────────────────────────────

function AdCardEntreCards({
  prestadorAncora,
  categoriaFallback,
  mostrarAnuncio,
  cachePracaRef,
  sorteadoresRef,
}: {
  prestadorAncora:   Prestador
  categoriaFallback: string
  mostrarAnuncio:    boolean | undefined
  cachePracaRef:     React.MutableRefObject<Map<string, AnuncioComAnunciante[]>>
  sorteadoresRef:    React.MutableRefObject<Map<string, () => AnuncioComAnunciante | null>>
}) {
  const cidadeId    = prestadorAncora.cidade_id    ? String(prestadorAncora.cidade_id)    : null
  const categoriaId = prestadorAncora.categoria_id ? String(prestadorAncora.categoria_id) : null
  const chavePraca  = cidadeId && categoriaId ? `${cidadeId}::${categoriaId}` : null

  const [anuncio, setAnuncio] = useState<AnuncioComAnunciante | null | undefined>(undefined)

  useEffect(() => {
    if (mostrarAnuncio === undefined) { setAnuncio(undefined); return }
    if (!mostrarAnuncio || !chavePraca || !cidadeId || !categoriaId) { setAnuncio(null); return }

    let cancelado = false
    setAnuncio(undefined)

    async function resolver() {
      const cache = cachePracaRef.current
      let anunciosDaPraca = cache.get(chavePraca!)
      if (!anunciosDaPraca) {
        anunciosDaPraca = await listarAnunciosAtivosPorPraca(cidadeId!, categoriaId!, 'entre_cards')
        cache.set(chavePraca!, anunciosDaPraca)
      }
      if (cancelado) return

      let sortear = sorteadoresRef.current.get(chavePraca!)
      if (!sortear) {
        sortear = criarSorteador(anunciosDaPraca)
        sorteadoresRef.current.set(chavePraca!, sortear)
      }
      setAnuncio(sortear())
    }

    resolver().catch(() => { if (!cancelado) setAnuncio(null) })
    return () => { cancelado = true }
  }, [mostrarAnuncio, chavePraca, cidadeId, categoriaId, cachePracaRef, sorteadoresRef])

  const anuncioParaExibir: Anuncio | null | undefined =
    mostrarAnuncio === undefined ? undefined
    : !mostrarAnuncio            ? null
    : anuncio === undefined      ? undefined
    : anuncio === null           ? null
    : (anuncio as Anuncio)

  return <AdCard page="prestadores" anuncio={anuncioParaExibir} categoria={categoriaFallback} />
}

// ─── ListaConteudo ─────────────────────────────────────────────────────────

function ListaConteudo() {
  // Parâmetros da URL — leitura centralizada em useFiltrosParams
  const { queryBusca, filtroHab, filtroCidade, filtroEstado, filtroRegiao, filtroGrupo, filtroCategoria } =
    useFiltrosParams()

  // Dados de prestadores e opções de filtro em cascata
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
  } = usePrestadores()

  // Ações de filtro (aplicar, limpar, contagem)
  const { totalAtivos, aplicar, limparFiltros } = useFiltrosPrestadores()

  const session   = useSession()
  const temFiltro = totalAtivos > 0

  // Anúncio de topo
  const [anuncioTopo, setAnuncioTopo] = useState<Anuncio | null | undefined>(undefined)

  useEffect(() => {
    let cancelado = false
    async function carregarAnunciosTopo() {
      const agora = new Date().toISOString()
      const { data, error } = await supabase
        .from('anuncios')
        .select('*')
        .eq('status', true)
        .eq('status_aprovacao', 'aprovado')
        .eq('posicao', 'topo_busca')
        .or(`data_inicio.is.null,data_inicio.lte.${agora}`)
        .or(`data_expiracao.is.null,data_expiracao.gte.${agora}`)
      if (cancelado) return
      setAnuncioTopo(!error && data && data.length > 0 ? shuffleArray(data as Anuncio[])[0] : null)
    }
    carregarAnunciosTopo()
    return () => { cancelado = true }
  }, [])

  // Cache de praças para anúncios entre cards
  const cachePracaRef   = useRef<Map<string, AnuncioComAnunciante[]>>(new Map())
  const sorteadoresRef  = useRef<Map<string, () => AnuncioComAnunciante | null>>(new Map())

  useEffect(() => {
    cachePracaRef.current  = new Map()
    sorteadoresRef.current = new Map()
  }, [queryBusca, filtroHab, filtroCidade, filtroEstado, filtroRegiao, filtroGrupo, filtroCategoria])

  // Calcula posições de anúncio entre cards por praça
  const posicoesPorPraca = useMemo(() => {
    const grupos = new Map<ChavePraca, number[]>()
    let contador = 0
    prestadoresExibidos.forEach((p, index) => {
      if ((index + 1) % 4 !== 0) return
      const chave = chavePracaDe(p)
      if (!chave) return
      const lista = grupos.get(chave) ?? []
      lista.push(contador++)
      grupos.set(chave, lista)
    })
    return grupos
  }, [prestadoresExibidos])

  const [posicoesComAnuncioPorPraca, setPosicoesComAnuncioPorPraca] =
    useState<Map<ChavePraca, Set<number>>>(new Map())

  useEffect(() => {
    if (posicoesPorPraca.size === 0) { setPosicoesComAnuncioPorPraca(new Map()); return }
    let cancelado = false
    async function calcular() {
      const resultado = new Map<ChavePraca, Set<number>>()
      await Promise.all(
        Array.from(posicoesPorPraca.entries()).map(async ([chave, indices]) => {
          const [cidadeId, categoriaId] = chave.split('::')
          try {
            const inventario = await verificarInventarioSegmento(cidadeId, categoriaId, 'entre_cards')
            resultado.set(chave, calcularPosicoesComAnuncio(indices.length, inventario.ocupados, inventario.vagasTotais))
          } catch {
            resultado.set(chave, new Set())
          }
        })
      )
      if (!cancelado) setPosicoesComAnuncioPorPraca(resultado)
    }
    calcular()
    return () => { cancelado = true }
  }, [posicoesPorPraca])

  const tituloBusca = getTituloBusca(queryBusca, filtroCidade)

  // Props compartilhadas entre sidebar e bottom sheet
  const filtrosProps = {
    filtroEstado,
    filtroRegiao,
    filtroCidade,
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

  return (
    <>
      {/* Bottom sheet mobile — botão flutuante + drawer */}
      <FiltroBottomSheet {...filtrosProps} />

      <div className="max-w-6xl mx-auto px-5 md:px-6 pt-6 lg:grid lg:grid-cols-[260px_1fr] lg:gap-8">

        {/* Sidebar desktop */}
        {!loading && (
          <aside className="hidden lg:block">
            <FiltroSidebar {...filtrosProps} />
          </aside>
        )}

        {/* Coluna principal */}
        <div className="space-y-6 min-w-0">

          {/* Título + contagem */}
          <div className="flex items-center justify-between border-l-4 border-blue-600 pl-4 py-1">
            <div>
              <h1 className="text-[15px] md:text-[16px] font-bold text-slate-800 leading-none text-balance">
                {tituloBusca}
              </h1>
              <p className="text-[12px] text-slate-400 mt-1.5 uppercase tracking-widest font-medium">
                Resultados da busca
              </p>
            </div>
            {!loading && prestadoresExibidos.length > 0 && (
              <span
                role="status"
                className="text-[13px] font-bold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-full border border-blue-100 shrink-0"
              >
                {prestadoresExibidos.length}{' '}
                {prestadoresExibidos.length === 1 ? 'encontrado' : 'encontrados'}
              </span>
            )}
          </div>

          {/* Erro */}
          {erro && (
            <div className="flex items-center gap-3 bg-red-50 border border-red-100 rounded-3xl px-6 py-4">
              <AlertCircle size={18} className="text-red-400 shrink-0" />
              <p className="text-[13px] font-medium text-red-600">
                Não foi possível carregar os profissionais. Verifique sua conexão e recarregue a página.
              </p>
            </div>
          )}

          {/* Skeleton */}
          {loading ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {[1, 2, 3, 4].map(i => (
                <div
                  key={i}
                  className="w-full h-32 bg-white rounded-[2rem] border border-slate-100 animate-pulse"
                />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Anúncio de topo */}
              {prestadoresExibidos.length > 0 && (
                <div className="lg:col-span-2">
                  <AdCard
                    page="lista_topo"
                    anuncio={anuncioTopo}
                    categoria={queryBusca || filtroHab || ''}
                  />
                </div>
              )}

              {/* Grid de cards */}
              {(() => {
                const contadorPorPraca = new Map<ChavePraca, number>()

                return prestadoresExibidos.map((p: Prestador, index: number) => {
                  const ehPosicaoDeAnuncio = (index + 1) % 4 === 0
                  const chave = ehPosicaoDeAnuncio ? chavePracaDe(p) : null

                  let mostrarAnuncio: boolean | undefined = false
                  if (ehPosicaoDeAnuncio && chave) {
                    const indiceNaPraca = contadorPorPraca.get(chave) ?? 0
                    contadorPorPraca.set(chave, indiceNaPraca + 1)
                    const posicoesDaPraca = posicoesComAnuncioPorPraca.get(chave)
                    mostrarAnuncio =
                      posicoesDaPraca === undefined ? undefined : posicoesDaPraca.has(indiceNaPraca)
                  }

                  return (
                    <Fragment key={p.id}>
                      <PrestadorCard prestador={p} session={session} />

                      {ehPosicaoDeAnuncio && (
                        <div className="lg:col-span-2">
                          <AdCardEntreCards
                            prestadorAncora={p}
                            categoriaFallback={queryBusca || filtroHab || p.categoria || ''}
                            mostrarAnuncio={mostrarAnuncio}
                            cachePracaRef={cachePracaRef}
                            sorteadoresRef={sorteadoresRef}
                          />
                        </div>
                      )}
                    </Fragment>
                  )
                })
              })()}
            </div>
          )}

          {/* Empty state */}
          {!loading && !erro && prestadoresExibidos.length === 0 && (
            <div className="py-20 lg:py-28 flex flex-col items-center justify-center text-center min-h-[50vh] lg:min-h-[55vh]">
              <div className="w-20 h-20 lg:w-28 lg:h-28 bg-slate-50 rounded-3xl lg:rounded-[2rem] flex items-center justify-center border border-slate-100 shadow-inner mb-5 lg:mb-7">
                <MapPin size={32} className="text-slate-200 lg:hidden" />
                <MapPin size={44} className="text-slate-200 hidden lg:block" />
              </div>
              <div className="max-w-[240px] lg:max-w-sm">
                <h2 className="text-base lg:text-xl font-bold text-slate-700 mb-1 lg:mb-2">
                  Nenhum profissional encontrado
                </h2>
                <p className="text-[13px] lg:text-[15px] text-slate-400 font-medium leading-relaxed">
                  Tente remover os filtros ou buscar por uma categoria diferente.
                </p>
              </div>
              {temFiltro && (
                <button
                  onClick={limparFiltros}
                  className="mt-5 lg:mt-7 px-5 lg:px-6 py-2.5 lg:py-3 bg-white border border-slate-200 text-slate-600 rounded-2xl text-[12px] lg:text-[13px] font-bold uppercase tracking-wide hover:border-blue-400 hover:text-blue-600 transition-all active:scale-95 shadow-sm"
                >
                  Remover filtros
                </button>
              )}
            </div>
          )}

          {/* Espaço extra no mobile para não sobrepor o botão flutuante */}
          <div className="h-20 lg:hidden" />
        </div>
      </div>
    </>
  )
}

// ─── Export ────────────────────────────────────────────────────────────────

export default function PaginaPrestadores() {
  return (
    <div className="min-h-screen bg-[#FDFDFD] pb-16 antialiased selection:bg-blue-100">
      <Header href="/" />
      <div className="pt-16 md:pt-28">
        <Suspense fallback={<ListaSkeleton />}>
          <ListaConteudo />
        </Suspense>
      </div>
    </div>
  )
}
