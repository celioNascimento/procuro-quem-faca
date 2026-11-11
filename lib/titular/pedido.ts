// lib/titular/pedido.ts
//
// Tipos e validação do pedido do titular (LGPD, art. 18). Usado no formulário e na rota do servidor.

export const TIPOS_PEDIDO = ['exclusao', 'correcao', 'acesso', 'oposicao', 'outro'] as const
export type TipoPedido = (typeof TIPOS_PEDIDO)[number]

// Inclui tipos que o banco aceita, mas que o formulário só oferece como "outro pedido"
export const ROTULO_TIPO_PEDIDO: Record<string, string> = {
  exclusao: 'Excluir meus dados',
  correcao: 'Corrigir ou assumir meu perfil',
  acesso: 'Saber quais dados vocês têm sobre mim',
  oposicao: 'Me opor ao uso dos meus dados',
  outro: 'Outro pedido',
  portabilidade: 'Portabilidade dos dados',
  revogacao: 'Revogação de consentimento',
}

export interface PedidoNormalizado {
  tipo: TipoPedido
  nome: string | null
  contato: string
  descricao: string | null
  prestadorId: number | null
}

export type ResultadoValidacaoPedido =
  | { ok: true; robo: boolean; dados: PedidoNormalizado }
  | { ok: false; erros: Partial<Record<'tipo' | 'nome' | 'contato' | 'descricao', string>> }

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const LIMITE_NOME = 200
const LIMITE_CONTATO = 200
const LIMITE_DESCRICAO = 2000

function texto(valor: unknown): string {
  return typeof valor === 'string' ? valor.trim() : ''
}

export function contatoEhValido(contato: string): boolean {
  if (contato.length < 5 || contato.length > LIMITE_CONTATO) return false
  if (contato.includes('@')) return EMAIL.test(contato)
  const digitos = contato.replace(/\D/g, '')
  return digitos.length >= 10 && digitos.length <= 13
}

export function validarPedidoTitular(entrada: unknown): ResultadoValidacaoPedido {
  const bruto = (typeof entrada === 'object' && entrada !== null ? entrada : {}) as Record<string, unknown>
  const erros: Partial<Record<'tipo' | 'nome' | 'contato' | 'descricao', string>> = {}

  const tipo = texto(bruto.tipo)
  if (!(TIPOS_PEDIDO as readonly string[]).includes(tipo)) erros.tipo = 'Escolha o tipo de pedido.'

  const nome = texto(bruto.nome)
  if (nome.length > LIMITE_NOME) erros.nome = 'Nome muito longo.'

  const contato = texto(bruto.contato)
  if (!contatoEhValido(contato)) erros.contato = 'Informe um e-mail ou WhatsApp válido, com DDD.'

  const descricao = texto(bruto.descricao)
  if (descricao.length > LIMITE_DESCRICAO) erros.descricao = 'Texto muito longo (máximo de 2000 caracteres).'
  if (tipo === 'outro' && descricao.length < 10) erros.descricao = 'Conte um pouco mais sobre o seu pedido.'

  if (Object.keys(erros).length > 0) return { ok: false, erros }

  const id = Number(bruto.prestadorId)
  const prestadorId = Number.isInteger(id) && id > 0 ? id : null

  return {
    ok: true,
    // Campo escondido que só robôs preenchem
    robo: texto(bruto.website).length > 0,
    dados: {
      tipo: tipo as TipoPedido,
      nome: nome || null,
      contato,
      descricao: descricao || null,
      prestadorId,
    },
  }
}
