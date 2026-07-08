/**
 * Resolve para onde o usuário deve ser redirecionado após autenticar,
 * com base no papel escolhido (profiles.role) e no estado do cadastro
 * de prestador, se aplicável.
 *
 * Fonte única de verdade para essa decisão — usada pelo callback de OAuth
 * (app/auth/callback/route.ts), pela tela de escolha de papel
 * (app/auth/escolha/page.tsx) e pelo login por senha (hooks/useLoginForm.ts).
 *
 * Antes da consolidação, a mesma lógica estava duplicada em até três lugares,
 * com critérios de "prestador completo" divergentes entre si (um checava só
 * categoria_id, outro categoria_id + nome, e o useLoginForm ainda considerava
 * status === 'pendente' e um `.or(whatsapp.ilike...)` que os demais não tinham).
 * Isso podia gerar decisões inconsistentes dependendo de qual dos pontos de
 * entrada o usuário passasse primeiro.
 *
 * DECISÃO DE COMPORTAMENTO (2026-07-08): o critério de "prestador completo"
 * usado aqui é: categoria_id + nome preenchidos E status !== 'pendente'.
 * O campo `status` foi mantido (em vez de descartado) porque o useLoginForm
 * original o usava para mandar prestadores pendentes de volta pro /cadastro
 * mesmo com categoria_id/nome já preenchidos. Se essa regra de negócio não
 * for mais desejada, remova a checagem de `status` de isPrestadorCompleto.
 *
 * O `.or(user_id.eq...,whatsapp.ilike...)` que existia apenas no useLoginForm
 * foi removido por ser resíduo confirmado (não replicado aqui nem em
 * getStatusOnboarding) — toda busca de prestador agora é só por user_id.
 */

export interface ProfileRole {
  role: string | null
}

export interface PrestadorResumo {
  id: number
  categoria_id: string | null
  nome: string | null
  origem_tipo: string | null
  status: string | null
}

export function isPrestadorCompleto(prestador: PrestadorResumo | null): boolean {
  return !!(
    prestador?.categoria_id &&
    prestador?.nome &&
    prestador?.status !== 'pendente'
  )
}

export function resolverDestinoPosLogin(
  profile: ProfileRole | null,
  prestador: PrestadorResumo | null
): string {
  const prestadorCompleto = isPrestadorCompleto(prestador)

  // Prestador com cadastro completo, ou cliente já definido → dashboard
  if ((profile?.role === 'prestador' && prestadorCompleto) || profile?.role === 'cliente') {
    return '/dashboard'
  }

  // Escolheu ser prestador mas ainda não completou o cadastro (ou está pendente)
  if (profile?.role === 'prestador') {
    return prestador?.origem_tipo === 'curadoria_publica'
      ? `/cadastro?reivindicar=${prestador.id}`
      : '/cadastro'
  }

  // Sem role definido ainda → tela de escolha
  return '/auth/escolha'
}