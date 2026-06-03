import { useState, useEffect } from 'react'
import { getSugestoesDestaque, getSugestoesPorBusca } from '@/lib/db/categorias'
import { SUGESTOES_FALLBACK } from '@/config/categorias'

export function useSugestoes(busca: string) {
  const [sugestoes, setSugestoes] = useState<string[]>([]) // ← vazio, sem fallback inicial
  const [carregado, setCarregado] = useState(false)

  useEffect(() => {
    let cancelado = false

    const buscarSugestoes = async () => {
      try {
        const { data } = busca.trim()
          ? await getSugestoesPorBusca(busca)
          : await getSugestoesDestaque()

        if (cancelado) return

        if (data && data.length > 0) {
          setSugestoes(data.map(i => i.nome))
        } else {
          setSugestoes(SUGESTOES_FALLBACK) // fallback só se banco retornar vazio
        }
      } catch {
        if (!cancelado) setSugestoes(SUGESTOES_FALLBACK) // fallback só em erro
      } finally {
        if (!cancelado) setCarregado(true)
      }
    }

    const timer = setTimeout(buscarSugestoes, busca.trim() ? 300 : 0) // sem debounce no carregamento inicial
    return () => {
      clearTimeout(timer)
      cancelado = true
    }
  }, [busca])

  return { sugestoes, carregado }
}