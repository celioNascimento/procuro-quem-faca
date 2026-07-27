//lib/auth/resolverDestinoPosLogin.ts 

/**
 * Resolve para onde o usuário deve ser redirecionado após autenticar,
 * com base no papel escolhido (profiles.role) e no estado do cadastro
 * de prestador, se aplicável.
 *
 * Fonte única de verdade para essa decisão — usada por:
 * - app/auth/callback/route.ts (login via Google)
 * - hooks/useLoginForm.ts (login/cadastro via e-mail e senha)
 *
 * Antes, a mesma lógica estava duplicada nesses pontos com critérios de
 * "prestador completo" e "role indefinida" diferentes entre si — o que
 * podia gerar decisões inconsistentes dependendo de por qual caminho o
 * usuário passasse primeiro.
 *
 * NÃO ROTEIA MAIS PARA '/auth/escolha' — essa tela foi removida. Todo
 * ponto de entrada que pode criar uma conta nova hoje já sabe qual role
 * atribuir e grava isso via garantirRoleInicial (lib/services/auth.service.ts)
 * antes de chegar aqui:
 * - GoogleButton na tela "Área do Profissional" → roleDesejado='prestador'
 * - handleLogin (useLoginForm), fallback de signUp → 'prestador'
 * - Botão "Área do cliente" da home → nem passa por aqui, usa ?next= direto
 *
 * `profile` chegando como null/sem role aqui deveria ser residual — um
 * usuário criado antes desse mecanismo existir, ou (cenário hoje
 * desligado, mas mantido documentado para religar no futuro) uma conta
 * com confirmação de e-mail pendente que nunca voltou a logar para que
 * garantirRoleInicial rodasse. Nesse caso residual, caímos em '/dashboard'
 * como fallback seguro — useAuth deriva cliente/prestador sozinho pela
 * existência de um registro em `prestadores`, então o dashboard genérico
 * se vira sem depender de profiles.role.
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
 * Divergir desse critério aqui reintroduziria o mesmo tipo de
 * inconsistência que motivou essa consolidação.
 */
export function isPrestadorCompleto(prestador: PrestadorResumo | null): boolean {
  return !!(prestador?.categoria_id && prestador?.nome && prestador?.status !== 'pendente')
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

  // Escolheu ser prestador (ou nasceu como prestador por padrão da tela
  // de origem) mas ainda não completou o cadastro
  if (profile?.role === 'prestador') {
    return prestador?.origem_tipo === 'curadoria_publica'
      ? `/cadastro?reivindicar=${prestador.id}`
      : '/cadastro'
  }

  // Role residual/ausente — ver nota no topo do arquivo
  return '/dashboard'
}