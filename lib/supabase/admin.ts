// lib/supabase/admin.ts

import { createClient } from '@supabase/supabase-js'

// Client com service role — só usado server-side, nunca exposto ao browser.
// Bypassa as políticas de RLS do banco de dados.
export function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY

  if (!url || !key) {
    // Mensagem genérica: não revela quais variáveis existem.
    throw new Error('Configuração do Supabase administrativo ausente no servidor.')
  }

  return createClient(url, key, { auth: { persistSession: false } })
}
