// hooks/useSugestoes.ts

import { useState, useEffect } from 'react'
import { getSugestoesPorBusca } from '@/lib/db/categorias'
import { SUGESTOES_FALLBACK } from '@/config/categorias'

const MAX_SUGESTOES = 8

export function useSugestoes(busca: string) {
  // Inicia já com o fallback visível — sem tela em branco
  const [sugestoes, setSugestoes] = useState<string[]>(SUGESTOES_FALLBACK)
  const [carregado, setCarregado] = useState(true)

  useEffect(() => {
    // Sem busca digitada, não vale sobrecarregar o banco —
    // o fallback já cobre bem o estado inicial.
    if (!busca.trim()) return

    let cancelado = false

    const buscarSugestoes = async () => {
      try {
        const { data } = await getSugestoesPorBusca(busca)
        if (cancelado) return
        if (data && data.length > 0) {
          setSugestoes(data.slice(0, MAX_SUGESTOES).map(i => i.nome))
        }
        // Se não achou nada, mantém o fallback já visível
      } catch {
        // silencioso — fallback já está na tela
      }
    }

    const timer = setTimeout(buscarSugestoes, 300)
    return () => {
      clearTimeout(timer)
      cancelado = true
    }
  }, [busca])

  return { sugestoes, carregado }
}
