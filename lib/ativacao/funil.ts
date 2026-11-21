// lib/ativacao/funil.ts
//
// Funil de ativação da tela Convites: onde as pessoas convidadas travam. Só regras, nada de banco.
// Cada etapa conta, entre os perfis já convidados, quantos chegaram lá. Perfis de exemplo ficam de fora.

export interface PerfilDoFunil {
  id: number
  user_id?: string | null
  exemplo?: boolean | null
  ativacao_status: string
  ativacao_enviado_em: string | null
  ativacao_respondeu_em: string | null
}

export interface TrabalhoDoPrestador {
  publicou: boolean
  noFeed: boolean
}
export type TrabalhosPorPrestador = Record<number, TrabalhoDoPrestador>

export interface EtapaDoFunil {
  chave: 'convidados' | 'responderam' | 'conta' | 'publicaram' | 'feed'
  rotulo: string
  total: number
  /** Percentual dos convidados (0 a 100, inteiro). */
  percentual: number
}

export interface Funil {
  etapas: EtapaDoFunil[]
  /** Disseram que não querem. Não seguem no funil. */
  recusaram: number
  /** Contas reais que chegaram sem passar por um convite pela ferramenta. */
  contasSemConvite: number
}

const JA_CONVIDADO = ['enviado', 'respondeu_positivo', 'respondeu_negativo', 'perfil_completo', 'avaliacao_recebida']
const INTERESSADO = ['respondeu_positivo', 'perfil_completo', 'avaliacao_recebida']

export function foiConvidado(p: PerfilDoFunil): boolean {
  return Boolean(p.ativacao_enviado_em) || JA_CONVIDADO.includes(p.ativacao_status)
}

export function respondeuComInteresse(p: PerfilDoFunil): boolean {
  return INTERESSADO.includes(p.ativacao_status) || (Boolean(p.ativacao_respondeu_em) && p.ativacao_status !== 'respondeu_negativo')
}

const pct = (parte: number, todo: number) => (todo > 0 ? Math.round((parte / todo) * 100) : 0)

export function montarFunil(perfis: PerfilDoFunil[], trabalhos: TrabalhosPorPrestador): Funil {
  const reais = perfis.filter((p) => !p.exemplo)
  const convidados = reais.filter(foiConvidado)
  const comConta = convidados.filter((p) => Boolean(p.user_id))
  const publicaram = comConta.filter((p) => trabalhos[p.id]?.publicou)
  const noFeed = comConta.filter((p) => trabalhos[p.id]?.noFeed)
  const responderam = convidados.filter(respondeuComInteresse)

  const etapa = (chave: EtapaDoFunil['chave'], rotulo: string, lista: PerfilDoFunil[]): EtapaDoFunil => ({
    chave, rotulo, total: lista.length, percentual: pct(lista.length, convidados.length),
  })

  return {
    etapas: [
      etapa('convidados', 'Convidados', convidados),
      etapa('responderam', 'Responderam com interesse', responderam),
      etapa('conta', 'Criaram ou assumiram a conta', comConta),
      etapa('publicaram', 'Publicaram um trabalho', publicaram),
      etapa('feed', 'Trabalho aceito no feed', noFeed),
    ],
    recusaram: convidados.filter((p) => p.ativacao_status === 'respondeu_negativo').length,
    contasSemConvite: reais.filter((p) => Boolean(p.user_id) && !foiConvidado(p)).length,
  }
}

/** Frase simples sobre onde está o maior vazamento, para quem não quer ler barra por barra. */
export function leituraDoFunil(f: Funil): string {
  const convidados = f.etapas[0].total
  if (convidados === 0) return 'Ninguém foi convidado ainda. Comece pela fila "Para fazer hoje".'
  const [, responderam, conta, publicaram, feed] = f.etapas
  if (responderam.total === 0 && conta.total === 0) return 'Ninguém respondeu ainda. Vale conferir a mensagem e o horário do envio.'
  if (conta.total === 0) return 'Há respostas, mas ninguém criou a conta. Ajude a pessoa a entrar pelo link pessoal.'
  if (publicaram.total === 0) return 'Há contas, mas nenhuma com trabalho publicado. É a hora de ajudar a cadastrar o primeiro trabalho.'
  if (feed.total === 0) return 'Há trabalhos publicados, mas nenhum aceito pelo cliente. Lembre os clientes de aceitar.'
  return 'O funil já chegou ao feed. Continue convidando no ritmo da meta.'
}
