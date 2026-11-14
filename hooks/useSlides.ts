//hooks/useSlides.ts

import { useState } from 'react'
import type { FotoProjeto } from '@/types/perfil'

/**
 * Fotos de um trabalho em ordem (Antes, Durante, Depois).
 * `comecarNaUltima`: abre na última foto, que é a que aparece na capa do portfólio.
 */
export function useSlides(fotos: FotoProjeto[], comecarNaUltima = false) {
  const [current, setCurrent] = useState(() => (comecarNaUltima ? Math.max(fotos.length - 1, 0) : 0))

  const sorted = [...fotos].sort((a, b) => a.ordem - b.ordem)
  const fotoAtual = sorted[current] ?? null

  const next = (e?: React.MouseEvent) => {
    e?.stopPropagation()
    setCurrent(p => (p + 1) % sorted.length)
  }

  const prev = (e?: React.MouseEvent) => {
    e?.stopPropagation()
    setCurrent(p => (p - 1 + sorted.length) % sorted.length)
  }

  const ir = (indice: number) => {
    if (sorted.length === 0) return
    setCurrent(Math.min(Math.max(indice, 0), sorted.length - 1))
  }

  return { sorted, fotoAtual, current, next, prev, ir }
}
