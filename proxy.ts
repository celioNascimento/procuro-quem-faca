import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { getSupabasePublicEnv } from './lib/supabase/env'

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request: { headers: request.headers } })
  const pathname = request.nextUrl.pathname
  const isDashboard = pathname.startsWith('/dashboard')
  const isCadastro = pathname.startsWith('/cadastro')
  const isAcompanhamento = pathname.startsWith('/acompanhamento')
  const isAvaliar = pathname.startsWith('/avaliar')
  const isLogin = pathname === '/login'
  const isAdmin = pathname.startsWith('/admin')
  const isAdminLogin = pathname === '/admin/login'

  const { url: supabaseUrl, anonKey } = getSupabasePublicEnv()
  const supabase = createServerClient(supabaseUrl, anonKey, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (cookiesToSet) => {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
        response = NextResponse.next({ request })
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options))
      },
    },
  })

  const { data: { user } } = await supabase.auth.getUser()

  if (!user && (isDashboard || isCadastro || isAcompanhamento || isAvaliar)) {
    if (isAcompanhamento || isAvaliar) {
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('next', pathname + request.nextUrl.search)
      return NextResponse.redirect(loginUrl)
    }
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (user && (isDashboard || isCadastro)) {
    const [profileRes, prestadorRes] = await Promise.all([
      supabase.from('profiles').select('role').eq('id', user.id).maybeSingle(),
      supabase.from('prestadores').select('status').eq('user_id', user.id).maybeSingle(),
    ])
    const intendedRole = profileRes.data?.role || 'cliente'
    const isPendente = !prestadorRes.data || prestadorRes.data.status === 'pendente'

    if (isDashboard) {
      if (intendedRole === 'prestador' && isPendente) return NextResponse.redirect(new URL('/cadastro', request.url))
      if (intendedRole === 'cliente') return NextResponse.redirect(new URL('/painel/perfil', request.url))
    }
    if (isCadastro && intendedRole === 'prestador' && !isPendente) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }

  if (user && isLogin) return NextResponse.redirect(new URL('/dashboard', request.url))

  if (isAdmin) {
    if (isAdminLogin && user) {
      const { data: adminProfile } = await supabase
        .from('perfis_admin')
        .select('role')
        .eq('user_id', user.id)
        .maybeSingle()
      if (adminProfile) return NextResponse.redirect(new URL('/admin', request.url))
      return response
    }
    if (!user) return NextResponse.redirect(new URL('/', request.url))

    const { data: adminProfile } = await supabase
      .from('perfis_admin')
      .select('role')
      .eq('user_id', user.id)
      .maybeSingle()
    if (!adminProfile) return NextResponse.redirect(new URL('/', request.url))
  }

  return response
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/cadastro/:path*',
    '/acompanhamento/:path*',
    '/avaliar/:path*',
    '/login',
    '/admin/:path*',
  ],
}
