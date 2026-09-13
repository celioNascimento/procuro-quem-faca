//lib/supabase/client.ts

import { createBrowserClient } from '@supabase/ssr'
import { createClient as createPublicSupabaseClient } from '@supabase/supabase-js'
import { getSupabasePublicEnv } from './env'

export function createClient() {
  const { url, anonKey } = getSupabasePublicEnv()
  return createBrowserClient(url, anonKey)
}

// Consultas públicas não precisam de cookies, sessão ou locks do navegador.
// Um cliente stateless evita que proteções de privacidade do Brave interfiram
// nas buscas anônimas do catálogo.
export function createPublicClient() {
  const { url, anonKey } = getSupabasePublicEnv()
  return createPublicSupabaseClient(
    url,
    anonKey,
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
