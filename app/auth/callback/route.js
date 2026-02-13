import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  
  // MUDANÇA CRUCIAL: O destino padrão agora é a página de escolha de perfil
  // Nunca use '/recuperar-senha' como fallback de um login bem-sucedido.
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

      // Inteligência de Redirecionamento no Servidor
      // 1. Já é um prestador ativo?
      const { data: prestador } = await supabase
        .from('prestadores')
        .select('id, categoria_id, origem_tipo')
        .eq('user_id', user.id)
        .maybeSingle()

      if (prestador?.categoria_id && prestador.origem_tipo !== 'curadoria_publica') {
        return NextResponse.redirect(`${origin}/dashboard`)
      }

      // 2. É um perfil de curadoria (reivindicação)?
      if (prestador?.origem_tipo === 'curadoria_publica') {
        return NextResponse.redirect(`${origin}/cadastro?reivindicar=${prestador.id}`)
      }

      // 3. Se não caiu em nenhum dos acima, vai para a página de escolha ou o 'next'
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // Se o código falhar, volta para o login com erro
  return NextResponse.redirect(`${origin}/login?error=auth_failed`)
}