//app/middleware.ts

import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: { headers: request.headers },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options))
        },
      },
    }
  )

  // Recupera o usuário de forma segura
  const { data: { user } } = await supabase.auth.getUser()
  const url = new URL(request.url)

  // 1. Definição das Rotas
  const isDashboard = url.pathname.startsWith('/dashboard')
  const isCadastro = url.pathname.startsWith('/cadastro')
  const isLogin = url.pathname === '/login'
  const isAdmin = url.pathname.startsWith('/admin')
  const isAdminLogin = url.pathname === '/admin/login'

  // 2. Lógica de Redirecionamento

  // REGRA A: Proteção de Áreas Privadas (Dashboard e Cadastro)
  if (!user && (isDashboard || isCadastro)) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // REGRA A.1: Verificação de Prestador Incompleto / Pendente
  if (user && (isDashboard || isCadastro)) {
    const { data: prestador } = await supabase
      .from('prestadores')
      .select('status')
      .eq('user_id', user.id)
      .maybeSingle()

    const isPendente = !prestador || prestador.status === 'pendente'

    // Se tentar acessar o Dashboard estando pendente/incompleto -> redireciona para cadastro
    if (isDashboard && isPendente) {
      return NextResponse.redirect(new URL('/cadastro', request.url))
    }

    // Se tentar acessar o Cadastro estando com cadastro ativo/completo -> redireciona para dashboard
    if (isCadastro && !isPendente) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }

  // REGRA B: Evitar Login Duplicado
  if (user && isLogin) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // REGRA C: Proteção da Área Administrativa
  if (isAdmin) {
    if (isAdminLogin) {
      if (user) {
        const { data: adminProfile } = await supabase
          .from('perfis_admin')
          .select('role')
          .eq('user_id', user.id)
          .maybeSingle()
        if (adminProfile) {
          return NextResponse.redirect(new URL('/admin', request.url))
        }
      }
      return response
    }

    if (!user) {
      return NextResponse.redirect(new URL('/', request.url))
    }

    const { data: adminProfile } = await supabase
      .from('perfis_admin')
      .select('role')
      .eq('user_id', user.id)
      .maybeSingle()

    if (!adminProfile) {
      return NextResponse.redirect(new URL('/', request.url))
    }
  }

  // REGRA D: Rotas Públicas
  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}