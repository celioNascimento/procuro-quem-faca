import { useState } from 'react'
import type { FotoProjeto } from '@/types/perfil'

export function useSlides(fotos: FotoProjeto[]) {
  const [current, setCurrent] = useState(0)

  const sorted = [...fotos].sort((a, b) => a.ordem - b.ordem)
  const fotoAtual = sorted[current] ?? null

  const next = (e: React.MouseEvent) => {
    e.stopPropagation()
    setCurrent(p => (p + 1) % sorted.length)
  }

  const prev = (e: React.MouseEvent) => {
    e.stopPropagation()
    setCurrent(p => (p - 1 + sorted.length) % sorted.length)
  }

  return { sorted, fotoAtual, current, next, prev }
}