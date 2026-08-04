//lib/auth/resolverDestinoPosLogin.ts

/**
 * Resolve para onde o usuário deve ser redirecionado após autenticar.
 * 
 * Fonte única de verdade para essa decisão — usada por:
 * - app/auth/callback/route.ts (login via Google, sem ?next=)
 * - hooks/useLoginForm.ts (login/cadastro via e-mail e senha)
 *
 * Como os clientes comuns utilizam o parâmetro "?next=/painel/perfil"
 * que ignora este arquivo, assumimos que QUALQUER usuário caindo aqui 
 * está no fluxo da "Área do Profissional".
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

/**
 * "Completo" significa: tem os dados mínimos (categoria_id + nome) 
 * E não está com status='pendente'.
 */
export function isPrestadorCompleto(prestador: PrestadorResumo | null): boolean {
  return !!(prestador?.categoria_id && prestador?.nome && prestador?.status !== 'pendente')
}

export function resolverDestinoPosLogin(
  profile: ProfileRole | null,
  prestador: PrestadorResumo | null
): string {
  const prestadorCompleto = isPrestadorCompleto(prestador)

  // 1. Se o cadastro de prestador já está 100% completo, painel de controle.
  if (prestadorCompleto) {
    return '/dashboard'
  }

  // 2. Se não está completo (conta nova, interrompido, ou cliente fazendo upgrade),
  // enviamos obrigatoriamente para a página de cadastro.
  return prestador?.origem_tipo === 'curadoria_publica'
    ? `/cadastro?reivindicar=${prestador.id}`
    : '/cadastro'
}