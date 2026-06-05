import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

interface Comentario {
  id: string
  texto: string
  criado_at: string
}

export function useComentariosFoto(fotoId: string | undefined) {
  const [comentarios, setComentarios] = useState<Comentario[]>([])

  useEffect(() => {
    if (!fotoId) { setComentarios([]); return }

    supabase
      .from('portfolio_comentarios')
      .select('*')
      .eq('foto_id', fotoId)
      .eq('autor_tipo', 'cliente')
      .order('criado_at', { ascending: true })
      .then(({ data, error }) => {
        if (!error) setComentarios(data || [])
      })
  }, [fotoId])

  return comentarios
}