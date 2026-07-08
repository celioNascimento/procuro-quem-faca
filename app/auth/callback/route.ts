// app/auth/callback/route.ts

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getStatusOnboarding } from '@/lib/services/auth.service'
import { resolverDestinoPosLogin } from '@/lib/auth/resolverDestinoPosLogin'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next')
  const isDev = process.env.NODE_ENV === 'development'

  if (code) {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll: () => cookieStore.getAll(),
          setAll: (cookiesToSet) => {
            try {
              cookiesToSet.forEach(({ name, value, options }) => {
                cookieStore.set(name, value, { ...options, secure: !isDev, path: '/' })
              })
            } catch (error: any) {
              console.warn('Aviso cookies:', error.message)
            }
          },
        },
      }
    )

    const { data: { session }, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && session) {
      // Se quem pediu o login já sabe pra onde quer ir (ex: botão "Área do
      // Cliente" na Home), respeitamos esse destino direto, sem aplicar a
      // lógica de papel (role) abaixo.
      if (next) {
        return NextResponse.redirect(`${origin}${next}`)
      }

      const { profile, prestador } = await getStatusOnboarding(supabase, session.user.id)
      const destino = resolverDestinoPosLogin(profile, prestador)

      return NextResponse.redirect(`${origin}${destino}`)
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_failed`)
}