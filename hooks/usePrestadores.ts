//hooks/usePrestadores.ts

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { getPrestadoresAtivos, getMediasAvaliacoes } from '@/lib/db/prestadores'
import { normalizarTermo, filtrarPrestadores } from '@/lib/buscaUtils'
import { pesoOrdenacao } from '@/lib/ordenacao'
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

// Extrai "pedreiro" e "Londrina" de "pedreiro em Londrina"
function parsearBusca(query: string): { termo: string; cidadeExtraida: string | null } {
  const match = query.match(/^(.+?)\s+em\s+(.+)$/i)
  if (match) {
    return {
      termo: match[1].trim(),
      cidadeExtraida: match[2].trim(),
    }
  }
  return { termo: query, cidadeExtraida: null }
}

export function usePrestadores(queryBusca: string, filtroHab: string, filtroCidNome: string) {
  const router = useRouter()
  const [prestadoresBase, setPrestadoresBase] = useState<Prestador[]>([])
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState(false)
  const [cidadeGeo, setCidadeGeo] = useState<string | null>(null)

  // Geolocalização silenciosa — só roda uma vez, só se não vier cidade na URL
  useEffect(() => {
    if (filtroCidNome) return // URL já tem cidade, não precisa de geo
    if (!navigator.geolocation) return

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10`
          )
          const data = await res.json()
          const nome = data.address?.city || data.address?.town || data.address?.municipality
          if (nome) setCidadeGeo(nome)
        } catch {
          // silencioso — falha não bloqueia nada
        }
      },
      () => { }, // permissão negada — silencioso
      { timeout: 8000 }
    )
  }, []) // só na montagem

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
          cidade_nome: p.cidades?.nome || '',
          categoria: p.categorias?.nome || 'Profissional',
          media_nota: mediaMap[p.id] ? mediaMap[p.id].soma / mediaMap[p.id].total : 0,
          total_avals: mediaMap[p.id]?.total || 0,
        }))

        const { termo, cidadeExtraida } = parsearBusca(queryBusca)
        const termoNorm = normalizarTermo(termo, filtroHab)

        const vitrines = normalizados.filter(p => p.origem_tipo === 'vitrine')
        const demais = normalizados.filter(p => p.origem_tipo !== 'vitrine')
        const filtrados = filtrarPrestadores(demais, termoNorm)

        setPrestadoresBase([
          ...vitrines,
          ...[...filtrados].sort((a, b) => pesoOrdenacao(a) - pesoOrdenacao(b)),
        ])

        // Se extraiu cidade da query e não tem cidade na URL, aplica via router
        if (cidadeExtraida && !filtroCidNome) {
          const params = new URLSearchParams(window.location.search)
          params.set('cidade', cidadeExtraida)
          // Atualiza a URL sem recarregar — silencioso
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

  const cidadesDisponiveis = useMemo(() => {
    const contagem: Record<string, number> = {}

    prestadoresBase.forEach(p => {
      if (p.cidade_nome) {
        contagem[p.cidade_nome] = (contagem[p.cidade_nome] || 0) + 1
      }
      if (Array.isArray(p.cidades_atendidas)) {
        p.cidades_atendidas.forEach(c => {
          if (c?.trim()) contagem[c.trim()] = (contagem[c.trim()] || 0) + 1
        })
      }
    })

    return Object.entries(contagem)
      .sort((a, b) => b[1] - a[1]) // mais prestadores primeiro
      .map(([nome]) => nome)
  }, [prestadoresBase])

  // Prioridade: URL > cidade extraída da query > geolocalização
  const cidadeEfetiva = filtroCidNome || cidadeGeo || null

  const prestadoresExibidos = useMemo(() => {
    if (!cidadeEfetiva) return prestadoresBase
    const cidadeNorm = cidadeEfetiva.toLowerCase().trim()
    return prestadoresBase.filter(p =>
      p.cidade_nome?.toLowerCase().trim() === cidadeNorm ||
      p.cidades_atendidas?.some(c => c?.toLowerCase().trim() === cidadeNorm)
    )
  }, [prestadoresBase, cidadeEfetiva])

  function toggleCidade(nomeCidade: string) {
    const params = new URLSearchParams(window.location.search)
    if (filtroCidNome === nomeCidade) params.delete('cidade')
    else params.set('cidade', nomeCidade)
    router.push(`/prestadores?${params.toString()}`)
  }

  return { prestadoresBase, prestadoresExibidos, cidadesDisponiveis, cidadeGeo, loading, erro, toggleCidade }
}