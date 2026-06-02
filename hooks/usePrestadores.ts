import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { getPrestadoresAtivos, getMediasAvaliacoes } from '@/lib/db/prestadores'
import { normalizarTermo, filtrarPrestadores } from '@/lib/buscaUtils'
import { pesoOrdenacao } from '@/lib/ordenacao'

type Prestador = {
  id: string
  origem_tipo: string
  verificado: boolean
  cidade_nome: string
  cidades_atendidas?: string[]
  cidades?: { nome: string; estado_sigla: string; regiao_id: string } | null
  categorias?: { nome: string } | null
  media_nota: number
  total_avals: number
  [key: string]: unknown
}

function calcularMedias(medias: { prestador_id: string; nota: number }[]) {
  const map: Record<string, { soma: number; total: number }> = {}
  medias.forEach(({ prestador_id, nota }) => {
    if (!map[prestador_id]) map[prestador_id] = { soma: 0, total: 0 }
    map[prestador_id].soma  += nota
    map[prestador_id].total += 1
  })
  return map
}

export function usePrestadores(queryBusca: string, filtroHab: string, filtroCidNome: string) {
  const router = useRouter()
  const [prestadoresBase, setPrestadoresBase] = useState<Prestador[]>([])
  const [loading, setLoading] = useState(true)
  const [erro, setErro]       = useState(false)

  useEffect(() => {
    async function fetchDados() {
      setLoading(true)
      setErro(false)
      setPrestadoresBase([])

      try {
        const [{ data: pData, error: pError }, { data: medias }] = await Promise.all([
          getPrestadoresAtivos(),
          getMediasAvaliacoes(),
        ])

        if (pError) throw pError

        const mediaMap = calcularMedias(medias || [])

        const normalizados: Prestador[] = (pData || []).map(p => ({
          ...p,
          cidade_nome: p.cidades?.nome || '',
          categoria:   p.categorias?.nome || 'Profissional',
          media_nota:  mediaMap[p.id] ? mediaMap[p.id].soma / mediaMap[p.id].total : 0,
          total_avals: mediaMap[p.id]?.total || 0,
        }))

        const termo     = normalizarTermo(queryBusca, filtroHab)
        const vitrines  = normalizados.filter(p => p.origem_tipo === 'vitrine')
        const demais    = normalizados.filter(p => p.origem_tipo !== 'vitrine')
        const filtrados = filtrarPrestadores(demais, termo)

        setPrestadoresBase([
          ...vitrines,
          ...[...filtrados].sort((a, b) => pesoOrdenacao(a) - pesoOrdenacao(b)),
        ])
      } catch (err) {
        console.error('[usePrestadores]', err)
        setErro(true)
      } finally {
        setLoading(false)
      }
    }

    fetchDados()
  }, [queryBusca, filtroHab])

  // Cidades disponíveis para o filtro
  const cidadesDisponiveis = useMemo(() => {
    const set = new Set<string>()
    prestadoresBase.forEach(p => {
      if (p.cidade_nome) set.add(p.cidade_nome)
      if (Array.isArray(p.cidades_atendidas))
        p.cidades_atendidas.forEach(c => { if (c?.trim()) set.add(c.trim()) })
    })
    return Array.from(set).sort()
  }, [prestadoresBase])

  // Prestadores filtrados pela cidade selecionada
  const prestadoresExibidos = useMemo(() => {
    if (!filtroCidNome) return prestadoresBase
    const cidadeNorm = filtroCidNome.toLowerCase().trim()
    return prestadoresBase.filter(p =>
      p.cidade_nome?.toLowerCase().trim() === cidadeNorm ||
      p.cidades_atendidas?.some(c => c?.toLowerCase().trim() === cidadeNorm)
    )
  }, [prestadoresBase, filtroCidNome])

  function toggleCidade(nomeCidade: string) {
    const params = new URLSearchParams(window.location.search)
    if (filtroCidNome === nomeCidade) params.delete('cidade')
    else params.set('cidade', nomeCidade)
    router.push(`/prestadores?${params.toString()}`)
  }

  return { prestadoresBase, prestadoresExibidos, cidadesDisponiveis, loading, erro, toggleCidade }
}