'use client'
// hooks/usePrestadores.ts

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { getPrestadoresAtivos, getMediasAvaliacoes } from '@/lib/db/prestadores'
import { normalizarTermo, filtrarPrestadores } from '@/lib/buscaUtils'
import { pesoOrdenacao } from '@/lib/ordenacao'
import { useFiltrosParams } from './useFiltrosParams'
import type { Prestador } from '@/types/prestador'

function calcularMedias(medias: { prestador_id: string; nota: number }[]) {
  const map: Record<string, { soma: number; total: number }> = {}
  medias.forEach(({ prestador_id, nota }) => {
    if (!map[prestador_id]) map[prestador_id] = { soma: 0, total: 0 }
    map[prestador_id].soma += nota
    map[prestador_id].total += 1
  })
  return map
}

function parsearBusca(query: string): { termo: string; cidadeExtraida: string | null } {
  const match = query.match(/^(.+?)\s+em\s+(.+)$/i)
  if (match) return { termo: match[1].trim(), cidadeExtraida: match[2].trim() }
  return { termo: query, cidadeExtraida: null }
}

export function usePrestadores() {
  const router = useRouter()
  const {
    queryBusca,
    filtroHab,
    filtroCidade,
    filtroEstado,
    filtroRegiao,
    filtroGrupo,
    filtroCategoria,
  } = useFiltrosParams()

  const [prestadoresBase, setPrestadoresBase] = useState<Prestador[]>([])
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState(false)
  const [cidadeGeo, setCidadeGeo] = useState<string | null>(null)

  // Geolocalização silenciosa — só roda quando não há filtro de localização ativo
  useEffect(() => {
    if (filtroCidade || filtroEstado || filtroRegiao) return
    if (!navigator.geolocation) return

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10`
          )
          const data = await res.json()
          const nome =
            data.address?.city ||
            data.address?.town ||
            data.address?.municipality
          if (nome) setCidadeGeo(nome)
        } catch {
          // silencioso
        }
      },
      () => {},
      { timeout: 8000 }
    )
  }, [])

  // Fetch principal — só refaz quando a busca textual muda
  // Filtros de localização/categoria filtram no cliente sobre prestadoresBase
  useEffect(() => {
    const controller = new AbortController()

    async function fetchDados() {
      setLoading(true)
      setErro(false)
      setPrestadoresBase([])

      try {
        const [{ data: pData, error: pError }, { data: medias }] = await Promise.all([
          getPrestadoresAtivos(controller.signal),
          getMediasAvaliacoes(controller.signal),
        ])

        if (pError) throw pError

        const mediaMap = calcularMedias(medias || [])

        const normalizados: Prestador[] = (pData || []).map(p => ({
          ...p,
          cidade_nome:  p.cidades?.nome                          || '',
          cidade_id:    p.cidades?.id                            || p.cidade_id    || null,
          categoria:    p.categorias?.nome                       || 'Profissional',
          categoria_id: p.categorias?.id                         || p.categoria_id || null,
          // estado_sigla e regiao_id vêm direto da coluna do prestador;
          // fallback para o join com cidades caso a coluna esteja nula
          estado_sigla: p.estado_sigla                           || p.cidades?.estado_sigla || '',
          regiao_id:    p.regiao_id                              || p.cidades?.regiao_id    || null,
          regiao_nome:  p.regioes?.nome                          || '',
          grupo_id:     p.grupo_id                               || p.categorias?.grupo_id  || null,
          grupo_nome:   p.categorias?.categorias_grupos?.nome    || '',
          media_nota:   mediaMap[p.id] ? mediaMap[p.id].soma / mediaMap[p.id].total : 0,
          total_avals:  mediaMap[p.id]?.total                    || 0,
        }))

        const { termo, cidadeExtraida } = parsearBusca(queryBusca)
        const termoNorm = normalizarTermo(termo, filtroHab)

        const vitrines = normalizados.filter(p => p.origem_tipo === 'vitrine')
        const demais   = normalizados.filter(p => p.origem_tipo !== 'vitrine')
        const filtrados = filtrarPrestadores(demais, termoNorm)

        setPrestadoresBase([
          ...vitrines,
          ...[...filtrados].sort((a, b) => pesoOrdenacao(a) - pesoOrdenacao(b)),
        ])

        // Se extraiu cidade da query e não tem cidade na URL, aplica via router
        if (cidadeExtraida && !filtroCidade) {
          const params = new URLSearchParams(window.location.search)
          params.set('cidade', cidadeExtraida)
          router.replace(`/prestadores?${params.toString()}`, { scroll: false })
        }
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') return
        console.error('[usePrestadores]', err)
        setErro(true)
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    }

    fetchDados()
    return () => controller.abort()
  }, [queryBusca, filtroHab])

  // ─── Opções disponíveis em cascata ────────────────────────────────────────
  // Cada nível filtra sobre prestadoresBase respeitando os pais já selecionados,
  // mostrando só opções com prestadores reais.

  const estadosDisponiveis = useMemo(() => {
    const map = new Map<string, number>()
    prestadoresBase.forEach(p => {
      const s = p.estado_sigla
      if (s) map.set(s, (map.get(s) ?? 0) + 1)
    })
    return Array.from(map.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([sigla, count]) => ({ sigla, count }))
  }, [prestadoresBase])

  const regioesDisponiveis = useMemo(() => {
    const map = new Map<string, { nome: string; count: number }>()
    prestadoresBase
      .filter(p => !filtroEstado || p.estado_sigla === filtroEstado)
      .forEach(p => {
        if (!p.regiao_id || !p.regiao_nome) return
        const entry = map.get(p.regiao_id) ?? { nome: p.regiao_nome, count: 0 }
        entry.count++
        map.set(p.regiao_id, entry)
      })
    return Array.from(map.entries())
      .sort((a, b) => b[1].count - a[1].count)
      .map(([id, { nome, count }]) => ({ id, nome, count }))
  }, [prestadoresBase, filtroEstado])

  const cidadesDisponiveis = useMemo(() => {
    const contagem: Record<string, number> = {}
    prestadoresBase
      .filter(p =>
        (!filtroEstado || p.estado_sigla === filtroEstado) &&
        (!filtroRegiao || p.regiao_id    === filtroRegiao)
      )
      .forEach(p => {
        if (p.cidade_nome) {
          contagem[p.cidade_nome] = (contagem[p.cidade_nome] ?? 0) + 1
        }
        if (Array.isArray(p.cidades_atendidas)) {
          p.cidades_atendidas.forEach(c => {
            if (c?.trim()) contagem[c.trim()] = (contagem[c.trim()] ?? 0) + 1
          })
        }
      })
    return Object.entries(contagem)
      .sort((a, b) => b[1] - a[1])
      .map(([nome, count]) => ({ nome, count }))
  }, [prestadoresBase, filtroEstado, filtroRegiao])

  const gruposDisponiveis = useMemo(() => {
    const map = new Map<string, { nome: string; count: number }>()
    prestadoresBase.forEach(p => {
      if (!p.grupo_id || !p.grupo_nome) return
      const entry = map.get(p.grupo_id) ?? { nome: p.grupo_nome, count: 0 }
      entry.count++
      map.set(p.grupo_id, entry)
    })
    return Array.from(map.entries())
      .sort((a, b) => b[1].count - a[1].count)
      .map(([id, { nome, count }]) => ({ id, nome, count }))
  }, [prestadoresBase])

  const categoriasDisponiveis = useMemo(() => {
    const map = new Map<string, { nome: string; count: number }>()
    prestadoresBase
      .filter(p => !filtroGrupo || p.grupo_id === filtroGrupo)
      .forEach(p => {
        if (!p.categoria_id || !p.categoria) return
        const entry = map.get(p.categoria_id) ?? { nome: p.categoria, count: 0 }
        entry.count++
        map.set(p.categoria_id, entry)
      })
    return Array.from(map.entries())
      .sort((a, b) => b[1].count - a[1].count)
      .map(([id, { nome, count }]) => ({ id, nome, count }))
  }, [prestadoresBase, filtroGrupo])

  // ─── Lista final com todos os filtros aplicados ───────────────────────────
  const cidadeEfetiva = filtroCidade || cidadeGeo || null

  const prestadoresExibidos = useMemo(() => {
    return prestadoresBase.filter(p => {
      if (filtroEstado    && p.estado_sigla  !== filtroEstado)    return false
      if (filtroRegiao    && p.regiao_id     !== filtroRegiao)    return false
      if (filtroGrupo     && p.grupo_id      !== filtroGrupo)     return false
      if (filtroCategoria && p.categoria_id  !== filtroCategoria) return false

      if (cidadeEfetiva) {
        const cn = cidadeEfetiva.toLowerCase().trim()
        const nomeBate    = p.cidade_nome?.toLowerCase().trim() === cn
        const atendeBate  = p.cidades_atendidas?.some(c => c?.toLowerCase().trim() === cn)
        if (!nomeBate && !atendeBate) return false
      }

      return true
    })
  }, [prestadoresBase, filtroEstado, filtroRegiao, filtroCidade, filtroGrupo, filtroCategoria, cidadeEfetiva])

  return {
    prestadoresBase,
    prestadoresExibidos,
    estadosDisponiveis,
    regioesDisponiveis,
    cidadesDisponiveis,
    gruposDisponiveis,
    categoriasDisponiveis,
    cidadeGeo,
    loading,
    erro,
  }
}
