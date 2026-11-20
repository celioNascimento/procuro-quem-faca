// lib/auth/adminLogin.ts
//
// Textos e regras simples do login do painel administrativo. Linguagem direta e sem revelar
// se um e-mail tem conta: o erro de credencial é o mesmo para e-mail errado e para senha errada.

export const MSG_CREDENCIAIS_INVALIDAS = 'E-mail ou senha incorretos. Confira e tente de novo.'
export const MSG_SEM_ACESSO_AO_PAINEL = 'Esta conta não tem acesso ao painel.'
export const MSG_FALHA_AO_ENTRAR = 'Não foi possível entrar agora. Tente de novo em instantes.'
export const MSG_EMAIL_PARA_REDEFINIR = 'Digite o seu e-mail acima para receber o link de nova senha.'
export const MSG_LINK_DE_REDEFINICAO_ENVIADO = 'Se este e-mail estiver cadastrado, você receberá um link para criar uma nova senha.'
export const MSG_FALHA_AO_ENVIAR_LINK = 'Não foi possível enviar o link agora. Tente de novo em instantes.'

/** Confere só o formato (algo@dominio.ext); quem decide se o e-mail existe é o Supabase. */
export function emailParece(valor: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(valor.trim())
}
