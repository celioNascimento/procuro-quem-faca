'use client'

import posthog from 'posthog-js'
import { PostHogProvider as PHProvider } from 'posthog-js/react'
import { useEffect } from 'react'

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
      api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST!,
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