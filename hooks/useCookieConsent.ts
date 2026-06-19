import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { checkConsentLog, insertConsentLog } from '@/lib/db/cookieConsent'

const LOCAL_KEY = 'app_cookie_consent'
const DELAY_MS = 1500

export function useCookieConsent() {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>

    const verificar = async () => {
      // 1. Cache local — evita qualquer requisição ao banco
      if (localStorage.getItem(LOCAL_KEY)) return

      // 2. Usuário autenticado — verifica se já aceitou em outra sessão
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        const jaAceitou = await checkConsentLog(session.user.id)
        if (jaAceitou) {
          localStorage.setItem(LOCAL_KEY, 'true')
          return
        }
      }

      // 3. Sem registro — exibe o banner após delay
      timer = setTimeout(() => setIsVisible(true), DELAY_MS)
    }

    verificar()
    return () => clearTimeout(timer)
  }, [])

  const aceitar = async () => {
    localStorage.setItem(LOCAL_KEY, 'true')
    setIsVisible(false)

    try {
      await insertConsentLog()
    } catch (err) {
      console.error('[useCookieConsent] Erro ao gravar aceite:', err)
    }
  }

  return { isVisible, aceitar }
}