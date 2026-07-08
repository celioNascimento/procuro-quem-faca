import type { SupabaseClient } from '@supabase/supabase-js'
import type { ProfileRole, PrestadorResumo } from '@/lib/auth/resolverDestinoPosLogin'

/**
 * Garante que o usuário tenha uma role definida em `profiles`, aplicando
 * `roleDesejado` apenas se ainda não houver role gravada — nunca sobrescreve
 * uma role já escolhida. Usado nos dois pontos onde uma conta pode ser
 * criada implicitamente por um contexto que já sabe qual role faz sentido:
 * (1) cadastro automático por e-mail/senha na tela "Área do Profissional"
 * (hooks/useLoginForm.ts) e (2) primeiro login via Google vindo dessa mesma
 * tela (app/auth/callback/route.ts, acionado por hooks/useGoogleAuth.ts).
 *
 * IMPORTANTE — duas decisões que evitam a mesma classe de bug:
 *
 * 1. Checamos `!profile?.role`, não `!profile`. Se o projeto tiver um
 *    trigger no banco que cria a linha em `profiles` automaticamente ao
 *    criar o usuário em auth.users (padrão comum, ex: handle_new_user),
 *    essa linha já existe com role nula quando esta função roda — checar
 *    apenas "existe profile?" faria essa função nunca agir.
 *
 * 2. O upsert já encadeia `.select('role')` na MESMA requisição, em vez de
 *    escrever e depois fazer uma leitura separada (ex: chamar
 *    getStatusOnboarding logo em seguida) torcendo pra já refletir a
 *    escrita. Essa segunda leitura em outra request não tem garantia de
 *    ver o resultado da escrita anterior a tempo — foi exatamente essa
 *    dependência que fazia o usuário cair em /auth/escolha mesmo depois
 *    do upsert ter sido disparado. Retornamos o valor already-known em
 *    memória (o `roleDesejado` que acabamos de gravar) como fallback caso
 *    a leitura de confirmação do upsert falhe por qualquer motivo.
 */
export async function garantirRoleInicial(
  supabase: SupabaseClient,
  userId: string,
  roleDesejado: string
): Promise<ProfileRole> {
  const { data: profileExistente } = await supabase
    .from('profiles')
    .select('id, role')
    .eq('id', userId)
    .maybeSingle()

  if (profileExistente?.role) {
    return { role: profileExistente.role }
  }

  const { data: upserted, error } = await supabase
    .from('profiles')
    .upsert({ id: userId, role: roleDesejado, updated_at: new Date() })
    .select('role')
    .maybeSingle()

  if (error) {
    console.error('[garantirRoleInicial] falha ao gravar role:', error.message)
  }

  return { role: upserted?.role ?? roleDesejado }
}

/**
 * Busca apenas o resumo de prestador do usuário. Extraído à parte para ser
 * reutilizável tanto por getStatusOnboarding (fluxo normal de login) quanto
 * por quem acabou de chamar garantirRoleInicial e só precisa complementar
 * com o prestador, sem refazer a leitura de profile que já tem em mãos.
 */
export async function getPrestadorResumo(
  supabase: SupabaseClient,
  userId: string
): Promise<PrestadorResumo | null> {
  const { data } = await supabase
    .from('prestadores')
    .select('id, categoria_id, nome, origem_tipo, status')
    .eq('user_id', userId)
    .maybeSingle()

  return data as PrestadorResumo | null
}

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
 *
 * Use esta função para ler o estado de um usuário já existente. Para um
 * usuário que acabou de ser criado nesta mesma requisição, prefira
 * garantirRoleInicial (que devolve a role sem depender de round-trip
 * subsequente) + getPrestadorResumo.
 */
export async function getStatusOnboarding(
  supabase: SupabaseClient,
  userId: string
): Promise<{ profile: ProfileRole | null; prestador: PrestadorResumo | null }> {
  const [{ data: profile }, prestador] = await Promise.all([
    supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .maybeSingle(),
    getPrestadorResumo(supabase, userId)
  ])

  return {
    profile: profile as ProfileRole | null,
    prestador
  }
}