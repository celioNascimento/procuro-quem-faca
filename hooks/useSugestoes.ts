import { useState, useEffect } from 'react'
import { getSugestoesDestaque, getSugestoesPorBusca } from '@/lib/db/categorias'
import { SUGESTOES_FALLBACK } from '../config/categorias'

export function useSugestoes(busca: string) {
  const [sugestoes, setSugestoes] = useState<string[]>(SUGESTOES_FALLBACK)

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
        }
        // se vazio, mantém sugestões anteriores
      } catch {
        // mantém fallback — não limpa
      }
    }

    const timer = setTimeout(buscarSugestoes, 300)
    return () => {
      clearTimeout(timer)
      cancelado = true
    }
  }, [busca])

  return sugestoes
}