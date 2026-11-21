// lib/admin/acoes.ts
// Registro de ações do admin: transforma uma linha do banco numa frase simples ("Célio bloqueou Ana").
// Só regras, sem banco. As linhas são gravadas por gatilhos (migration 20261121130000).

export interface AcaoAdmin {
  id: number
  quando: string
  admin_id: string | null
  admin_email: string | null
  acao: string
  alvo_tipo: string
  alvo_id: string
  alvo_nome: string | null
  motivo: string | null
  detalhes: Record<string, unknown> | null
}

export type GrupoDeAcao = 'feed' | 'bloqueio' | 'verificacao' | 'convite' | 'equipe'

export const GRUPOS: { valor: GrupoDeAcao; rotulo: string }[] = [
  { valor: 'feed', rotulo: 'Feed' },
  { valor: 'bloqueio', rotulo: 'Bloqueios' },
  { valor: 'verificacao', rotulo: 'Verificações' },
  { valor: 'convite', rotulo: 'Convites' },
  { valor: 'equipe', rotulo: 'Equipe' },
]

const GRUPO_DA_ACAO: Record<string, GrupoDeAcao> = {
  removeu_do_feed: 'feed',
  devolveu_ao_feed: 'feed',
  bloqueou_prestador: 'bloqueio',
  desbloqueou_prestador: 'bloqueio',
  aprovou_verificacao: 'verificacao',
  rejeitou_verificacao: 'verificacao',
  mudou_status_convite: 'convite',
  adicionou_admin: 'equipe',
  removeu_admin: 'equipe',
}

export function grupoDaAcao(acao: string): GrupoDeAcao | null {
  return GRUPO_DA_ACAO[acao] ?? null
}

const TIPO_VERIFICACAO: Record<string, string> = {
  cnpj: 'CNPJ', formacao: 'formação', conselho: 'conselho', seguro: 'seguro', cnd: 'certidão negativa (CND)',
}

const STATUS_CONVITE: Record<string, string> = {
  nao_enviado: 'Não enviado', enviado: 'Enviado', respondeu_positivo: 'Respondeu que sim',
  respondeu_negativo: 'Respondeu que não', sem_whatsapp: 'Sem WhatsApp', perfil_completo: 'Perfil completo',
  avaliacao_recebida: 'Avaliação recebida',
}

/** Nome curto de quem agiu: a parte do e-mail antes do @. */
export function nomeDeQuem(a: Pick<AcaoAdmin, 'admin_email'>): string {
  const local = a.admin_email?.split('@')[0]?.trim()
  return local || 'Alguém da equipe'
}

export function fraseDaAcao(a: AcaoAdmin): string {
  const quem = nomeDeQuem(a)
  const alvo = a.alvo_nome?.trim() || `#${a.alvo_id}`
  const d = a.detalhes ?? {}
  switch (a.acao) {
    case 'removeu_do_feed': return `${quem} removeu o trabalho "${alvo}" do feed`
    case 'devolveu_ao_feed': return `${quem} devolveu o trabalho "${alvo}" ao feed`
    case 'bloqueou_prestador': return `${quem} bloqueou ${alvo}`
    case 'desbloqueou_prestador': return `${quem} desbloqueou ${alvo}`
    case 'aprovou_verificacao':
    case 'rejeitou_verificacao': {
      const tipo = TIPO_VERIFICACAO[String(d.tipo)] ?? 'documento'
      const verbo = a.acao === 'aprovou_verificacao' ? 'aprovou' : 'rejeitou'
      return `${quem} ${verbo} a verificação de ${tipo} de ${alvo}`
    }
    case 'mudou_status_convite': {
      const de = STATUS_CONVITE[String(d.de)] ?? String(d.de ?? '')
      const para = STATUS_CONVITE[String(d.para)] ?? String(d.para ?? '')
      return `${quem} mudou o convite de ${alvo}: ${de} → ${para}`
    }
    case 'adicionou_admin': return `${quem} adicionou ${alvo} à equipe`
    case 'removeu_admin': return `${quem} tirou ${alvo} da equipe`
    default: return `${quem} fez uma ação (${a.acao}) em ${alvo}`
  }
}

export interface FiltroDeAcoes { grupo: GrupoDeAcao | 'todos'; quem: string }

export function filtrarAcoes(acoes: AcaoAdmin[], f: FiltroDeAcoes): AcaoAdmin[] {
  return acoes.filter((a) => (f.grupo === 'todos' || grupoDaAcao(a.acao) === f.grupo) && (!f.quem || a.admin_email === f.quem))
}

export function pessoasDoRegistro(acoes: AcaoAdmin[]): string[] {
  return Array.from(new Set(acoes.map((a) => a.admin_email).filter((e): e is string => Boolean(e)))).sort()
}
