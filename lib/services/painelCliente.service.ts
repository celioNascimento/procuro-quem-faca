import { supabase } from '@/lib/supabase'
import type { Servico } from '@/types/painel'
import { anexarTokens, obterProjetoIdPorToken } from './projetoToken.service'
import { anexarDadosCliente, nomeClientePorToken } from './dadosClienteProjeto.service'

// Adicionado o user_id no retorno de prestadores para permitir o filtro.
// solicitacoes_garantia é LEFT JOIN (sem !inner) — traz o array vazio []
// quando o projeto não tem nenhum caso de garantia, em vez de excluir a
// linha. Isso é o que permite saber, dentro do MESMO objeto de projeto,
// se ele tem garantia ativa — sem precisar de uma segunda consulta
// separada e comparar arrays por id depois (fonte de bugs sutis se os
// tipos/formatos de id não baterem entre as duas queries).
// tipo adicionado: distingue garantia formal de reclamação — mesma
// máquina de estados, prazos e linguagem diferentes (ver garantia.service.ts).
const SELECT_SERVICOS = `
  id, prestador_id, titulo, descricao, data_conclusao, created_at, data_inicio,
      status, aceito_at, cliente_user_id, sem_fotos, marcado_concluido_at,
  prestadores (id, user_id, nome, foto_perfil, whatsapp, categoria:categorias(nome)),
  portfolio_fotos (*),
  solicitacoes_garantia (id, status, origem, tipo, prazo_resposta),
  avaliacoes_clientes (id, nota, motivos, created_at)
`

const STATUS_VISIVEIS = ['em_registro', 'pendente', 'aguardando_aceite', 'em_execucao', 'finalizado', 'em_disputa']

// Status de solicitacoes_garantia considerados "ativos" — casos já resolvidos
// ou recusados não contam como ativos (voltam a contar como Concluídos).
const STATUS_GARANTIA_ATIVOS = ['aguardando_aceite_cliente', 'aberta', 'respondida']

/**
 * Deriva se um serviço tem GARANTIA FORMAL ativa (tipo='garantia') a
 * partir do array solicitacoes_garantia já embutido nele pelo join — não
 * faz consulta nem comparação externa. Cada Servico carrega sua própria
 * resposta. Reclamações (tipo='reclamacao') NÃO contam aqui — usar
 * temReclamacaoAtiva para essas.
 */
export function temGarantiaAtiva(servico: { solicitacoes_garantia?: { status: string; tipo?: string }[] }): boolean {
  return (servico.solicitacoes_garantia ?? []).some(g =>
    STATUS_GARANTIA_ATIVOS.includes(g.status) && g.tipo !== 'reclamacao'
  )
}

/**
 * Deriva se um serviço tem RECLAMAÇÃO ativa (tipo='reclamacao') — mesmo
 * padrão de temGarantiaAtiva, complementar. Um serviço nunca tem os dois
 * tipos ativos ao mesmo tempo (garantia_dias do prestador decide um ou
 * outro no momento da abertura do caso), mas as duas funções ficam
 * separadas para deixar essa premissa explícita, não implícita.
 */
export function temReclamacaoAtiva(servico: { solicitacoes_garantia?: { status: string; tipo?: string }[] }): boolean {
  return (servico.solicitacoes_garantia ?? []).some(g =>
    STATUS_GARANTIA_ATIVOS.includes(g.status) && g.tipo === 'reclamacao'
  )
}

export async function getProfile(userId: string) {
  const { data } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle()
  return data
}

export async function getServicoPorToken(token: string): Promise<Servico[]> {
  // O token é a identidade do projeto selecionado (não filtrar por status: propostas
  // antigas ainda precisam de aceite). Não é legível pela API: resolve token -> id no banco.
  const projetoId = await obterProjetoIdPorToken(token)
  if (!projetoId) return []
  const { data } = await supabase
    .from('portfolio_projetos')
    .select(SELECT_SERVICOS)
    .eq('id', projetoId)
    .maybeSingle()
  if (!data) return []
  // Quem abre o link ainda pode não estar vinculado ao projeto: o nome vem pelo próprio link.
  const nome = await nomeClientePorToken(token)
  const [comToken] = await anexarTokens([data])
  return [{ ...comToken, cliente_nome: nome, cliente_whatsapp: null }] as unknown as Servico[]
}

export async function getServicosPorUserId(userId: string): Promise<Servico[]> {
  const { data } = await supabase
    .from('portfolio_projetos')
    .select(SELECT_SERVICOS)
    .eq('cliente_user_id', userId)
    .in('status', STATUS_VISIVEIS)
    .order('created_at', { ascending: false })
  const comToken = await anexarTokens(data ?? [])
  return (await anexarDadosCliente(comToken)) as unknown as Servico[]
}

/**
 * Projetos do cliente que têm GARANTIA FORMAL ativa agora — derivado
 * diretamente do array já embutido nos serviços (temGarantiaAtiva), sem
 * consulta separada.
 */
export function filtrarComGarantiaAtiva<T extends { solicitacoes_garantia?: { status: string; tipo?: string }[] }>(
  servicos: T[],
): T[] {
  return servicos.filter(temGarantiaAtiva)
}

/**
 * Projetos do cliente que têm RECLAMAÇÃO ativa agora — mesmo padrão de
 * filtrarComGarantiaAtiva, complementar.
 */
export function filtrarComReclamacaoAtiva<T extends { solicitacoes_garantia?: { status: string; tipo?: string }[] }>(
  servicos: T[],
): T[] {
  return servicos.filter(temReclamacaoAtiva)
}

type ResultadoAcao = 'ok' | 'nao_autenticado' | 'nao_encontrado' | 'nao_e_dono' | 'status_invalido'

function exigirOk(resultado: unknown) {
  if (resultado !== 'ok') throw new Error(`Ação recusada pelo banco: ${String(resultado)}`)
}

/** Somente a conta dona do projeto (vinculada pelo token) aceita. Regra na função do banco. */
export async function aceitarServico(servicoId: string, nomeCliente: string) {
  const { data, error } = await supabase.rpc('aceitar_projeto', { p_projeto_id: servicoId, p_nome: nomeCliente })
  if (error) throw error
  exigirOk(data as ResultadoAcao)
}

export async function recusarServico(servicoId: string) {
  const { data, error } = await supabase.rpc('recusar_projeto', { p_projeto_id: servicoId })
  if (error) throw error
  exigirOk(data as ResultadoAcao)
}

export async function loginComGoogle(tokenUrl: string | null) {
  const base = typeof window !== 'undefined' ? window.location.origin : ''
  const redirectTo = tokenUrl
    ? `${base}/meus-servicos?token=${tokenUrl}`
    : `${base}/meus-servicos`

  await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo } })
}
