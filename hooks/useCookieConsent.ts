//hooks/useCookieConsent.ts

'use client'
import { useEffect, useState } from 'react'
import { insertLog, checkLogExists } from '@/lib/db/logs'
import { supabase } from '@/lib/supabase'
import posthog from 'posthog-js'

const LOCAL_KEY = 'cookie_consent_aceito'
const ACAO = 'ACEITE_COOKIES'

export function useCookieConsent() {
  const [isVisible, setIsVisible] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function verificar() {
      try {
        const localAceite = localStorage.getItem(LOCAL_KEY)

        if (localAceite) {
          setIsVisible(false)
          return
        }

        const { data: { session } } = await supabase.auth.getSession()

        if (session?.user?.id) {
          const jaAceitouNoBanco = await checkLogExists(session.user.id, ACAO)

          if (jaAceitouNoBanco) {
            localStorage.setItem(LOCAL_KEY, 'true')
            setIsVisible(false)
            return
          }
        }

        setIsVisible(true)
      } catch {
        setIsVisible(true)
      } finally {
        setLoading(false)
      }
    }

    verificar()
  }, [])

  async function aceitar() {
    try {
      await insertLog({
        acao: ACAO,
        entidadeTipo: 'consentimento',
        detalhes: {
          navegador: window.navigator.userAgent,
          resolucao: `${window.screen.width}x${window.screen.height}`,
          data_aceite: new Date().toISOString(),
        },
      })
    } catch (err) {
      console.error('Erro ao registrar consentimento:', err)
    } finally {
      localStorage.setItem(LOCAL_KEY, 'true')
      posthog.opt_in_capturing()
      setIsVisible(false)
    }
  }

  return { isVisible, aceitar, loading }
}