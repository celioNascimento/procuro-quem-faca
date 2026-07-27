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

  // REGRA B: Evitar Login Duplicado
  if (user && isLogin) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // REGRA C: Proteção da Área Administrativa
  // Bloqueia qualquer acesso a /admin que não venha de um usuário
  // presente em perfis_admin. Sem usuário → redireciona para home,
  // sem revelar que a rota existe.
  if (isAdmin) {
    // A própria tela de login do admin precisa ficar acessível sem sessão —
    // senão ninguém sem sessão ativa conseguiria nunca chegar até ela.
    if (isAdminLogin) {
      // Se já há sessão de admin válida, não faz sentido ficar na tela de
      // login — manda direto para o painel (mesmo espírito da Regra B).
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

    // Usuário validado como admin — segue com a resposta,
    // com os cookies de sessão já atualizados acima.
  }

  // REGRA D: Rotas Públicas (Home, /prestadores, etc)
  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}