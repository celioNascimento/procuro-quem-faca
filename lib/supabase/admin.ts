// lib/supabase/admin.ts

import { createClient } from '@supabase/supabase-js'

// Client com service role — só usado server-side, nunca exposto ao browser.
// Bypassa as políticas de RLS do banco de dados.
export function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  
  // Tenta usar a chave padrão. Se a Vercel bloquear ou ignorar, 
  // puxa automaticamente a SUPABASE_SECRET_KEY que vi no seu painel.
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY

  if (!url || !key) {
    // Se ambas falharem, isso jogará um erro detalhado direto no banner vermelho da sua tela,
    // provando exatamente o que o servidor da Vercel está (ou não) enxergando no momento do click.
    throw new Error(
      `[Diagnóstico Vercel] URL existe: ${!!url} | RoleKey existe: ${!!process.env.SUPABASE_SERVICE_ROLE_KEY} | SecretKey existe: ${!!process.env.SUPABASE_SECRET_KEY}`
    )
  }

  return createClient(url, key, { auth: { persistSession: false } })
}
