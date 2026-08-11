// lib/supabase/admin.ts

import { createClient } from '@supabase/supabase-js'

// Client com service role — só usado server-side, nunca exposto ao browser.
// Bypassa as políticas de RLS do banco de dados.
export function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )
}
