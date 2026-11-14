'use client'
// components/busca/ResultadosPaginados.tsx
//
// Cards da busca, 10 por vez ("Ver mais"), com um anúncio a cada 4 cards.
// Este componente é remontado (key) quando a busca ou os filtros mudam: assim volta para os 10 primeiros
// e os anúncios sorteiam de novo, sem precisar de efeitos que reiniciem estado.

import { Fragment, useEffect, useMemo, useRef, useState } from 'react'
import PrestadorCard from '@/components/cards/PrestadorCard'
import { AdCard } from '@/components/ads/AdCard'
import { salvarQuantidadeVisivel } from '@/lib/navegacao'
import {
  chavePracaDe, ehPosicaoDeAnuncio, posicaoTemAnuncio, type ChavePraca,
} from '@/lib/anunciosEntreCards'
import {
  listarAnunciosAtivosPorPraca,
  verificarInventarioSegmento,
  type AnuncioComAnunciante,
} from '@/lib/services/anunciosPublicos.service'
import type { Prestador } from '@/types/prestador'
import type { Anuncio } from '@/types/ads'

export const RESULTADOS_POR_VEZ = 10

type Inventario = { ocupados: number; vagasTotais: number } | 'erro'

function shuffleArray<T>(array: T[]): T[] {
  const novo = [...array]
  for (let i = novo.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[novo[i], novo[j]] = [novo[j], novo[i]]
  }
  return novo
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

// ─── Anúncio entre os cards ────────────────────────────────────────────────

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
    if (mostrarAnuncio === undefined) {
      const timer = setTimeout(() => setAnuncio(undefined), 0)
      return () => clearTimeout(timer)
    }
    if (!mostrarAnuncio || !chavePraca || !cidadeId || !categoriaId) {
      const timer = setTimeout(() => setAnuncio(null), 0)
      return () => clearTimeout(timer)
    }

    let cancelado = false
    const resetTimer = setTimeout(() => setAnuncio(undefined), 0)

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
    return () => {
      cancelado = true
      clearTimeout(resetTimer)
    }
  }, [mostrarAnuncio, chavePraca, cidadeId, categoriaId, cachePracaRef, sorteadoresRef])

  const anuncioParaExibir: Anuncio | null | undefined =
    mostrarAnuncio === undefined ? undefined
    : !mostrarAnuncio            ? null
    : anuncio === undefined      ? undefined
    : anuncio === null           ? null
    : (anuncio as Anuncio)

  return <AdCard page="prestadores" anuncio={anuncioParaExibir} categoria={categoriaFallback} />
}

// ─── Lista ─────────────────────────────────────────────────────────────────

type Props = {
  prestadores: Prestador[]
  quantidadeInicial: number
  session: unknown
  /** Termo da busca, usado como contexto do anúncio de reserva. */
  contextoAnuncio: string
}

export function ResultadosPaginados({ prestadores, quantidadeInicial, session, contextoAnuncio }: Props) {
  const [quantidade, setQuantidade] = useState(() =>
    Math.min(Math.max(quantidadeInicial, RESULTADOS_POR_VEZ), Math.max(prestadores.length, RESULTADOS_POR_VEZ)),
  )
  const [semente] = useState(() => Math.random())
  const [inventarios, setInventarios] = useState<Record<ChavePraca, Inventario>>({})
  const pedidos = useRef(new Set<ChavePraca>())
  const cachePracaRef = useRef<Map<string, AnuncioComAnunciante[]>>(new Map())
  const sorteadoresRef = useRef<Map<string, () => AnuncioComAnunciante | null>>(new Map())

  // Lembra quantos cards estavam abertos, para devolver ao voltar do perfil.
  useEffect(() => { salvarQuantidadeVisivel(quantidade) }, [quantidade])

  const visiveis = useMemo(() => prestadores.slice(0, quantidade), [prestadores, quantidade])
  const restantes = prestadores.length - visiveis.length

  // Só consulta o inventário das praças que aparecem nos cards visíveis (e uma vez cada).
  const pracasVisiveis = useMemo(() => {
    const chaves = new Set<ChavePraca>()
    visiveis.forEach((p, index) => {
      if (!ehPosicaoDeAnuncio(index)) return
      const chave = chavePracaDe(p)
      if (chave) chaves.add(chave)
    })
    return Array.from(chaves)
  }, [visiveis])

  useEffect(() => {
    let ativo = true
    for (const chave of pracasVisiveis) {
      if (pedidos.current.has(chave)) continue
      pedidos.current.add(chave)
      const [cidadeId, categoriaId] = chave.split('::')
      verificarInventarioSegmento(cidadeId, categoriaId, 'entre_cards')
        .then(inv => ({ ocupados: inv.ocupados, vagasTotais: inv.vagasTotais }) as Inventario)
        .catch(() => 'erro' as Inventario)
        .then(resultado => { if (ativo) setInventarios(atual => ({ ...atual, [chave]: resultado })) })
    }
    return () => { ativo = false }
  }, [pracasVisiveis])

  const contadorPorPraca = new Map<ChavePraca, number>()

  return (
    <>
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        {visiveis.map((p, index) => {
          const comAnuncio = ehPosicaoDeAnuncio(index)
          const chave = comAnuncio ? chavePracaDe(p) : null

          let mostrarAnuncio: boolean | undefined = false
          if (comAnuncio && chave) {
            const indiceNaPraca = contadorPorPraca.get(chave) ?? 0
            contadorPorPraca.set(chave, indiceNaPraca + 1)
            const inv = inventarios[chave]
            mostrarAnuncio =
              inv === undefined ? undefined
              : inv === 'erro'  ? false
              : posicaoTemAnuncio({ ...inv, indiceNaPraca, chave, semente })
          }

          return (
            <Fragment key={p.id}>
              <PrestadorCard prestador={p} session={session} />

              {comAnuncio && (
                <div className="lg:col-span-2">
                  <AdCardEntreCards
                    prestadorAncora={p}
                    categoriaFallback={contextoAnuncio || p.categoria || ''}
                    mostrarAnuncio={mostrarAnuncio}
                    cachePracaRef={cachePracaRef}
                    sorteadoresRef={sorteadoresRef}
                  />
                </div>
              )}
            </Fragment>
          )
        })}
      </div>

      {prestadores.length > RESULTADOS_POR_VEZ && (
        <div className="flex flex-col items-center gap-3 py-4">
          <p role="status" className="text-sm text-slate-500">
            Mostrando {visiveis.length} de {prestadores.length}
          </p>
          {restantes > 0 && (
            <button
              type="button"
              onClick={() => setQuantidade(q => q + RESULTADOS_POR_VEZ)}
              className="min-h-12 rounded-2xl border border-slate-200 bg-white px-8 text-sm font-bold text-blue-600 shadow-sm transition-colors hover:border-blue-400 hover:text-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 active:scale-95"
            >
              Ver mais {Math.min(RESULTADOS_POR_VEZ, restantes)}
            </button>
          )}
        </div>
      )}
    </>
  )
}
