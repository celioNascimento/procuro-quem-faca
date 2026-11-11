// lib/auth/cadastroRota.ts
//
// Regra do proxy para quem abre /cadastro já tendo perfil profissional ativo.

interface EntradaRegra {
  intendedRole: 'prestador' | 'cliente'
  isPendente: boolean
  // /cadastro?reivindicar=ID: a pessoa veio de um link para assumir outro perfil
  ehReivindicacao: boolean
}

// Quem já tem perfil ativo vai para o painel. A exceção é o link de reivindicação: ali a página
// precisa abrir para explicar por que esta conta não pode assumir um segundo perfil. Mandar a pessoa
// ao painel em silêncio (como era antes) parecia um defeito do link.
export function deveSairDoCadastro({ intendedRole, isPendente, ehReivindicacao }: EntradaRegra): boolean {
  return intendedRole === 'prestador' && !isPendente && !ehReivindicacao
}
