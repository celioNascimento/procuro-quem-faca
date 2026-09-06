// hooks/useSugestoes.ts

import { useState, useEffect } from 'react'
import { getSugestoesDestaque, getSugestoesPorBusca } from '@/lib/db/categorias'
import { SUGESTOES_FALLBACK } from '@/config/categorias'

const MAX_SUGESTOES = 8

export function useSugestoes(busca: string) {
  const [sugestoes, setSugestoes] = useState<string[]>([])
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
          setSugestoes(data.slice(0, MAX_SUGESTOES).map(i => i.nome))
        } else {
          setSugestoes(SUGESTOES_FALLBACK)
        }
      } catch {
        if (!cancelado) setSugestoes(SUGESTOES_FALLBACK)
      } finally {
        if (!cancelado) setCarregado(true)
      }
    }

    const delay = busca.trim() ? 300 : 0
    const timer = setTimeout(buscarSugestoes, delay)
    return () => {
      clearTimeout(timer)
      cancelado = true
    }
  }, [busca])

  return { sugestoes, carregado }
}
