export type PrestadorStage = 'publico' | 'cadastro' | 'reivindicado' | 'ativo'
export type PrestadorTab = 'todos' | PrestadorStage | 'acompanhar'

export interface AdminPrestador {
  id: number
  nome: string | null
  slug: string | null
  whatsapp: string | null
  email: string | null
  cidade: string | null
  estado_sigla: string | null
  categoria: string | null
  categoria_id: string | null
  grupoCategoria: string | null
  grupo_id: string | null
  origem_tipo: string | null
  user_id: string | null
  status: string | null
  ativacao_status: string | null
  created_at: string | null
  updated_at: string | null
  completude: number
  etapa: PrestadorStage
  etapaLabel: string
  contatoStatus: 'pendente' | 'sem_contato' | 'contatado'
  proximaAcao: string
}

export interface AdminPrestadoresResponse {
  prestadores: AdminPrestador[]
  totais: Record<PrestadorTab, number>
}

export interface AdminPrestadoresFilters {
  busca: string
  origem: string
  cidade: string
  categoria: string
  grupoCategoria: string
}

export function getPrestadorStage(row: { user_id?: string | null; origem_tipo?: string | null; ativacao_status?: string | null; status?: string | null }): PrestadorStage {
  if (row.user_id && ['perfil_completo', 'avaliacao_recebida'].includes(row.ativacao_status ?? '')) return 'ativo'
  if (row.user_id) return 'reivindicado'
  if (row.origem_tipo === 'registro_direto' || row.status === 'pendente') return 'cadastro'
  return 'publico'
}

export function getEtapaLabel(etapa: PrestadorStage) {
  return { publico: 'Perfil público', cadastro: 'Cadastro iniciado', reivindicado: 'Reivindicado', ativo: 'Ativo' }[etapa]
}

export function getCompletude(row: Record<string, unknown>) {
  const fields = ['nome', 'whatsapp', 'bio', 'categoria_id', 'cidade_id', 'foto_perfil', 'slug']
  return Math.round(fields.filter((field) => row[field] !== null && row[field] !== undefined && row[field] !== '').length / fields.length * 100)
}

export function getProximaAcao(etapa: PrestadorStage) {
  return { publico: 'Convidar a reivindicar', cadastro: 'Ajudar a concluir', reivindicado: 'Orientar ativação', ativo: 'Acompanhar desempenho' }[etapa]
}

export function normalizeAdminPrestador(row: Record<string, unknown>): AdminPrestador {
  const value = (key: string) => row[key]
  const text = (key: string) => typeof value(key) === 'string' ? value(key) as string : null
  const categoriaValue = row.categorias as { id?: string; nome?: string; grupo_id?: string; categorias_grupos?: { id?: string; nome?: string } | null } | { id?: string; nome?: string; grupo_id?: string; categorias_grupos?: { id?: string; nome?: string } | null }[] | null
  const categoriaRelation = Array.isArray(categoriaValue) ? categoriaValue[0] ?? null : categoriaValue
  const cidadeValue = row.cidades as { nome?: string; estado_sigla?: string } | { nome?: string; estado_sigla?: string }[] | null
  const cidadeRelation = Array.isArray(cidadeValue) ? cidadeValue[0] ?? null : cidadeValue
  const categoriaNome = categoriaRelation?.nome ?? text('categoria')
  const nome = text('nome') ?? text('nome_fantasia') ?? text('razao_social')
  const etapa = getPrestadorStage({ user_id: text('user_id'), origem_tipo: text('origem_tipo'), ativacao_status: text('ativacao_status'), status: text('status') })
  const completude = getCompletude(row)
  return {
    id: Number(value('id')), nome, slug: text('slug'), whatsapp: text('whatsapp'), email: text('email'),
    cidade: cidadeRelation?.nome ?? text('cidade'), estado_sigla: cidadeRelation?.estado_sigla ?? text('estado_sigla'), categoria: categoriaNome, categoria_id: text('categoria_id') ?? categoriaRelation?.id ?? null, grupoCategoria: categoriaRelation?.categorias_grupos?.nome ?? null, grupo_id: text('grupo_id') ?? categoriaRelation?.grupo_id ?? null, origem_tipo: text('origem_tipo'),
    user_id: text('user_id'), status: text('status'), ativacao_status: text('ativacao_status'),
    created_at: text('created_at'), updated_at: text('updated_at'), completude, etapa,
    etapaLabel: getEtapaLabel(etapa), contatoStatus: value('ativacao_enviado_em') ? 'contatado' : text('whatsapp') ? 'pendente' : 'sem_contato',
    proximaAcao: getProximaAcao(etapa),
  }
}

export const TAB_LABELS: Record<PrestadorTab, string> = { todos: 'Todos', publico: 'Públicos', cadastro: 'Cadastro iniciado', reivindicado: 'Reivindicados', ativo: 'Ativos', acompanhar: 'Acompanhar' }

export function matchesTab(item: AdminPrestador, tab: PrestadorTab) {
  return tab === 'todos' || tab === 'acompanhar' || item.etapa === tab
}

export function formatOrigem(origem: string | null) {
  return origem === 'registro_direto' ? 'Cadastro direto' : 'Curadoria pública'
}

export function formatDate(date: string | null) {
  if (!date) return 'Sem registro'
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short' }).format(new Date(date))
}

export function getMensagem(etapa: PrestadorStage, nome: string | null) {
  const saudacao = nome ? `Olá, ${nome}!` : 'Olá!'
  return { publico: `${saudacao} Encontramos seu perfil no ProcuroQuemFaça. Quer reivindicar e atualizar suas informações?`, cadastro: `${saudacao} Vimos que seu cadastro ficou incompleto. Posso ajudar você a finalizar seu perfil?`, reivindicado: `${saudacao} Seu perfil já está reivindicado. Vamos conferir os últimos passos para deixá-lo ativo?`, ativo: `${saudacao} Como está recebendo oportunidades pelo ProcuroQuemFaça?` }[etapa]
}

export function buildEmail(email: string | null) { return email ? `mailto:${email}` : undefined }
