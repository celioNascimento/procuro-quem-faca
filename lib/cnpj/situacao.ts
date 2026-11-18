// lib/cnpj/situacao.ts
// Situação cadastral do CNPJ em português claro, para avisar o prestador.

const ROTULOS: Record<string, string> = {
  ATIVA: 'ativa',
  SUSPENSA: 'suspensa',
  INAPTA: 'inapta',
  BAIXADA: 'baixada',
  NULA: 'nula',
}

export function rotuloSituacao(situacao: string | null | undefined): string {
  const chave = (situacao ?? '').trim().toUpperCase()
  return ROTULOS[chave] ?? (chave ? chave.toLowerCase() : 'sem situação ativa')
}

export function mensagemCnpjNaoAtivo(situacao: string | null | undefined): string {
  return `A Receita Federal mostra este CNPJ como ${rotuloSituacao(situacao)}. Regularize a situação do CNPJ e tente novamente.`
}
