import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/auth/escolha'
  const isDev = process.env.NODE_ENV === 'development'

  if (code) {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          getAll: () => cookieStore.getAll(),
          setAll: (cookiesToSet) => {
            try {
              cookiesToSet.forEach(({ name, value, options }) => {
                cookieStore.set(name, value, { ...options, secure: !isDev, path: '/' })
              })
            } catch (error) {
              console.warn('Aviso cookies:', error.message)
            }
          },
        },
      }
    )

    const { data: { session }, error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error && session) {
      const user = session.user;

      // 1. Busca o Perfil (Role) e o Registro de Prestador
      const [{ data: profile }, { data: prestador }] = await Promise.all([
        supabase.from('profiles').select('role').eq('id', user.id).maybeSingle(),
        supabase.from('prestadores').select('id, categoria_id, nome, origem_tipo').eq('user_id', user.id).maybeSingle()
      ])

      // 2. LOGICA DE REDIRECIONAMENTO CRÍTICA
      
      // Caso A: Já é prestador e terminou o cadastro (tem nome e categoria)
      if (profile?.role === 'prestador' && prestador?.categoria_id && prestador?.nome) {
        return NextResponse.redirect(`${origin}/dashboard`)
      }

      // Caso B: Já escolheu ser prestador, mas o cadastro está incompleto
      if (profile?.role === 'prestador') {
        return NextResponse.redirect(`${origin}/cadastro`)
      }

      // Caso C: É um perfil de curadoria sendo reivindicado
      if (prestador?.origem_tipo === 'curadoria_publica') {
        return NextResponse.redirect(`${origin}/cadastro?reivindicar=${prestador.id}`)
      }

      // Caso D: Já é cliente
      if (profile?.role === 'cliente') {
        return NextResponse.redirect(`${origin}/`)
      }

      // Caso E: Usuário novo ou sem role definida
      return NextResponse.redirect(`${origin}/auth/escolha`)
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_failed`)
}