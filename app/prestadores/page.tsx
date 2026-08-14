// app/prestadores/page.tsx

'use client'

export const dynamic = 'force-dynamic'

import { Fragment, Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { usePrestadores } from '@/hooks/usePrestadores'
import { useSession } from '@/hooks/useSession'
import Header from '@/components/Header'
import PrestadorCard from '@/components/cards/PrestadorCard'
import { AdCard } from '@/components/ads/AdCard'
import { MapPin, Filter, AlertCircle, X } from 'lucide-react'
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

function shuffleArray<T>(array: T[]): T[] {
  const newArray = [...array]
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]]
  }
  return newArray
}

/**
 * Round-robin embaralhado: percorre a lista de anúncios em ciclos, embaralhando
 * a cada volta. Garante que, dentro do possível (posições >= anunciantes),
 * todo anunciante ativo apareça pelo menos 1x antes de qualquer repetição,
 * mantendo a ordem aleatória a cada carregamento de página.
 */
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

function BotaoCidade({
  nome,
  count,
  ativo,
  variante,
  onClick,
}: {
  nome: string
  count: number
  ativo: boolean
  variante: 'chip' | 'linha'
  onClick: () => void
}) {
  if (variante === 'linha') {
    return (
      <button
        onClick={onClick}
        aria-pressed={ativo}
        className={`flex w-full items-center justify-between gap-2 px-4 py-2.5 rounded-2xl text-[13px] font-bold transition-all border ${
          ativo
            ? 'bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-100'
            : 'bg-white border-slate-200 text-slate-600 hover:border-blue-400 hover:text-blue-600'
        }`}
      >
        <span className="truncate text-left">{nome}</span>
        <span
          className={`text-[11px] font-black px-2 py-0.5 rounded-full shrink-0 ${
            ativo ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
          }`}
        >
          {count}
        </span>
      </button>
    )
  }

  return (
    <button
      onClick={onClick}
      aria-pressed={ativo}
      className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-[13px] font-bold transition-all shrink-0 border ${
        ativo
          ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-100'
          : 'bg-white border-slate-200 text-slate-600 hover:border-blue-400 hover:text-blue-600'
      }`}
    >
      {nome}
      <span
        className={`text-[11px] font-black px-1.5 py-0.5 rounded-full ${
          ativo ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
        }`}
      >
        {count}
      </span>
    </button>
  )
}

type ChavePraca = string // `${cidadeId}::${categoriaId}`

function chavePracaDe(prestador: Prestador): ChavePraca | null {
  const cidadeId = prestador.cidade_id ? String(prestador.cidade_id) : null
  const categoriaId = prestador.categoria_id ? String(prestador.categoria_id) : null
  return cidadeId && categoriaId ? `${cidadeId}::${categoriaId}` : null
}

// Piso mínimo de exibição assim que há pelo menos 1 anunciante ativo na
// praça. Ajustável — ver calcularPosicoesComAnuncio.
const PISO_TAXA_EXIBICAO = 0.65

/**
 * Decide, por praça, quais das N posições "entre_cards" daquela praça na
 * página mostram anúncio real vs. fallback.
 *
 * Modelo: piso alto assim que há 1+ anunciante ativo, subindo suavemente até
 * 100% conforme a praça se aproxima da lotação. Prioriza generosidade de
 * exibição para quem já comprou (mais retorno percebido, menos sensação de
 * "pago e não apareço") sobre sinalizar escassez de inventário — a decisão de
 * bloquear novas vendas quando lotado já é feita separadamente, no cadastro.
 *
 * taxa = piso + (1 - piso) * (ocupados / vagasTotais)
 *   ex. piso=0.65, 1/6 ocupado  -> ~71%
 *   ex. piso=0.65, 3/6 ocupado  -> ~82%
 *   ex. piso=0.65, 6/6 ocupado  -> 100%
 */
function calcularPosicoesComAnuncio(totalPosicoesNaPraca: number, ocupados: number, vagasTotais: number): Set<number> {
  const indices = Array.from({ length: totalPosicoesNaPraca }, (_, i) => i)

  if (ocupados <= 0 || vagasTotais <= 0 || totalPosicoesNaPraca === 0) {
    return new Set()
  }

  const ocupacao = Math.min(1, ocupados / vagasTotais)
  const taxa = PISO_TAXA_EXIBICAO + (1 - PISO_TAXA_EXIBICAO) * ocupacao
  const quantidade = Math.min(totalPosicoesNaPraca, Math.max(1, Math.round(totalPosicoesNaPraca * taxa)))

  const embaralhados = shuffleArray(indices)
  return new Set(embaralhados.slice(0, quantidade))
}

/**
 * Card "entre_cards" ancorado na praça (cidade+categoria) do prestador que
 * fecha o grupo de 4. Só busca e sorteia um anúncio real quando `mostrarAnuncio`
 * for true para essa posição específica (decidido previamente em ListaConteudo
 * com base na ocupação de vendas da praça) — senão renderiza direto o fallback.
 */
function AdCardEntreCards({
  prestadorAncora,
  categoriaFallback,
  mostrarAnuncio,
  cachePracaRef,
  sorteadoresRef,
}: {
  prestadorAncora: Prestador
  categoriaFallback: string
  mostrarAnuncio: boolean
  cachePracaRef: React.MutableRefObject<Map<string, AnuncioComAnunciante[]>>
  sorteadoresRef: React.MutableRefObject<Map<string, () => AnuncioComAnunciante | null>>
}) {
  const cidadeId = prestadorAncora.cidade_id ? String(prestadorAncora.cidade_id) : null
  const categoriaId = prestadorAncora.categoria_id ? String(prestadorAncora.categoria_id) : null
  const chavePraca = cidadeId && categoriaId ? `${cidadeId}::${categoriaId}` : null

  const [anuncio, setAnuncio] = useState<AnuncioComAnunciante | null | undefined>(undefined) // undefined = carregando

  useEffect(() => {
    if (!mostrarAnuncio || !chavePraca || !cidadeId || !categoriaId) {
      setAnuncio(null)
      return
    }

    let cancelado = false

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

    resolver().catch(() => {
      if (!cancelado) setAnuncio(null)
    })

    return () => {
      cancelado = true
    }
  }, [mostrarAnuncio, chavePraca, cidadeId, categoriaId, cachePracaRef, sorteadoresRef])

  // Se essa posição não foi sorteada pra mostrar anúncio real, cai direto no
  // fallback sem sequer buscar dados — reserva o espaço de venda pra escassez.
  // AnuncioComAnunciante.tipo é `string` (constraint do banco: 'proprio'|'google'),
  // enquanto Anuncio.tipo é a união restrita 'vip'|'proprio'|'google' — TS não
  // aceita atribuição direta de string largo pra união estreita. Estrutura já
  // validada como compatível contra types/ads.ts real; cast explícito abaixo.
  const anuncioParaExibir: Anuncio | null =
    !mostrarAnuncio || anuncio === undefined || anuncio === null ? null : (anuncio as Anuncio)

  return <AdCard page="prestadores" anuncio={anuncioParaExibir} categoria={categoriaFallback} />
}

function ListaConteudo() {
  const searchParams = useSearchParams()
  const queryBusca = (searchParams.get('q') || '').trim()
  const filtroHab = (searchParams.get('habilidade') || '').trim()
  const filtroCidNome = searchParams.get('cidade') || ''

  const { prestadoresBase, prestadoresExibidos, cidadesDisponiveis, loading, erro, toggleCidade } =
    usePrestadores(queryBusca, filtroHab, filtroCidNome)
  const session = useSession()

  const [anunciosTopo, setAnunciosTopo] = useState<Anuncio[]>([])

  // Cache em memória por praça (cidade_id::categoria_id) — evita refetch a
  // cada render/scroll enquanto o usuário permanece na mesma busca.
  const cachePracaRef = useRef<Map<string, AnuncioComAnunciante[]>>(new Map())
  const sorteadoresRef = useRef<Map<string, () => AnuncioComAnunciante | null>>(new Map())

  useEffect(() => {
    // topo_busca continua com vaga única — mantém a lógica antiga simples,
    // buscando os anúncios "topo_busca" globais e deixando o AdCard escolher.
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

      if (!error && data) {
        setAnunciosTopo(shuffleArray(data as Anuncio[]))
      }
    }
    carregarAnunciosTopo()
  }, [])

  // Limpa o cache de praças quando a busca muda de fato (nova lista de
  // prestadores), pra não acumular pools de praças que não aparecem mais.
  useEffect(() => {
    cachePracaRef.current = new Map()
    sorteadoresRef.current = new Map()
  }, [queryBusca, filtroHab, filtroCidNome])

  // Agrupa as posições "entre_cards" (a cada 4 prestadores) por praça, na
  // ordem em que aparecem na lista. Cada praça pode ter 0, 1 ou várias
  // posições nesta página específica.
  const posicoesPorPraca = useMemo(() => {
    const grupos = new Map<ChavePraca, number[]>() // chave -> índices (na sequência de posições daquela praça)
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

  // Para cada praça com posições nesta página, busca a ocupação de vendas
  // (vagasTotais/ocupados) e calcula quais índices (dentro da sequência
  // daquela praça) mostram anúncio real. Resultado: Map<chavePraca, Set<índice>>.
  const [posicoesComAnuncioPorPraca, setPosicoesComAnuncioPorPraca] = useState<Map<ChavePraca, Set<number>>>(new Map())

  useEffect(() => {
    if (posicoesPorPraca.size === 0) {
      setPosicoesComAnuncioPorPraca(new Map())
      return
    }

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
    return () => {
      cancelado = true
    }
  }, [posicoesPorPraca])

  const tituloBusca = getTituloBusca(queryBusca, filtroCidNome)

  const contarCidade = (nome: string) => {
    const nomeNorm = nome.toLowerCase().trim()
    return prestadoresBase.filter(
      p =>
        p.cidade_nome?.toLowerCase().trim() === nomeNorm ||
        p.cidades_atendidas?.some(c => c?.toLowerCase().trim() === nomeNorm)
    ).length
  }

  const temFiltro = Boolean(filtroCidNome)

  return (
    <>
      {!loading && cidadesDisponiveis.length > 0 && (
        <div className="lg:hidden sticky top-16 md:top-28 z-50 bg-[#FDFDFD]/98 backdrop-blur-sm border-b border-slate-100 shadow-sm">
          <div className="max-w-6xl mx-auto px-5 md:px-6 py-2">
            <div
              className="flex items-center gap-3 overflow-x-auto"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              <div className="flex items-center gap-2 bg-slate-100/80 px-3 py-2 rounded-full shrink-0">
                <Filter size={14} className="text-slate-500" />
                <span className="text-[12px] font-bold uppercase tracking-widest text-slate-600">Filtrar</span>
              </div>
              <div className="flex items-center gap-2">
                {cidadesDisponiveis.map(nome => (
                  <BotaoCidade
                    key={nome}
                    nome={nome}
                    count={contarCidade(nome)}
                    ativo={filtroCidNome.toLowerCase().trim() === nome.toLowerCase().trim()}
                    variante="chip"
                    onClick={() => toggleCidade(nome)}
                  />
                ))}
              </div>
              {temFiltro && (
                <button
                  onClick={() => toggleCidade(filtroCidNome)}
                  className="flex items-center gap-1 px-3 py-2 rounded-full text-[12px] font-bold text-slate-500 hover:text-red-500 transition-colors shrink-0"
                >
                  <X size={13} strokeWidth={3} /> Limpar
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto px-5 md:px-6 pt-6 lg:grid lg:grid-cols-[260px_1fr] lg:gap-8">
        {!loading && cidadesDisponiveis.length > 0 && (
          <aside className="hidden lg:block">
            <div className="sticky top-32 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Filter size={15} className="text-slate-500" />
                  <span className="text-[12px] font-bold uppercase tracking-widest text-slate-600">
                    Filtrar por cidade
                  </span>
                </div>
                {temFiltro && (
                  <button
                    onClick={() => toggleCidade(filtroCidNome)}
                    className="flex items-center gap-1 text-[12px] font-bold text-slate-400 hover:text-red-500 transition-colors"
                  >
                    <X size={12} strokeWidth={3} /> Limpar
                  </button>
                )}
              </div>
              <div className="flex flex-col gap-2">
                {cidadesDisponiveis.map(nome => (
                  <BotaoCidade
                    key={nome}
                    nome={nome}
                    count={contarCidade(nome)}
                    ativo={filtroCidNome.toLowerCase().trim() === nome.toLowerCase().trim()}
                    variante="linha"
                    onClick={() => toggleCidade(nome)}
                  />
                ))}
              </div>
            </div>
          </aside>
        )}

        <div className="space-y-6 min-w-0">
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
                {prestadoresExibidos.length} {prestadoresExibidos.length === 1 ? 'encontrado' : 'encontrados'}
              </span>
            )}
          </div>

          {erro && (
            <div className="flex items-center gap-3 bg-red-50 border border-red-100 rounded-3xl px-6 py-4">
              <AlertCircle size={18} className="text-red-400 shrink-0" />
              <p className="text-[13px] font-medium text-red-600">
                Não foi possível carregar os profissionais. Verifique sua conexão e recarregue a página.
              </p>
            </div>
          )}

          {loading ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="w-full h-32 bg-white rounded-[2rem] border border-slate-100 animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {prestadoresExibidos.length > 0 && (
                <div className="lg:col-span-2 mx-auto w-full max-w-3xl">
                  <AdCard
                    page="lista_topo"
                    anuncio={anunciosTopo[0] ?? null}
                    categoria={queryBusca || filtroHab || ''}
                  />
                </div>
              )}

              {(() => {
                // Contador local de "índice dentro da praça" por chave, na
                // mesma ordem usada em posicoesPorPraca — precisa espelhar
                // exatamente aquele useMemo pra consultar o Set correto.
                const contadorPorPraca = new Map<ChavePraca, number>()

                return prestadoresExibidos.map((p: Prestador, index: number) => {
                  const ehPosicaoDeAnuncio = (index + 1) % 4 === 0
                  const chave = ehPosicaoDeAnuncio ? chavePracaDe(p) : null

                  let mostrarAnuncio = false
                  if (ehPosicaoDeAnuncio && chave) {
                    const indiceNaPraca = contadorPorPraca.get(chave) ?? 0
                    contadorPorPraca.set(chave, indiceNaPraca + 1)
                    mostrarAnuncio = posicoesComAnuncioPorPraca.get(chave)?.has(indiceNaPraca) ?? false
                  }

                  return (
                    <Fragment key={p.id}>
                      <PrestadorCard prestador={p} session={session} />

                      {ehPosicaoDeAnuncio && (
                        <div className="lg:col-span-2 mx-auto w-full max-w-3xl">
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

          {!loading && !erro && prestadoresExibidos.length === 0 && (
            <div className="py-20 text-center flex flex-col items-center gap-5">
              <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center border border-slate-100 shadow-inner">
                <MapPin size={32} className="text-slate-200" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-700 mb-1">Nenhum profissional encontrado</h2>
                <p className="text-[13px] text-slate-400 max-w-[240px] mx-auto font-medium leading-relaxed">
                  Tente remover os filtros ou buscar por uma categoria diferente.
                </p>
              </div>
              {filtroCidNome && (
                <button
                  onClick={() => toggleCidade(filtroCidNome)}
                  className="px-5 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-2xl text-[12px] font-bold uppercase tracking-wide hover:border-blue-400 hover:text-blue-600 transition-all active:scale-95 shadow-sm"
                >
                  Remover filtro de cidade
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
