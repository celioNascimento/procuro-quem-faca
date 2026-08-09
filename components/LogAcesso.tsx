//components/LogAcesso.tsx

'use client'
import { useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { insertAcesso } from '@/lib/db/acessos'

const SESSAO_KEY = 'sessao_registrada'

/**
 * Componente invisível. Renderiza null e registra um acesso por sessão de browser.
 * Coloque uma única vez no layout raiz, após o provider de auth.
 */
export default function LogAcesso() {
  useEffect(() => {
    const registrar = async () => {
      if (sessionStorage.getItem(SESSAO_KEY)) return

      const { data: { session } } = await supabase.auth.getSession()

      try {
        await insertAcesso({
          userId: session?.user?.id ?? null,
          userEmail: session?.user?.email ?? null,
        })
        sessionStorage.setItem(SESSAO_KEY, 'true')
      } catch (err) {
        console.error('[LogAcesso] Falha ao registrar acesso:', err)
      }
    }

    registrar()
  }, [])

  return null
}