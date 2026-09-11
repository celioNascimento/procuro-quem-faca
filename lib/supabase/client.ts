//lib/supabase/client.ts

import { createBrowserClient } from '@supabase/ssr'
import { createClient as createPublicSupabaseClient } from '@supabase/supabase-js'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

// Consultas públicas não precisam de cookies, sessão ou locks do navegador.
// Um cliente stateless evita que proteções de privacidade do Brave interfiram
// nas buscas anônimas do catálogo.
export function createPublicClient() {
  return createPublicSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    }
  )
}

// Instância singleton para uso direto (compatibilidade com código existente
// que importa `{ supabase }` de '@/lib/supabase')
export const supabase = createClient()
