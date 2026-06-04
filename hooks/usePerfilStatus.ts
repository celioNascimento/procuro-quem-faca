// hooks/usePerfilStatus.ts
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export function usePerfilStatus() {
  const [cadastroCompleto, setCadastroCompleto] = useState(false)
  const [validando, setValidando] = useState(true)
  const [slug, setSlug] = useState<string | null>(null)

  useEffect(() => {
    async function verificar() {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session?.user?.id) { setValidando(false); return }

        const { data: prestador } = await supabase
          .from('prestadores')
          .select('nome, whatsapp, categoria_id, status, slug')
          .eq('user_id', session.user.id)
          .maybeSingle()

        const completo = !!(
          prestador?.nome?.trim() &&
          prestador?.whatsapp &&
          prestador?.categoria_id &&
          prestador?.status === 'ativo'
        )
        setCadastroCompleto(completo)
        setSlug(prestador?.slug || null)
      } catch {
        setCadastroCompleto(false)
      } finally {
        setValidando(false)
      }
    }
    verificar()
  }, [])

  return { cadastroCompleto, validando, slug }
}