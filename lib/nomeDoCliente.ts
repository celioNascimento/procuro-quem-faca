// lib/nomeDoCliente.ts
//
// Como o cliente aparece publicamente nas avaliações do perfil: só o primeiro nome (sem sobrenome) e nunca
// "verificado", porque a plataforma não confirma a identidade de quem avalia. Quando o prestador não
// informou o nome, o cadastro do trabalho grava "Cliente"; isso também conta como "sem nome".

const SEM_NOME = new Set(['', 'cliente'])

/** Primeiro nome do cliente, ou null quando não há um nome de verdade. */
export function primeiroNomeDoCliente(nome?: string | null): string | null {
  const primeiro = (nome ?? '').trim().split(/\s+/)[0] ?? ''
  if (SEM_NOME.has(primeiro.toLowerCase())) return null
  return primeiro
}

export const CLIENTE_SEM_NOME = 'Cliente deste serviço'

/** Texto do nome nas avaliações: o primeiro nome ou "Cliente deste serviço". */
export function nomePublicoDoCliente(nome?: string | null): string {
  return primeiroNomeDoCliente(nome) ?? CLIENTE_SEM_NOME
}
