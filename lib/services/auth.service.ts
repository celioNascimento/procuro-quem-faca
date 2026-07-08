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
/**
 * Garante que o usuário tenha uma role definida em `profiles`, aplicando
 * `roleDesejado` apenas se ainda não houver role gravada — nunca sobrescreve
 * uma role já escolhida. Usado nos dois pontos onde uma conta pode ser
 * criada implicitamente por um contexto que já sabe qual role faz sentido:
 * (1) cadastro automático por e-mail/senha na tela "Área do Profissional"
 * (hooks/useLoginForm.ts) e (2) primeiro login via Google vindo dessa mesma
 * tela (app/auth/callback/route.ts, acionado por hooks/useGoogleAuth.ts).
 *
 * IMPORTANTE: checamos `!profile?.role`, não `!profile`. Se o projeto tiver
 * um trigger no banco que cria a linha em `profiles` automaticamente ao
 * criar o usuário em auth.users (padrão comum, ex: handle_new_user), essa
 * linha já existe com role nula quando esta função roda — checar apenas
 * "existe profile?" faria essa função nunca agir, e o usuário cairia em
 * /auth/escolha em vez do /cadastro esperado.
 */
export async function garantirRoleInicial(
  supabase: SupabaseClient,
  userId: string,
  roleDesejado: string
): Promise<void> {
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, role')
    .eq('id', userId)
    .maybeSingle()

  if (!profile?.role) {
    await supabase.from('profiles').upsert({
      id: userId,
      role: roleDesejado,
      updated_at: new Date()
    })
  }
}

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