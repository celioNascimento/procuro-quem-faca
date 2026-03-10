import { createBrowserClient } from '@supabase/ssr'

export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  {
    cookies: {
      getAll() {
        if (typeof document === 'undefined') return []
        return document.cookie.split(';').map((c) => {
          const [key, ...v] = c.split('=')
          return { name: key.trim(), value: v.join('=') }
        })
      },
      setAll(cookiesToSet) {
        if (typeof document === 'undefined') return
        cookiesToSet.forEach(({ name, value, options }) => {
          let updatedCookie = `${name}=${encodeURIComponent(value)}`
          
          // Adiciona opções manualmente para garantir compatibilidade
          if (options.path) updatedCookie += `; path=${options.path}`
          if (options.maxAge) updatedCookie += `; max-age=${options.maxAge}`
          // Define SameSite como Lax para evitar bloqueios de navegador
          updatedCookie += '; samesite=lax' 
          
          // SÓ adiciona 'secure' se estivermos em produção (HTTPS)
          if (process.env.NODE_ENV === 'production') {
            updatedCookie += '; secure'
          }

          document.cookie = updatedCookie
        })
      },
    },
  }
)
