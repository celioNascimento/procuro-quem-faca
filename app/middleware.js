// middleware.js
import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'

export async function middleware(request) {
  let response = NextResponse.next({
    request: { headers: request.headers },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
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

  // 2. Lógica de Redirecionamento

  // REGRA A: Proteção de Áreas Privadas (Dashboard e Cadastro)
  // Se o usuário tenta acessar área restrita sem estar logado
  if (!user && (isDashboard || isCadastro)) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // REGRA B: Evitar Login Duplicado
  // Se o usuário já está logado e tenta ir para a página de login
  if (user && isLogin) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // REGRA C: Rotas Públicas (Home, /prestadores, etc)
  // Não fazemos nada, apenas retornamos a resposta com os cookies atualizados
  return response
}

export const config = {
  // Mantemos o matcher para ignorar arquivos estáticos
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}