// lib/ativacao/ajuda.ts
//
// "Precisa de ajuda": quem já tem conta e travou antes de aparecer no feed. Só regras, sem banco.
// Três situações, na ordem do caminho: conta sem trabalho, trabalho esperando o cliente aceitar e
// trabalho aceito que o prestador ainda não finalizou. Perfis de exemplo ficam de fora.

import type { LinhaDeTrabalho } from '@/lib/ativacao/funil'
import { urlCanonicaPerfil } from '@/lib/divulgacao/links'

export const DIAS_PARADO = 3
/** Sem entrar há 30 dias ou mais: a pessoa provavelmente esqueceu. Pede outra conversa, não um lembrete. */
export const DIAS_SUMIDO = 30

export type MotivoAjuda = 'sem_trabalho' | 'aguardando_cliente' | 'aguardando_finalizar'

export interface PrestadorComConta {
  id: number
  nome?: string | null
  whatsapp?: string | null
  slug?: string | null
  cidade?: string | null
  user_id?: string | null
  exemplo?: boolean | null
  created_at?: string | null
}

export interface ItemDeAjuda {
  chave: string
  motivo: MotivoAjuda
  prestadorId: number
  nome: string
  whatsapp: string | null
  cidade: string | null
  titulo: string | null
  desde: string
  dias: number
  parado: boolean
  /** Dias desde o último acesso à conta; null quando não se sabe. */
  ultimoAcessoDias: number | null
  sumido: boolean
}

export interface AcessoDaConta {
  prestadorId: number
  contaCriada: string | null
  ultimoAcesso: string | null
}

export function normalizarAcessos(bruto: unknown): AcessoDaConta[] {
  if (!Array.isArray(bruto)) return []
  return bruto
    .filter((a): a is Record<string, unknown> => Boolean(a) && typeof a === 'object' && typeof (a as Record<string, unknown>).prestador_id === 'number')
    .map((a) => ({
      prestadorId: a.prestador_id as number,
      contaCriada: typeof a.conta_criada === 'string' ? a.conta_criada : null,
      ultimoAcesso: typeof a.ultimo_acesso === 'string' ? a.ultimo_acesso : null,
    }))
}

export const ROTULO_MOTIVO: Record<MotivoAjuda, string> = {
  sem_trabalho: 'Conta criada, nenhum trabalho publicado',
  aguardando_cliente: 'Trabalho esperando o cliente aceitar',
  aguardando_finalizar: 'Trabalho aceito, falta finalizar',
}

export const ORIENTACAO_MOTIVO: Record<MotivoAjuda, string> = {
  sem_trabalho: 'Ajude a cadastrar um trabalho real e recente, com as fotos de antes e depois.',
  aguardando_cliente: 'Lembre o prestador de mandar de novo o link para o cliente aceitar.',
  aguardando_finalizar: 'Quando o serviço terminar, o prestador precisa finalizar para o trabalho entrar no feed.',
}

const MS_DIA = 24 * 60 * 60 * 1000

export function diasDesde(data: string, agora: Date = new Date()): number {
  const t = new Date(data).getTime()
  if (Number.isNaN(t)) return 0
  return Math.max(0, Math.floor((agora.getTime() - t) / MS_DIA))
}

function nomeOuPadrao(p: PrestadorComConta): string {
  return p.nome?.trim() || '(sem nome)'
}

export function montarAjuda(
  prestadores: PrestadorComConta[],
  trabalhos: LinhaDeTrabalho[],
  agora: Date = new Date(),
  acessos: AcessoDaConta[] = [],
): ItemDeAjuda[] {
  const acessoDe = new Map(acessos.map((a) => [a.prestadorId, a]))
  const porPrestador = new Map<number, LinhaDeTrabalho[]>()
  for (const t of trabalhos) porPrestador.set(t.prestador_id, [...(porPrestador.get(t.prestador_id) ?? []), t])

  const itens: ItemDeAjuda[] = []
  const novo = (p: PrestadorComConta, motivo: MotivoAjuda, chave: string, desde: string, titulo: string | null) => {
    const dias = diasDesde(desde, agora)
    const ultimo = acessoDe.get(p.id)?.ultimoAcesso
    const ultimoAcessoDias = ultimo ? diasDesde(ultimo, agora) : null
    itens.push({
      chave, motivo, prestadorId: p.id, nome: nomeOuPadrao(p), whatsapp: p.whatsapp ?? null,
      cidade: p.cidade ?? null, titulo, desde, dias, parado: dias >= DIAS_PARADO,
      ultimoAcessoDias, sumido: (ultimoAcessoDias ?? dias) >= DIAS_SUMIDO,
    })
  }

  for (const p of prestadores) {
    if (!p.user_id || p.exemplo) continue
    const meus = porPrestador.get(p.id) ?? []
    if (meus.length === 0) {
      // A data da conta (não a do perfil) é a que conta: quem reivindicou um perfil antigo acabou de chegar
      const desde = acessoDe.get(p.id)?.contaCriada ?? p.created_at
      if (desde) novo(p, 'sem_trabalho', `sem-${p.id}`, desde, null)
      continue
    }
    for (const t of meus) {
      if (t.status === 'pendente' && t.created_at) novo(p, 'aguardando_cliente', `cli-${t.id}`, t.created_at, t.titulo)
      else if (t.status === 'em_execucao') {
        const desde = t.aceito_at ?? t.created_at
        if (desde) novo(p, 'aguardando_finalizar', `fin-${t.id}`, desde, t.titulo)
      }
    }
  }

  // Quem está parado há mais tempo primeiro; empate pela ordem do caminho (conta, cliente, finalizar)
  const ordem: Record<MotivoAjuda, number> = { sem_trabalho: 0, aguardando_cliente: 1, aguardando_finalizar: 2 }
  return itens.sort((a, b) => Number(b.parado) - Number(a.parado) || b.dias - a.dias || ordem[a.motivo] - ordem[b.motivo])
}

/** Mensagem curta e sem cobrança, para o admin abrir a conversa. Nada de promessa que o site não cumpre. */
export function mensagemDeAjuda(item: ItemDeAjuda): string {
  const primeiro = item.nome.split(' ')[0]
  if (item.sumido) {
    return `Oi, ${primeiro}! Aqui é do Procuro Quem Faça. Faz um tempo que você criou sua conta e queria te mostrar uma novidade: agora o seu trabalho aparece como prova, com antes e depois e o aceite de quem contratou. Posso te ajudar a cadastrar o primeiro? Leva poucos minutos.`
  }
  if (item.motivo === 'sem_trabalho') {
    return `Oi, ${primeiro}! Aqui é do Procuro Quem Faça. Vi que sua conta já está criada. Posso te ajudar a cadastrar o primeiro trabalho, com as fotos de antes e depois? Leva poucos minutos.`
  }
  if (item.motivo === 'aguardando_cliente') {
    return `Oi, ${primeiro}! Aqui é do Procuro Quem Faça. Seu trabalho${item.titulo ? ` "${item.titulo}"` : ''} está esperando o cliente aceitar. Quer que eu te ajude a reenviar o link para ele?`
  }
  return `Oi, ${primeiro}! Aqui é do Procuro Quem Faça. O trabalho${item.titulo ? ` "${item.titulo}"` : ''} já foi aceito pelo cliente. Quando o serviço terminar, é só finalizar no painel para ele aparecer no feed. Precisa de ajuda com isso?`
}

export function resumoDaAjuda(itens: ItemDeAjuda[]): Record<MotivoAjuda, number> {
  const r: Record<MotivoAjuda, number> = { sem_trabalho: 0, aguardando_cliente: 0, aguardando_finalizar: 0 }
  for (const i of itens) r[i.motivo]++
  return r
}

/** Link do perfil de exemplo (para colar na conversa e mandar o print), se existir um marcado como exemplo. */
export function linkDoExemplo(perfis: { id: number; slug?: string | null; exemplo?: boolean | null }[]): string | null {
  const ex = perfis.find((p) => p.exemplo)
  return ex ? urlCanonicaPerfil(ex.slug, ex.id) : null
}

export function totalDeSumidos(itens: ItemDeAjuda[]): number {
  return itens.filter((i) => i.sumido).length
}
