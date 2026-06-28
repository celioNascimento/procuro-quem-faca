import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

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
      // Se quem pediu o login já sabe pra onde quer ir (ex: botão "Área do Cliente" na Home),
      // respeitamos esse destino direto, sem aplicar a lógica de papel (role) abaixo.
      if (next) {
        return NextResponse.redirect(`${origin}${next}`)
      }

      const user = session.user

      const [{ data: profile }, { data: prestador }] = await Promise.all([
        supabase.from('profiles').select('role').eq('id', user.id).maybeSingle(),
        supabase.from('prestadores').select('id, categoria_id, nome, origem_tipo').eq('user_id', user.id).maybeSingle()
      ])

      // --- LÓGICA DE REDIRECIONAMENTO CONSOLIDADA ---

      // 1. Prestador Completo OU Cliente -> Dashboard
      if (
        (profile?.role === 'prestador' && prestador?.categoria_id && prestador?.nome) ||
        (profile?.role === 'cliente')
      ) {
        return NextResponse.redirect(`${origin}/dashboard`)
      }

      // 2. Prestador Incompleto -> Cadastro
      if (profile?.role === 'prestador') {
        if (prestador?.origem_tipo === 'curadoria_publica') {
          return NextResponse.redirect(`${origin}/cadastro?reivindicar=${prestador.id}`)
        }
        return NextResponse.redirect(`${origin}/cadastro`)
      }

      // 3. Usuário novo ou sem role -> Escolha
      return NextResponse.redirect(`${origin}/auth/escolha`)
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_failed`)
}