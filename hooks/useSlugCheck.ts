//hooks/useSlugCheck.ts

import { useState, useEffect, useCallback } from 'react'
import { verificarSlugDisponivel } from '@/lib/services/cadastroPrestador.service'

interface UseSlugCheckOptions {
  slug: string
  idAtual?: number | string | null
}

export function useSlugCheck({ slug, idAtual }: UseSlugCheckOptions) {
  const [disponivel, setDisponivel] = useState(true)
  const [checando, setChecando] = useState(false)

  const verificar = useCallback(async (slugTeste: string) => {
    if (!slugTeste || slugTeste.length < 3) return
    setChecando(true)
    const disponivel = await verificarSlugDisponivel(slugTeste, idAtual)
    setDisponivel(disponivel)
    setChecando(false)
  }, [idAtual])

  useEffect(() => {
    if (!slug) return
    const timer = setTimeout(() => verificar(slug), 500)
    return () => clearTimeout(timer)
  }, [slug, verificar])

  return { disponivel, checando }
}