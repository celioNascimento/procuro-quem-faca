// app/auth/callback/route.js
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')

  if (code) {
    const supabase = createRouteHandlerClient({ cookies })
    await supabase.auth.exchangeCodeForSession(code)
    const { data: { user } } = await supabase.auth.getUser()

    // 1. É um prestador cadastrado?
    const { data: prestador } = await supabase
      .from('prestadores')
      .select('id, categoria_id, origem_tipo')
      .eq('user_id', user.id)
      .maybeSingle()

    if (prestador?.categoria_id && prestador.origem_tipo !== 'curadoria_publica') {
      return NextResponse.redirect(`${requestUrl.origin}/dashboard`)
    }

    // 2. É um perfil de curadoria (reivindicação)?
    if (prestador?.origem_tipo === 'curadoria_publica') {
      return NextResponse.redirect(`${requestUrl.origin}/cadastro?reivindicar=${prestador.id}`)
    }

    // 3. É um usuário novo ou cliente sem role definida?
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle()

    // Se o perfil é novo (role padrão ou nula), abordamos no meio do caminho
    if (!profile || profile.role === 'novo') {
      return NextResponse.redirect(`${requestUrl.origin}/auth/escolha`)
    }
  }

  return NextResponse.redirect(`${requestUrl.origin}/`)
}