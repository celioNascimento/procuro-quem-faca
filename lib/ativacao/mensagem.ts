// lib/ativacao/mensagem.ts
//
// Mensagens enviadas por WhatsApp aos profissionais que tiveram perfil criado pelo PQF a partir
// de informações públicas. Regras do texto (Política de Privacidade, seção 4, e doc 19):
//  - dizer quem somos e de onde vieram os dados;
//  - entregar o link pessoal, pelo qual o próprio profissional assume ou exclui o perfil;
//  - apontar a Política de Privacidade;
//  - não prometer ação manual da nossa parte (a exclusão é feita pelo titular, pelo link).

import { SITE_URL } from '@/lib/divulgacao/links'

export type TipoMensagemAtivacao = 'primeiro_contato' | 'corretiva' | 'exclusao'

interface DadosAtivacao {
  ativacao_status: string
  ativacao_enviado_em?: string | null
}

// Quem já recebeu a primeira mensagem (que não explicava a origem dos dados) recebe a corretiva
const STATUS_JA_CONTATADO = [
  'enviado',
  'respondeu_positivo',
  'respondeu_negativo',
  'perfil_completo',
  'avaliacao_recebida',
]

export function tipoMensagemAtivacao(p: DadosAtivacao): TipoMensagemAtivacao {
  if (p.ativacao_status === 'respondeu_negativo') return 'exclusao'
  const jaContatado = Boolean(p.ativacao_enviado_em) || STATUS_JA_CONTATADO.includes(p.ativacao_status)
  return jaContatado ? 'corretiva' : 'primeiro_contato'
}

export function linkPessoal(token: string): string {
  return `${SITE_URL}/reivindicar?token=${token}`
}

const LINK_PRIVACIDADE = `${SITE_URL}/privacidade`

interface ParamsMensagem {
  tipo: TipoMensagemAtivacao
  nome: string
  slug: string
  token: string
}

export function montarMensagemAtivacao({ tipo, nome, slug, token }: ParamsMensagem): string {
  const link = linkPessoal(token)
  const perfil = `${SITE_URL}/${slug}`

  if (tipo === 'exclusao') {
    return (
      `Olá, ${nome}! Obrigado pelo retorno e desculpe o incômodo.\n\n` +
      `Para excluir o seu perfil e todos os dados dele, use este link pessoal:\n` +
      `${link}\n\n` +
      `Como tratamos seus dados: ${LINK_PRIVACIDADE}`
    )
  }

  if (tipo === 'corretiva') {
    return (
      `Olá, ${nome}! Aqui é o Célio, responsável pelo Procuro Quem Faça.\n\n` +
      `Na nossa primeira mensagem, faltou explicar como o seu perfil foi criado. Ele foi montado com as informações de contato profissional que você divulga publicamente em anúncios online: nome, WhatsApp, serviço e cidade. Nenhum outro dado foi coletado.\n\n` +
      `Você pode assumir o perfil e corrigir as informações, ou excluir o perfil e todos os dados, quando quiser, por este link pessoal:\n` +
      `${link}\n\n` +
      `Seu perfil: ${perfil}\n\n` +
      `Como tratamos seus dados: ${LINK_PRIVACIDADE}`
    )
  }

  return (
    `Olá, ${nome}! Tudo bem?\n\n` +
    `Aqui é o Célio, responsável pelo Procuro Quem Faça, uma plataforma de Londrina onde moradores encontram profissionais para serviços.\n\n` +
    `Criei um perfil para você com as informações de contato profissional que você divulga publicamente em anúncios online: nome, WhatsApp, serviço e cidade. Nenhum outro dado foi coletado.\n\n` +
    `Seu perfil: ${perfil}?src=ativacao\n\n` +
    `Este link é pessoal e permite que você assuma o perfil, para completar e corrigir as informações, ou exclua o perfil e todos os dados, quando quiser:\n` +
    `${link}\n\n` +
    `O serviço é gratuito e a decisão é sua. Como tratamos seus dados: ${LINK_PRIVACIDADE}`
  )
}

export function rotuloAcaoAtivacao(tipo: TipoMensagemAtivacao, status: string): string {
  if (tipo === 'exclusao') return 'Enviar link de exclusão'
  if (tipo === 'corretiva') return 'Enviar aviso corretivo'
  return status === 'nao_enviado' ? 'Enviar WA' : 'Abrir WA'
}
