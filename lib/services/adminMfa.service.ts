// lib/services/adminMfa.service.ts
// Acesso ao Supabase Auth para o segundo fator (aplicativo autenticador, TOTP) das contas de admin.

import { supabase } from '@/lib/supabase'
import {
  MSG_CODIGO_INCORRETO,
  MSG_DUAS_ETAPAS_INDISPONIVEL,
  MSG_FALHA_NA_VERIFICACAO,
  type NivelDeAcesso,
} from '@/lib/auth/adminMfa'

export async function nivelDeAcesso(): Promise<NivelDeAcesso> {
  const { data, error } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()
  if (error || !data) throw error ?? new Error('sem nivel de acesso')
  return { currentLevel: data.currentLevel, nextLevel: data.nextLevel }
}

/** Id do aplicativo já cadastrado e confirmado, ou null se a conta ainda não tem. */
export async function fatorConfirmado(): Promise<string | null> {
  const { data, error } = await supabase.auth.mfa.listFactors()
  if (error) throw error
  return data?.totp?.[0]?.id ?? null
}

/** Confere o código de 6 números. Devolve a mensagem de erro em texto simples, ou null quando deu certo. */
export async function confirmarCodigo(factorId: string, code: string): Promise<string | null> {
  const { error } = await supabase.auth.mfa.challengeAndVerify({ factorId, code })
  if (!error) return null
  return error.status === 400 || /invalid|expired/i.test(error.message) ? MSG_CODIGO_INCORRETO : MSG_FALHA_NA_VERIFICACAO
}

export interface CadastroDoFator { factorId: string; qrCode: string; segredo: string }

/** Começa o cadastro do aplicativo: devolve o QR code (imagem SVG) e a chave para digitar à mão. */
export async function iniciarCadastro(): Promise<CadastroDoFator> {
  const { data, error } = await supabase.auth.mfa.enroll({ factorType: 'totp', friendlyName: `Celular ${new Date().toISOString().slice(0, 10)}` })
  if (error || !data) {
    if (error && /not.*enabled|disabled/i.test(error.message)) throw new Error(MSG_DUAS_ETAPAS_INDISPONIVEL)
    throw error ?? new Error(MSG_FALHA_NA_VERIFICACAO)
  }
  return { factorId: data.id, qrCode: data.totp.qr_code, segredo: data.totp.secret }
}

/** Descarta um cadastro que foi iniciado e não confirmado (ou desativa o aplicativo, com a sessão já verificada). */
export async function removerFator(factorId: string): Promise<boolean> {
  const { error } = await supabase.auth.mfa.unenroll({ factorId })
  return !error
}
