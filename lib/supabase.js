import { createBrowserClient } from '@supabase/ssr'

// No Next.js com SSR, usamos o createBrowserClient para o frontend
export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)