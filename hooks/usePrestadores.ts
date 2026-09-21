'use client'
// hooks/usePrestadores.ts

import { useState, useEffect, useMemo, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { getPrestadoresAtivos, getMediasAvaliacoes } from '@/lib/db/prestadores'
import { normalizarTermo, filtrarPrestadores } from '@/lib/buscaUtils'
import { pesoOrdenacao } from '@/lib/ordenacao'
import { insertLog } from '@/lib/db/logs'
import { useFiltrosParams } from './useFiltrosParams'
import { useLocation } from '@/lib/contexts/LocationContext'
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

function normalizarCidade(valor: string | null | undefined): string {
  return (valor || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+-\s+[a-z]{2}$/i, '')
    .trim()
}

function normalizarId(valor: string | number | null | undefined): string {
  return valor == null ? '' : String(valor)
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
  const { cidadeAtual, loading: locationLoading } = useLocation()

  const [prestadoresBase, setPrestadoresBase] = useState<Prestador[]>([])
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState(false)
  const buscasVaziasRegistradas = useRef(new Set<string>())

  // Geolocalização silenciosa — só ativa quando não há nenhuma âncora de cidade:
  // nem na URL, nem na query textual, nem no contexto do usuário.
  useEffect(() => {
    if (locationLoading || cidadeAtual || filtroCidade || filtroEstado || filtroRegiao || queryBusca) return
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

          if (nome) {
            const params = new URLSearchParams(window.location.search)
            if (!params.has('cidade')) {
              params.set('cidade', nome)
              router.replace(`/prestadores?${params.toString()}`, { scroll: false })
            }
          }
        } catch {
          // silencioso
        }
      },
      () => {},
      { timeout: 8000 }
    )
  }, [cidadeAtual, locationLoading, filtroCidade, filtroEstado, filtroRegiao, queryBusca, router])

  // Fetch principal — só refaz quando a busca textual muda.
  // Filtros de localização/categoria filtram no cliente sobre prestadoresBase.
  useEffect(() => {
    let ativo = true

    async function fetchDados() {
      if (locationLoading) return

      setLoading(true)
      setErro(false)
      setPrestadoresBase([])

      try {
        // A cidade salva é apenas um fallback. Quando a busca informa uma cidade
        // ("serviço em cidade"), ou quando há filtros amplos, precisamos consultar
        // o catálogo completo para que o filtro local encontre os resultados certos.
        // Sem localização salva também consultamos o catálogo completo — a busca
        // não pode depender da permissão de geolocalização/cookie do usuário.
        const { cidadeExtraida } = parsearBusca(queryBusca)
        const cidadeIdDaConsulta =
          cidadeExtraida || filtroCidade || filtroEstado || filtroRegiao
            ? undefined
            : cidadeAtual?.id

        // O catálogo é público e stateless; não cancelamos o fetch manualmente.
        // Alguns navegadores, incluindo o Brave com Shields ativos, reportam o
        // cancelamento como erro de rede e deixavam a tela presa em "erro".
        const { data: pData, error: pError } = await getPrestadoresAtivos(cidadeIdDaConsulta)

        if (!ativo) return

        if (pError) throw pError

        const { data: medias, error: mediasError } = await getMediasAvaliacoes(
          (pData || []).map(p => p.id)
        )
        if (mediasError) throw mediasError

        const mediaMap = calcularMedias(medias || [])

        const normalizados: Prestador[] = (pData || []).map(p => {
          const cidadeRelacionada = Array.isArray(p.cidades) ? p.cidades[0] : p.cidades
          const categoriaRelacionada = Array.isArray(p.categorias) ? p.categorias[0] : p.categorias
          const regiaoRelacionada = Array.isArray(p.regioes) ? p.regioes[0] : p.regioes
          const regiaoDaCidade = cidadeRelacionada
            ? Array.isArray(cidadeRelacionada.regioes) ? cidadeRelacionada.regioes[0] : cidadeRelacionada.regioes
            : null
          const grupoRelacionado = Array.isArray(categoriaRelacionada?.categorias_grupos)
            ? categoriaRelacionada.categorias_grupos[0]
            : categoriaRelacionada?.categorias_grupos

          return {
            ...p,
            cidade_nome:   cidadeRelacionada?.nome                  || '',
            cidade_id:     normalizarId(cidadeRelacionada?.id           || p.cidade_id),
            categoria:     categoriaRelacionada?.nome               || 'Profissional',
            categoria_id:  normalizarId(categoriaRelacionada?.id         || p.categoria_id),
            estado_sigla:  p.estado_sigla                          || cidadeRelacionada?.estado_sigla || '',
            regiao_id:     normalizarId(p.regiao_id                    || cidadeRelacionada?.regiao_id),
            regiao_nome:   regiaoRelacionada?.nome                    || regiaoDaCidade?.nome || '',
            grupo_id:      normalizarId(p.grupo_id                     || categoriaRelacionada?.grupo_id || grupoRelacionado?.id),
            grupo_nome:    grupoRelacionado?.nome                    || '',
            media_nota:    mediaMap[p.id] ? mediaMap[p.id].soma / mediaMap[p.id].total : 0,
            total_avals:   mediaMap[p.id]?.total                    || 0,
          }
        })

        const { termo } = parsearBusca(queryBusca)
        const termoNorm = normalizarTermo(termo, filtroHab)

        const vitrines = normalizados.filter(p => p.origem_tipo === 'vitrine')
        const demais   = normalizados.filter(p => p.origem_tipo !== 'vitrine')
        const filtrados = filtrarPrestadores(demais, termoNorm)

        setPrestadoresBase([
          ...vitrines,
          ...[...filtrados].sort((a, b) => pesoOrdenacao(a) - pesoOrdenacao(b)),
        ])

      } catch (err) {
        if (!ativo) return
        const erroAbort = err as { name?: string; message?: string }
        const foiAbortado = erroAbort?.name === 'AbortError' || erroAbort?.message?.includes('aborted')
        if (foiAbortado) return
        console.error('[usePrestadores]', err)
        setErro(true)
      } finally {
        if (ativo) setLoading(false)
      }
    }

    fetchDados()
    return () => {
      ativo = false
    }

  }, [
    queryBusca,
    filtroHab,
    filtroCidade,
    filtroEstado,
    filtroRegiao,
    cidadeAtual?.id,
    locationLoading,
  ])

  // ─── Opções disponíveis em cascata ────────────────────────────────────────

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
  // Ordem de prioridade: URL > query textual ("em X") > contexto do usuário
  const cidadeDaBusca = queryBusca.match(/^(.+?)\s+em\s+(.+)$/i)?.[2]?.trim() || null
  // A localização do contexto é apenas um fallback para a busca inicial.
  // Quando o usuário escolhe estado ou região, esses filtros mais amplos
  // devem permitir resultados fora da cidade atual.
  const cidadeEfetiva =
    filtroCidade ||
    cidadeDaBusca ||
    (!filtroEstado && !filtroRegiao && !locationLoading ? cidadeAtual?.nome : null) ||
    null
  const cidadeEfetivaNormalizada = normalizarCidade(cidadeEfetiva)

  const prestadoresExibidos = useMemo(() => {
    return prestadoresBase.filter(p => {
      if (filtroEstado    && p.estado_sigla  !== filtroEstado)    return false
      if (filtroRegiao    && p.regiao_id     !== filtroRegiao)    return false
      if (filtroGrupo     && p.grupo_id      !== filtroGrupo)     return false
      if (filtroCategoria && p.categoria_id  !== filtroCategoria) return false

      if (cidadeEfetivaNormalizada && normalizarCidade(p.cidade_nome) !== cidadeEfetivaNormalizada) {
        return false
      }

      return true
    })
  }, [prestadoresBase, filtroEstado, filtroRegiao, filtroGrupo, filtroCategoria, cidadeEfetivaNormalizada])

  useEffect(() => {
    const termo = queryBusca.trim()
    const temIntencaoDeBusca = Boolean(
      termo || filtroCidade || filtroEstado || filtroRegiao || filtroGrupo || filtroCategoria
    )

    if (loading || erro || locationLoading || prestadoresExibidos.length > 0 || !temIntencaoDeBusca) return

    const chaveBusca = JSON.stringify({
      termo,
      filtroHab,
      filtroCidade,
      filtroEstado,
      filtroRegiao,
      filtroGrupo,
      filtroCategoria,
      cidadeEfetiva: cidadeEfetivaNormalizada,
    })

    if (buscasVaziasRegistradas.current.has(chaveBusca)) return
    buscasVaziasRegistradas.current.add(chaveBusca)

    void insertLog({
      acao: 'BUSCA_SEM_SUCESSO',
      detalhes: {
        termo,
        filtroHab: filtroHab || null,
        cidade: filtroCidade || null,
        estado: filtroEstado || null,
        regiao: filtroRegiao || null,
        grupo: filtroGrupo || null,
        categoria: filtroCategoria || null,
        cidadeEfetiva: cidadeEfetivaNormalizada || null,
      },
    }).catch((error) => {
      console.error('[v0] Falha ao registrar busca sem resultados:', error)
    })
  }, [
    queryBusca,
    filtroHab,
    filtroCidade,
    filtroEstado,
    filtroRegiao,
    filtroGrupo,
    filtroCategoria,
    cidadeEfetivaNormalizada,
    loading,
    erro,
    locationLoading,
    prestadoresExibidos.length,
  ])

  return {
    prestadoresBase,
    prestadoresExibidos,
    estadosDisponiveis,
    regioesDisponiveis,
    cidadesDisponiveis,
    gruposDisponiveis,
    categoriasDisponiveis,
    loading,
    erro,
  }
}
