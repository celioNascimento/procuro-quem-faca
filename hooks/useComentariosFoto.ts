//hooks/useComentariosFoto.ts

import { useState, useEffect } from 'react'
import { getComentariosDaFoto } from '@/lib/services/uploadWizard.service'
import type { ComentarioPortfolio } from '@/types/portfolio'

export function useComentariosFoto(fotoId: string | undefined) {
   const [comentarios, setComentarios] = useState<ComentarioPortfolio[]>([])

  useEffect(() => {
    if (!fotoId) { setComentarios([]); return }

   getComentariosDaFoto(fotoId)
       .then(setComentarios)
       .catch(() => setComentarios([]))
  }, [fotoId])

  return comentarios
}