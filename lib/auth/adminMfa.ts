// lib/auth/adminMfa.ts
// Regras simples da verificação em duas etapas do painel (código de 6 dígitos do aplicativo autenticador).

export const MSG_CODIGO_INCORRETO = 'Código incorreto ou vencido. Confira o código atual no aplicativo e tente de novo.'
export const MSG_CODIGO_FORMATO = 'Digite os 6 números que aparecem no aplicativo.'
export const MSG_FALHA_NA_VERIFICACAO = 'Não foi possível verificar agora. Tente de novo em instantes.'
export const MSG_DUAS_ETAPAS_INDISPONIVEL = 'A verificação em duas etapas não está liberada para este projeto. Avise o suporte técnico.'

export interface NivelDeAcesso {
  currentLevel: string | null
  nextLevel: string | null
}

/** Depois da senha, o painel só abre se a pessoa já provou o segundo fator (quando ele existe). */
export function precisaDoCodigo(n: NivelDeAcesso | null | undefined): boolean {
  return n?.nextLevel === 'aal2' && n.currentLevel !== 'aal2'
}

/**
 * Admin que ainda não cadastrou o aplicativo autenticador: o painel só abre a tela de cadastro.
 * Só vale com resposta confirmada do Supabase (sem resposta, quem decide é `precisaDoCodigo`/o erro).
 */
export function precisaCadastrarDuasEtapas(n: NivelDeAcesso | null | undefined): boolean {
  return n?.nextLevel === 'aal1'
}

/** Aceita "123 456" ou "123456"; devolve só os 6 números, ou null se não for isso. */
export function normalizarCodigo(valor: string): string | null {
  const limpo = valor.replace(/\s+/g, '')
  return /^\d{6}$/.test(limpo) ? limpo : null
}
