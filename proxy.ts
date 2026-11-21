import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { getSupabasePublicEnv } from './lib/supabase/env'
import { gravarOrigemSeNecessario } from './lib/tracking/gravarOrigem'
import { deveSairDoCadastro } from './lib/auth/cadastroRota'
import { precisaDoCodigo } from './lib/auth/adminMfa'

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request: { headers: request.headers } })
  const pathname = request.nextUrl.pathname
  const isDashboard = pathname.startsWith('/dashboard')
  const isCadastro = pathname.startsWith('/cadastro')
  const isAcompanhamento = pathname.startsWith('/acompanhamento')
  const isAvaliar = pathname.startsWith('/avaliar')
  const isPainelCliente = pathname === '/painel' || pathname.startsWith('/painel/')
  const isLogin = pathname === '/login'
  const isAdmin = pathname.startsWith('/admin')
  const isAdminLogin = pathname === '/admin/login'
  const precisaAuth = isDashboard || isCadastro || isAcompanhamento || isAvaliar || isPainelCliente || isLogin || isAdmin

  // Páginas públicas (home, perfis, páginas de serviço etc.): só grava o
  // cookie de origem/campanha (Tarefa 4), sem gastar uma consulta ao
  // Supabase para autenticação — essas rotas não precisam disso.
  if (!precisaAuth) {
    return gravarOrigemSeNecessario(request, response)
  }

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

  // Em caso de erro ao consultar o nível de acesso, trata como "falta o código": na dúvida, não abre o painel.
  async function aguardaCodigo(): Promise<boolean> {
    const { data, error } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()
    return Boolean(error) || precisaDoCodigo(data)
  }

  if (!user && (isDashboard || isCadastro || isAcompanhamento || isAvaliar || isPainelCliente)) {
    // O link pessoal de um perfil (/cadastro?reivindicar=...) também volta depois do login,
    // senão quem não está logado perde o link e cria um perfil novo em vez de assumir o seu
    const voltaDepoisDoLogin = isAcompanhamento || isAvaliar || isPainelCliente || (isCadastro && request.nextUrl.searchParams.has('reivindicar'))
    if (voltaDepoisDoLogin) {
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
    // A existência de um cadastro em `prestadores` libera o dashboard
    // profissional, mesmo quando `profiles.role` ainda está como cliente.
    // Isso permite que a mesma conta use os dois perfis.
    const temCadastroPrestador = Boolean(prestadorRes.data)
    const intendedRole = profileRes.data?.role === 'prestador' || temCadastroPrestador
      ? 'prestador'
      : 'cliente'
    const isPendente = !prestadorRes.data || prestadorRes.data.status === 'pendente'

    if (isDashboard) {
      if (intendedRole === 'prestador' && isPendente) return NextResponse.redirect(new URL('/cadastro', request.url))
      if (intendedRole === 'cliente') return NextResponse.redirect(new URL('/painel/perfil', request.url))
    }
    if (isCadastro && deveSairDoCadastro({ intendedRole, isPendente, ehReivindicacao: request.nextUrl.searchParams.has('reivindicar') })) {
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
      if (adminProfile) {
        // Senha certa, mas o código do celular ainda não foi digitado: fica no login para digitar.
        if (await aguardaCodigo()) return response
        return NextResponse.redirect(new URL('/admin', request.url))
      }
      return response
    }
    // Usuários deslogados devem voltar ao login administrativo, não à home.
    // Isso mantém o painel acessível após o logout e evita uma rota morta para /admin.
    if (!user && !isAdminLogin) return NextResponse.redirect(new URL('/admin/login', request.url))
    if (!user) return response

    const { data: adminProfile } = await supabase
      .from('perfis_admin')
      .select('role')
      .eq('user_id', user.id)
      .maybeSingle()
    if (!adminProfile) return NextResponse.redirect(new URL('/', request.url))
    // Conta com verificação em duas etapas só entra no painel depois de provar o código.
    if (await aguardaCodigo()) return NextResponse.redirect(new URL('/admin/login', request.url))
  }

  return response
}

export const config = {
  // Antes, o proxy só rodava nas rotas de autenticação. A Tarefa 4 precisa
  // dele em TODAS as páginas (home, perfis, serviços...) para capturar o
  // utm_source no primeiro clique vindo de um anúncio. Por isso o matcher
  // agora cobre tudo, exceto arquivos estáticos, imagens e a própria API.
  matcher: [
    '/((?!api/|_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|map|txt|xml)$).*)',
  ],
}
