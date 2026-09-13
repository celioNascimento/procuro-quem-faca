//components/PostHogProvider.tsx

'use client'

import posthog from 'posthog-js'
import { PostHogProvider as PHProvider } from 'posthog-js/react'
import { useEffect } from 'react'

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_POSTHOG_KEY
    const apiHost = process.env.NEXT_PUBLIC_POSTHOG_HOST

    // Telemetria é opcional: não inicializar sem configuração evita erros no
    // console e trabalho desnecessário durante o desenvolvimento/preview.
    if (!key || !apiHost || posthog.__loaded) return

    posthog.init(key, {
      api_host: apiHost,
      capture_pageview: false,
      person_profiles: 'identified_only',
      opt_out_capturing_by_default: true,
    })

    if (localStorage.getItem('cookie_consent_aceito')) {
      posthog.opt_in_capturing()
    }
  }, [])

  return <PHProvider client={posthog}>{children}</PHProvider>
}
