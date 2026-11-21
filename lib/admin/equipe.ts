// lib/admin/equipe.ts
// Gestão da equipe de admins: tipos, normalização do retorno do banco e mensagens em linguagem simples.
// Só regras, sem banco. As funções do banco estão na migration 20261121140000.

export interface MembroDaEquipe {
  userId: string
  email: string
  role: string
  desde: string | null
  ultimoAcesso: string | null
  duasEtapas: boolean
}

export interface EquipeAdmin {
  euDono: boolean
  meuId: string | null
  membros: MembroDaEquipe[]
}

export function normalizarEquipe(bruto: unknown): EquipeAdmin {
  const b = (bruto && typeof bruto === 'object' ? bruto : {}) as Record<string, unknown>
  const lista = Array.isArray(b.membros) ? b.membros : []
  const membros: MembroDaEquipe[] = lista
    .filter((m): m is Record<string, unknown> => Boolean(m) && typeof m === 'object' && typeof (m as Record<string, unknown>).user_id === 'string')
    .map((m) => ({
      userId: String(m.user_id),
      email: String(m.email ?? ''),
      role: String(m.role ?? 'editor'),
      desde: typeof m.desde === 'string' ? m.desde : null,
      ultimoAcesso: typeof m.ultimo_acesso === 'string' ? m.ultimo_acesso : null,
      duasEtapas: m.duas_etapas === true,
    }))
  return { euDono: b.eu_dono === true, meuId: typeof b.meu_id === 'string' ? b.meu_id : null, membros }
}

export const ROTULO_PAPEL: Record<string, string> = { owner: 'Dono', editor: 'Editor', moderator: 'Moderador' }
export const rotuloDoPapel = (role: string) => ROTULO_PAPEL[role] ?? role

export function emailValido(texto: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(texto.trim())
}

export const MSG_EQUIPE: Record<string, string> = {
  sem_permissao: 'Só o dono da equipe pode fazer isso.',
  email_invalido: 'Digite um e-mail válido.',
  sem_conta: 'Esse e-mail ainda não tem conta no site. Peça para a pessoa se cadastrar primeiro e tente de novo.',
  ja_e_admin: 'Essa pessoa já está na equipe.',
  nao_pode_remover_a_si: 'Você não pode tirar a si mesmo da equipe.',
  nao_encontrado: 'Essa pessoa não está mais na equipe. Atualize a lista.',
  ultimo_dono: 'Não dá para tirar o único dono da equipe.',
}

export function mensagemDoCodigoEquipe(codigo: string): string {
  return MSG_EQUIPE[codigo] ?? 'Não foi possível concluir. Tente de novo.'
}

/** Pode tirar esta pessoa? Só o dono, e nunca a si mesmo. O banco confere de novo (e protege o último dono). */
export function podeRemover(equipe: EquipeAdmin, m: MembroDaEquipe): boolean {
  return equipe.euDono && m.userId !== equipe.meuId
}

/** Quem da equipe ainda não ligou as duas etapas (para o lembrete). */
export function semDuasEtapas(equipe: EquipeAdmin): MembroDaEquipe[] {
  return equipe.membros.filter((m) => !m.duasEtapas)
}
