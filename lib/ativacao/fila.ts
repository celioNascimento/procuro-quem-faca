// lib/ativacao/fila.ts
//
// Regras da fila de convites do dia (tela Convites). Vêm do plano de 30 dias: convidar um a um,
// com link pessoal, no ritmo de 5 por dia, começando por Londrina. Nada aqui fala com o banco.

import { limparNumero } from '@/lib/utils/whatsapp'

export const META_DIARIA = 5
export const DIAS_PARA_LEMBRAR = 3
export const CIDADE_PRIORITARIA = 'Londrina'
const FUSO = 'America/Sao_Paulo'

export interface PerfilDaFila {
  id: number
  nome?: string | null
  slug?: string | null
  whatsapp?: string | null
  user_id?: string | null
  cidade?: string | null
  ativacao_status: string
  ativacao_enviado_em: string | null
  ativacao_respondeu_em: string | null
}

// Data no calendário de Brasília (AAAA-MM-DD), para "hoje" não virar amanhã às 21h
export function diaLocal(data: Date | string): string {
  return new Date(data).toLocaleDateString('sv-SE', { timeZone: FUSO })
}

export function enviadosHoje(perfis: PerfilDaFila[], agora: Date = new Date()): number {
  const hoje = diaLocal(agora)
  return perfis.filter((p) => p.ativacao_enviado_em && diaLocal(p.ativacao_enviado_em) === hoje).length
}

// Só quem ainda pode receber o convite: sem conta, sem contato anterior, com endereço e WhatsApp
export function podeReceberConvite(p: PerfilDaFila): boolean {
  return (
    p.ativacao_status === 'nao_enviado' &&
    !p.user_id &&
    Boolean(p.slug) &&
    limparNumero(p.whatsapp).length >= 10
  )
}

// Quantos convites ainda cabem hoje (nunca negativo)
export function restamHoje(perfis: PerfilDaFila[], agora: Date = new Date()): number {
  return Math.max(0, META_DIARIA - enviadosHoje(perfis, agora))
}

// Próximos a convidar: primeiro a cidade prioritária, depois ordem alfabética (estável).
// `limite` é quantos ainda cabem hoje (veja `restamHoje`, que conta sobre todos os perfis, não só o recorte).
export function proximosConvites<P extends PerfilDaFila>(perfis: P[], limite: number): P[] {
  const prioridade = (p: PerfilDaFila) => (p.cidade === CIDADE_PRIORITARIA ? 0 : 1)
  return perfis
    .filter(podeReceberConvite)
    .sort((a, b) => prioridade(a) - prioridade(b) || (a.nome ?? '').localeCompare(b.nome ?? '', 'pt-BR') || a.id - b.id)
    .slice(0, Math.max(0, limite))
}

export interface SemResposta<P extends PerfilDaFila = PerfilDaFila> {
  perfil: P
  dias: number
}

// Contatados há DIAS_PARA_LEMBRAR dias ou mais que ainda não responderam. Os mais antigos primeiro.
export function semResposta<P extends PerfilDaFila>(perfis: P[], agora: Date = new Date()): SemResposta<P>[] {
  const umDia = 24 * 60 * 60 * 1000
  return perfis
    .filter((p) => p.ativacao_status === 'enviado' && p.ativacao_enviado_em && !p.ativacao_respondeu_em && !p.user_id)
    .map((perfil) => ({ perfil, dias: Math.floor((agora.getTime() - new Date(perfil.ativacao_enviado_em as string).getTime()) / umDia) }))
    .filter((item) => item.dias >= DIAS_PARA_LEMBRAR)
    .sort((a, b) => b.dias - a.dias)
}
