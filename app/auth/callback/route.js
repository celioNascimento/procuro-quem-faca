import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

/**
 * Rota GET: /auth/callback
 * Objetivo: Trocar o código temporário do Supabase por uma sessão permanente.
 */
export async function GET(request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/recuperar-senha'
  const isDev = process.env.NODE_ENV === 'development'

  // 1. Preparamos a resposta de redirecionamento para o destino de sucesso
  const response = NextResponse.redirect(`${origin}${next}`)

  if (code) {
    const cookieStore = await cookies()
    
    // 2. Inicializamos o cliente do Supabase configurado para SSR
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          getAll: () => cookieStore.getAll(),
          setAll: (cookiesToSet) => {
            try {
              cookiesToSet.forEach(({ name, value, options }) => {
                const opt = { 
                  ...options, 
                  secure: !isDev, 
                  path: '/' 
                }
                // Define no servidor (cookies do Next.js)
                cookieStore.set(name, value, opt)
                // Define na resposta que vai para o navegador
                response.cookies.set(name, value, opt)
              })
            } catch (error) {
              // Se falhar aqui, o Middleware do Next.js geralmente resolve a escrita
              console.warn('Aviso ao definir cookies:', error.message)
            }
          },
        },
      }
    )

    // 3. Troca o código pela sessão (essencial para segurança PKCE)
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error) {
      console.log('✅ Sessão validada com sucesso!')
      return response
    }

    console.error('❌ ERRO NO EXCHANGE:', error.message)
  }

  // 4. Caso o código falhe ou não exista, enviamos para uma página de erro
  // Importante: use uma URL absoluta para evitar problemas de roteamento
  return NextResponse.redirect(`${origin}/auth/link-expirado`)
}