//lib/supabase/client.ts

import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

// Instância singleton para uso direto (compatibilidade com código existente
// que importa `{ supabase }` de '@/lib/supabase')
export const supabase = createClient()