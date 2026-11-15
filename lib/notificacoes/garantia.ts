// lib/notificacoes/garantia.ts
//
// Texto dos avisos por e-mail do fluxo de garantia/reclamação. Sem dado pessoal e sem o conteúdo do
// caso: só o que aconteceu e o link do painel (os detalhes ficam atrás do login).

import { SITE_URL } from '@/lib/divulgacao/links'
import type { EmailNotificacao } from '@/lib/notificacoes/mensagens'

export type EventoGarantia =
  | 'aberto'
  | 'respondido'
  | 'reaberto'
  | 'oferta'
  | 'aceita'
  | 'recusada'
  | 'resolvido'
  | 'sem_resposta'
  | 'oferta_expirada'

export type Destinatario = 'cliente' | 'prestador'

interface Entrada {
  titulo: string
  texto: string
}

const URL_PAINEL: Record<Destinatario, string> = {
  cliente: `${SITE_URL}/painel/perfil`,
  prestador: `${SITE_URL}/dashboard`,
}

const ASSUNTO = 'PQF: novidade em um serviço seu'

function palavra(tipo: string | undefined): string {
  return tipo === 'reclamacao' ? 'reclamação' : 'garantia'
}

export function mensagemGarantia(
  evento: EventoGarantia,
  destinatario: Destinatario,
  tipo?: string,
): EmailNotificacao & { evento: EventoGarantia } {
  const caso = palavra(tipo)
  const textos: Record<EventoGarantia, Partial<Record<Destinatario, Entrada>>> = {
    aberto: {
      prestador: {
        titulo: `Um cliente abriu uma ${caso}`,
        texto: `Um cliente abriu uma ${caso} sobre um serviço seu. Você tem 5 dias úteis para responder. Se o prazo passar sem resposta, o caso é encerrado como "sem resposta" e isso aparece no seu perfil.`,
      },
    },
    respondido: {
      cliente: {
        titulo: 'O prestador respondeu',
        texto: `O prestador respondeu à sua ${caso}. Abra o painel e diga se o problema foi resolvido ou se ainda não.`,
      },
    },
    reaberto: {
      prestador: {
        titulo: 'O cliente reabriu o caso',
        texto: `O cliente informou que o problema ainda não foi resolvido e reabriu a ${caso}. Você tem mais 5 dias úteis para responder.`,
      },
    },
    oferta: {
      cliente: {
        titulo: 'Um prestador quer reparar o serviço',
        texto: 'O prestador se ofereceu para reparar o serviço sem custo. Abra o painel para aceitar ou recusar. Se você não responder em 15 dias, a oferta é encerrada.',
      },
    },
    aceita: {
      prestador: {
        titulo: 'O cliente aceitou o reparo',
        texto: 'O cliente aceitou a sua oferta de reparo. Você tem 5 dias úteis para registrar a sua resposta.',
      },
    },
    recusada: {
      prestador: {
        titulo: 'O cliente recusou o reparo',
        texto: 'O cliente não aceitou a sua oferta de reparo. O caso foi encerrado.',
      },
    },
    resolvido: {
      prestador: {
        titulo: 'O cliente confirmou a solução',
        texto: `O cliente confirmou que o problema foi resolvido e a ${caso} foi encerrada.`,
      },
    },
    sem_resposta: {
      prestador: {
        titulo: 'Prazo de resposta encerrado',
        texto: `O prazo de 5 dias úteis acabou sem resposta e a ${caso} foi encerrada como "sem resposta".`,
      },
      cliente: {
        titulo: 'O prestador não respondeu no prazo',
        texto: `O prestador não respondeu à sua ${caso} dentro do prazo, e o caso foi encerrado. Isso fica registrado no perfil dele.`,
      },
    },
    oferta_expirada: {
      prestador: {
        titulo: 'A oferta de reparo expirou',
        texto: 'O cliente não respondeu à sua oferta de reparo em 15 dias, e ela foi encerrada.',
      },
      cliente: {
        titulo: 'A oferta de reparo expirou',
        texto: 'A oferta de reparo do prestador foi encerrada porque não houve resposta em 15 dias.',
      },
    },
  }

  const entrada = textos[evento][destinatario]
  if (!entrada) throw new Error(`Sem mensagem para ${evento}/${destinatario}`)
  return {
    evento,
    assunto: ASSUNTO,
    texto: `${entrada.titulo}.\n\n${entrada.texto}\n\nAcompanhe em: ${URL_PAINEL[destinatario]}`,
  }
}

// Quem recebe o aviso de cada evento disparado por uma pessoa (o outro lado do caso)
export const DESTINATARIO_DO_EVENTO: Partial<Record<EventoGarantia, Destinatario>> = {
  aberto: 'prestador',
  respondido: 'cliente',
  reaberto: 'prestador',
  oferta: 'cliente',
  aceita: 'prestador',
  recusada: 'prestador',
  resolvido: 'prestador',
}
