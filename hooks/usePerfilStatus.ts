// hooks/usePerfilStatus.ts

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { buscarPrestadorPorUserId } from '@/lib/services/cadastroPrestador.service'

export function usePerfilStatus() {
  const [cadastroCompleto, setCadastroCompleto] = useState(false)
  const [validando, setValidando] = useState(true)
  const [slug, setSlug] = useState<string | null>(null)

  const verificar = useCallback(async () => {
    try {
      setValidando(true)
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user?.id) { setValidando(false); return }

      const prestador = await buscarPrestadorPorUserId(session.user.id)

      const completo = !!(
        prestador?.nome?.trim() &&
        prestador?.whatsapp &&
        prestador?.categoria_id
      )
      setCadastroCompleto(completo)
      setSlug(prestador?.slug || null)
    } catch {
      setCadastroCompleto(false)
    } finally {
      setValidando(false)
    }
  }, [])

  useEffect(() => {
    verificar()
  }, [verificar])

  return { cadastroCompleto, validando, slug, revalidar: verificar }
}