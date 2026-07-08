import type { SupabaseClient } from '@supabase/supabase-js'
import type { ProfileRole, PrestadorResumo } from '@/lib/auth/resolverDestinoPosLogin'

/**
 * Busca o estado de onboarding do usuário (role do profile + resumo do
 * cadastro de prestador, se existir).
 *
 * Recebe o client Supabase como parâmetro em vez de importar um fixo —
 * é o que permite reuso tanto no browser (useLoginForm, /auth/escolha,
 * que usam o client singleton de lib/supabase) quanto no server
 * (app/auth/callback/route.ts, que usa um client criado por requisição
 * via createServerClient).
 *
 * Único ponto de leitura dessas duas tabelas para decisões de onboarding —
 * resolverDestinoPosLogin.ts é o único ponto de decisão a partir do
 * resultado. Nenhum chamador deve montar sua própria query equivalente.
 */
export async function getStatusOnboarding(
  supabase: SupabaseClient,
  userId: string
): Promise<{ profile: ProfileRole | null; prestador: PrestadorResumo | null }> {
  const [{ data: profile }, { data: prestador }] = await Promise.all([
    supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .maybeSingle(),
    supabase
      .from('prestadores')
      .select('id, categoria_id, nome, origem_tipo, status')
      .eq('user_id', userId)
      .maybeSingle()
  ])

  return {
    profile: profile as ProfileRole | null,
    prestador: prestador as PrestadorResumo | null
  }
}