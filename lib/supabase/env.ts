const requiredPublicEnv = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
] as const

export function getSupabasePublicEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const missing = requiredPublicEnv.filter((name) => !process.env[name])

  if (!url || !anonKey) {
    throw new Error(
      `Configuração do Supabase ausente: ${missing.join(', ')}. ` +
        'Defina essas variáveis no ambiente de execução antes de iniciar o Next.js.'
    )
  }

  return { url, anonKey }
}

export function getSupabaseAdminEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY

  if (!url || !serviceRoleKey) {
    throw new Error(
      'Configuração administrativa do Supabase ausente: URL pública e chave de service role são obrigatórias.'
    )
  }

  return { url, serviceRoleKey }
}
