//components/LogAcesso.tsx

'use client'
import { useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { insertAcesso } from '@/lib/db/acessos'
import { setCookie, getCookie } from '@/lib/cookies'

// FIX: era sessionStorage — resetava a cada nova aba/janela, gerando
// ACESSO_SESSAO duplicado várias vezes na mesma sessão real de uso (ex:
// abrir um link em nova aba já contava como sessão nova). Cookie de 24h
// mantém o dedupe estável entre abas, mesmo padrão já usado em
// visitas_perfil (lib/db/visitasPerfil.ts).
const COOKIE_KEY = 'pqf_sessao_registrada'
const DEDUPE_DIAS = 1

/**
 * Componente invisível. Renderiza null e registra um acesso por sessão real
 * de uso (24h), não por aba de browser. Coloque uma única vez no layout
 * raiz, após o provider de auth.
 */
export default function LogAcesso() {
  useEffect(() => {
    const registrar = async () => {
      if (getCookie(COOKIE_KEY)) return

      const { data: { session } } = await supabase.auth.getSession()

      try {
        await insertAcesso({
          userId: session?.user?.id ?? null,
          userEmail: session?.user?.email ?? null,
        })
        setCookie(COOKIE_KEY, '1', DEDUPE_DIAS)
      } catch (err) {
        console.error('[LogAcesso] Falha ao registrar acesso:', err)
      }
    }

    registrar()
  }, [])

  return null
}
