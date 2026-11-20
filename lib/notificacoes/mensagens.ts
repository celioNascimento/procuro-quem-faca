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
  selos_cnpj_abertos: number
  selos_documentos_abertos: number
}

const CHAVES: (keyof Pendencias)[] = [
  'titular_abertas',
  'titular_atrasadas',
  'denuncias_abertas',
  'selos_cnpj_abertos',
  'selos_documentos_abertos',
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
  return p.titular_abertas + p.denuncias_abertas + totalSelos(p)
}

// CNPJ e Seguro/CND esperam decisão na mesma tela (Selos)
export function totalSelos(p: Pendencias): number {
  return p.selos_cnpj_abertos + p.selos_documentos_abertos
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
    texto: `Chegou uma nova denúncia de perfil.\n\nDetalhes em Denúncias, com login: ${NOTIFICACOES.urlDenuncias}`,
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
  if (p.selos_cnpj_abertos > 0) linhas.push(`Selos de CNPJ aguardando decisão: ${p.selos_cnpj_abertos}`)
  if (p.selos_documentos_abertos > 0) linhas.push(`Seguro e CND aguardando decisão: ${p.selos_documentos_abertos}`)

  const alerta = p.titular_atrasadas > 0 ? ' (há pedido com prazo vencido)' : ''
  return {
    assunto: `PQF: ${total} pendência${total > 1 ? 's' : ''} em ${dataTexto}${alerta}`,
    texto:
      `Resumo das pendências do PQF em ${dataTexto}:\n\n` +
      `${linhas.map(l => `- ${l}`).join('\n')}\n\n` +
      `Pedidos de titulares: ${NOTIFICACOES.urlFilaTitular}\n` +
      `Denúncias: ${NOTIFICACOES.urlDenuncias}\n` +
      `Selos: ${NOTIFICACOES.urlSelos}`,
  }
}
