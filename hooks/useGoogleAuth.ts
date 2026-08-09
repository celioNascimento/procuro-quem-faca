// hooks/useGoogleAuth.ts 

import { useState } from 'react'
import { supabase } from '@/lib/supabase'

interface UseGoogleAuthParams {
  onLog?: (acao: string, detalhes?: Record<string, any>) => Promise<void> | void
  // Role a aplicar caso este login crie uma conta nova (via garantirRoleInicial
  // no callback). Omitir quando o botão for usado num contexto neutro, onde
  // um usuário novo deve cair em /auth/escolha normalmente.
  roleDesejado?: 'prestador' | 'cliente'
}

export function useGoogleAuth({ onLog, roleDesejado }: UseGoogleAuthParams = {}) {
  const [isRedirecting, setIsRedirecting] = useState(false)

  const handleLogin = async () => {
    try {
      setIsRedirecting(true)

      if (onLog) {
        await onLog('TENTATIVA_LOGIN_GOOGLE', { platform: 'web' })
      }

      // IMPORTANTE: usar origin para garantir URL absoluta e sem barras extras.
      // roleDesejado vai como query param — o Supabase apenas anexa `code`
      // à URL de redirectTo, preservando os demais params, então
      // app/auth/callback/route.ts consegue ler `role` normalmente.
      const callbackUrl = new URL('/auth/callback', window.location.origin)
      if (roleDesejado) {
        callbackUrl.searchParams.set('role', roleDesejado)
      }

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: callbackUrl.toString(),
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      })

      if (error) throw error
    } catch (error: any) {
      console.error('Erro login Google:', error.message)
      setIsRedirecting(false)
    }
  }

  return { isRedirecting, handleLogin }
}