// hooks/usePerfilStatus.ts

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { buscarPrestadorPorUserId } from '@/lib/services/cadastroPrestador.service'
import { buscarMotivoBloqueio } from '@/lib/services/bloqueio.service'

export function usePerfilStatus() {
  const [cadastroCompleto, setCadastroCompleto] = useState(false)
  const [validando, setValidando] = useState(true)
  const [slug, setSlug] = useState<string | null>(null)
  const [bloqueado, setBloqueado] = useState(false)
  const [motivoBloqueio, setMotivoBloqueio] = useState<string | null>(null)
  const [prestadorId, setPrestadorId] = useState<number | null>(null)

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
      setPrestadorId(prestador?.id ? Number(prestador.id) : null)
      setSlug(prestador?.slug || null)
      const estaBloqueado = prestador?.bloqueado === true || prestador?.status === 'bloqueado'
      setBloqueado(estaBloqueado)
      // O motivo mora em tabela própria; só o admin e o próprio prestador conseguem lê-lo
      const motivo = estaBloqueado && prestador?.id
        ? await buscarMotivoBloqueio(Number(prestador.id)).catch(() => null)
        : null
      setMotivoBloqueio(motivo)
    } catch {
      setCadastroCompleto(false)
    } finally {
      setValidando(false)
    }
  }, [])

  useEffect(() => {
    queueMicrotask(() => verificar())
  }, [verificar])

  return { cadastroCompleto, validando, slug, prestadorId, bloqueado, motivoBloqueio, revalidar: verificar }
}
