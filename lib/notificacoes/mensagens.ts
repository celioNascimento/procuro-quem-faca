// lib/notificacoes/mensagens.ts
//
// Texto dos e-mails de aviso ao administrador. Sem dado pessoal: só tipo, protocolo e contagens.

import { NOTIFICACOES } from '@/config/notificacoes'
import { ROTULO_TIPO_PEDIDO } from '@/lib/titular/pedido'

export interface EmailNotificacao {
  assunto: string
  texto: string
}

export interface Pendencias {
  titular_abertas: number
  titular_atrasadas: number
  denuncias_abertas: number
  garantias_abertas: number
  contestacoes_abertas: number
}

const CHAVES: (keyof Pendencias)[] = [
  'titular_abertas',
  'titular_atrasadas',
  'denuncias_abertas',
  'garantias_abertas',
  'contestacoes_abertas',
]

// Aceita o JSON do banco e garante números inteiros não negativos
export function normalizarPendencias(bruto: unknown): Pendencias {
  const origem = (typeof bruto === 'object' && bruto !== null ? bruto : {}) as Record<string, unknown>
  const resultado = {} as Pendencias
  for (const chave of CHAVES) {
    const valor = Number(origem[chave])
    resultado[chave] = Number.isFinite(valor) && valor > 0 ? Math.floor(valor) : 0
  }
  return resultado
}

// "titular_atrasadas" já está dentro de "titular_abertas": não entra de novo na soma
export function totalPendencias(p: Pendencias): number {
  return p.titular_abertas + p.denuncias_abertas + p.garantias_abertas + p.contestacoes_abertas
}

export function totalModeracao(p: Pendencias): number {
  return p.denuncias_abertas + p.garantias_abertas + p.contestacoes_abertas
}

export function emailNovoPedidoTitular(params: {
  tipo: string
  protocolo: string
  prazoTexto: string
}): EmailNotificacao {
  const rotulo = ROTULO_TIPO_PEDIDO[params.tipo] ?? params.tipo
  return {
    assunto: `PQF: novo pedido do titular (${rotulo})`,
    texto:
      `Chegou um novo pedido de titular de dados.\n\n` +
      `Tipo: ${rotulo}\n` +
      `Protocolo: ${params.protocolo}\n` +
      `Prazo para responder: ${params.prazoTexto}\n\n` +
      `Os detalhes estão no painel, com login: ${NOTIFICACOES.urlFilaTitular}`,
  }
}

export function emailNovaDenuncia(): EmailNotificacao {
  return {
    assunto: 'PQF: nova denúncia de perfil',
    texto: `Chegou uma nova denúncia de perfil.\n\nDetalhes na moderação, com login: ${NOTIFICACOES.urlModeracao}`,
  }
}

// Devolve null quando não há nada a tratar: o resumo diário não envia e-mail vazio
export function emailResumoPendencias(p: Pendencias, dataTexto: string): EmailNotificacao | null {
  const total = totalPendencias(p)
  if (total === 0) return null

  const linhas: string[] = []
  if (p.titular_abertas > 0) {
    const atraso = p.titular_atrasadas > 0 ? ` (${p.titular_atrasadas} com o prazo vencido)` : ''
    linhas.push(`Pedidos de titulares de dados: ${p.titular_abertas}${atraso}`)
  }
  if (p.denuncias_abertas > 0) linhas.push(`Denúncias abertas: ${p.denuncias_abertas}`)
  if (p.garantias_abertas > 0) linhas.push(`Garantias a tratar: ${p.garantias_abertas}`)
  if (p.contestacoes_abertas > 0) linhas.push(`Contestações abertas: ${p.contestacoes_abertas}`)

  const alerta = p.titular_atrasadas > 0 ? ' (há pedido com prazo vencido)' : ''
  return {
    assunto: `PQF: ${total} pendência${total > 1 ? 's' : ''} em ${dataTexto}${alerta}`,
    texto:
      `Resumo das pendências do PQF em ${dataTexto}:\n\n` +
      `${linhas.map(l => `- ${l}`).join('\n')}\n\n` +
      `Pedidos de titulares: ${NOTIFICACOES.urlFilaTitular}\n` +
      `Moderação: ${NOTIFICACOES.urlModeracao}`,
  }
}
