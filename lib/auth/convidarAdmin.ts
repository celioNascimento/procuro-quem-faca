// lib/auth/convidarAdmin.ts
// Adicionar alguém à equipe: se a pessoa já tem conta, entra direto; se não tem, recebe um convite por e-mail
// (link para criar a própria senha) e entra na equipe como editor. Quem executa é a rota de API; aqui só a regra,
// com o banco e o e-mail injetados para poder testar.

import { emailValido } from '@/lib/admin/equipe'

export interface DependenciasDoConvite {
  /** Função do banco `admin_equipe_adicionar`, chamada com a sessão de quem convida (só o dono passa). */
  adicionar: (email: string) => Promise<string>
  /** Envia o e-mail de convite (service role). Lança erro com `message` se o envio falhar. */
  enviarConvite: (email: string, redirectTo: string) => Promise<void>
}

export interface ResultadoDoConvite {
  codigo: string
  convidado: boolean
}

export class ErroDeConvite extends Error {
  constructor(message: string, readonly status: number) {
    super(message)
  }
}

export function traduzirErroDeEnvio(mensagem: string): ErroDeConvite {
  if (/rate limit|too many|seconds/i.test(mensagem)) {
    return new ErroDeConvite('O limite de e-mails por hora foi atingido. Tente novamente mais tarde.', 429)
  }
  return new ErroDeConvite('Não foi possível enviar o convite agora. Tente de novo em instantes.', 502)
}

export async function convidarAdmin(email: string, origem: string, dep: DependenciasDoConvite): Promise<ResultadoDoConvite> {
  const limpo = email.trim().toLowerCase()
  if (!emailValido(limpo)) return { codigo: 'email_invalido', convidado: false }

  const primeiro = await dep.adicionar(limpo)
  if (primeiro !== 'sem_conta') return { codigo: primeiro, convidado: false }

  // O link do e-mail abre a tela de criar senha que já existe (recuperação de senha).
  try {
    await dep.enviarConvite(limpo, `${origem}/recuperar-senha`)
  } catch (e) {
    throw traduzirErroDeEnvio(e instanceof Error ? e.message : '')
  }
  // O convite já criou a conta (ainda sem senha); agora a função do banco encontra o e-mail e registra no histórico.
  const segundo = await dep.adicionar(limpo)
  return { codigo: segundo, convidado: segundo === 'ok' }
}
