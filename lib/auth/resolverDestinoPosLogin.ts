//lib/auth/resolverDestinoPosLogin.ts

/**
 * Resolve para onde o usuário deve ser redirecionado após autenticar,
 * com base no papel escolhido (profiles.role) e no estado do cadastro
 * de prestador, se aplicável.
 *
 * Fonte única de verdade para essa decisão — usada por:
 * - app/auth/callback/route.ts (login via Google)
 * - hooks/useLoginForm.ts (login/cadastro via e-mail e senha)
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
 * "Completo" aqui significa: tem os dados mínimos da vitrine preenchidos
 * (categoria_id + nome) E não está com status='pendente'. Um prestador
 * pendente com dados preenchidos ainda é tratado como incompleto de
 * propósito — alinhado com o mesmo critério que useAuth/HeaderBotoes já
 * usa para decidir entre '/dashboard' e '/cadastro' no header do site.
 */
export function isPrestadorCompleto(prestador: PrestadorResumo | null): boolean {
  return !!(prestador?.categoria_id && prestador?.nome && prestador?.status !== 'pendente')
}

export function resolverDestinoPosLogin(
  profile: ProfileRole | null,
  prestador: PrestadorResumo | null
): string {
  // Determina o papel real usando a mesma lógica consolidada do useAuth e Middleware:
  // Se ele declarou intenção de ser prestador, ou já tem registro, é prestador.
  const roleReal = (profile?.role === 'prestador' || prestador) ? 'prestador' : 'cliente'

  if (roleReal === 'prestador') {
    const prestadorCompleto = isPrestadorCompleto(prestador)
    
    // Se escolheu ser prestador mas o cadastro não atende aos requisitos de completude
    if (!prestadorCompleto) {
      return prestador?.origem_tipo === 'curadoria_publica'
        ? `/cadastro?reivindicar=${prestador.id}`
        : '/cadastro'
    }
    
    // Prestador ativo e completo
    return '/dashboard'
  }

  // Clientes ou papéis residuais vão direto para a área do cliente (sem pulo duplo)
  return '/painel/perfil'
}