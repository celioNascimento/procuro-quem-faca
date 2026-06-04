import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

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
    const { data } = await supabase
      .from('prestadores')
      .select('id')
      .eq('slug', slugTeste)
      .neq('id', idAtual ?? -1)
      .maybeSingle()
    setDisponivel(!data)
    setChecando(false)
  }, [idAtual])

  useEffect(() => {
    if (!slug) return
    const timer = setTimeout(() => verificar(slug), 500)
    return () => clearTimeout(timer)
  }, [slug, verificar])

  return { disponivel, checando }
}