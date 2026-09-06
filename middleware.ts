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
  const isAcompanhamento = url.pathname.startsWith('/acompanhamento')
  const isAvaliar = url.pathname.startsWith('/avaliar')
  const isLogin = url.pathname === '/login'
  const isAdmin = url.pathname.startsWith('/admin')
  const isAdminLogin = url.pathname === '/admin/login'

  // 2. Lógica de Redirecionamento

  // REGRA A: Proteção de Áreas Privadas (Dashboard, Cadastro, Acompanhamento e Avaliar)
  // Acompanhamento e Avaliar passaram a exigir login para viabilizar o fluxo
  // de garantia (que precisa de cliente_user_id) e a transição suave entre
  // as duas telas (Avaliar → botão "Acompanhamento e Garantia" → Acompanhamento,
  // sem barreira de login no meio do caminho).
  // Trade-off consciente: quem recebe o link sem nunca ter criado conta
  // agora precisa logar antes de ver o progresso do serviço ou avaliar,
  // mesmo sem interesse em garantia.
  //
  // Usa "next" (não um parâmetro novo) porque é o mesmo nome já lido por
  // app/auth/callback/route.ts — next é aplicado ali com prioridade sobre
  // qualquer lógica de role, então volta certinho para a página original
  // após o OAuth. A tela /login (e-mail/senha) hoje NÃO lê next — ela é a
  // "Área do Profissional" e sempre resolve via resolverDestinoPosLogin.
  // Um cliente comum autenticando por e-mail/senha nesta tela cairá em
  // /dashboard ou /cadastro, não de volta em /acompanhamento. Isso é uma
  // limitação existente da tela de login, não introduzida por esta mudança.
  if (!user && (isDashboard || isCadastro || isAcompanhamento || isAvaliar)) {
    if (isAcompanhamento || isAvaliar) {
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('next', url.pathname + url.search)
      return NextResponse.redirect(loginUrl)
    }
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // REGRA A.1: Verificação Inteligente de Perfil e Status
  if (user && (isDashboard || isCadastro)) {
    // Busca a intenção de role (profiles) e o status real (prestadores) em paralelo
    const [profileRes, prestadorRes] = await Promise.all([
      supabase.from('profiles').select('role').eq('id', user.id).maybeSingle(),
      supabase.from('prestadores').select('status').eq('user_id', user.id).maybeSingle()
    ])

    const intendedRole = profileRes.data?.role || 'cliente'
    const isPendente = !prestadorRes.data || prestadorRes.data.status === 'pendente'

    if (isDashboard) {
      if (intendedRole === 'prestador' && isPendente) {
        // Prestador incompleto tentando acessar dashboard -> forçado a terminar o cadastro
        return NextResponse.redirect(new URL('/cadastro', request.url))
      }
      if (intendedRole === 'cliente') {
        // Cliente (que não tem dashboard) bateu no dashboard -> vai para a área de cliente
        return NextResponse.redirect(new URL('/painel/perfil', request.url))
      }
    }

    if (isCadastro) {
      if (intendedRole === 'prestador' && !isPendente) {
        // Prestador ATIVO não tem motivo para acessar o formulário de cadastro novo
        return NextResponse.redirect(new URL('/dashboard', request.url))
      }
      // Se for cliente acessando o /cadastro, permitimos a passagem (ele quer virar prestador)
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
