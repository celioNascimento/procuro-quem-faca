// lib/services/cliques.service.ts
//
// Camada de banco (somente consultas) do registro de cliques no WhatsApp.
// Recebe o cliente do Supabase como parâmetro, então não decide permissões:
// quem chama (a rota no servidor) passa o cliente administrativo.

import type { SupabaseClient } from '@supabase/supabase-js'
import type { CliqueLinha } from '@/lib/tracking/resumo'

export interface PrestadorParaClique {
  id: number
  user_id: string | null
  nome: string | null
}

export interface NovoClique {
  prestadorId: number
  origem: string | null
  campanha: string | null
  sessaoId: string
}

export async function buscarPrestadorParaClique(
  db: SupabaseClient,
  prestadorId: number,
): Promise<PrestadorParaClique | null> {
  const { data, error } = await db
    .from('prestadores')
    .select('id, user_id, nome')
    .eq('id', prestadorId)
    .maybeSingle()

  if (error) throw error
  return data as PrestadorParaClique | null
}

// Já houve clique desta sessão neste prestador nas últimas N horas?
export async function jaContouCliqueRecente(
  db: SupabaseClient,
  prestadorId: number,
  sessaoId: string,
  horas = 24,
): Promise<boolean> {
  const desde = new Date(Date.now() - horas * 60 * 60 * 1000).toISOString()

  const { count, error } = await db
    .from('cliques')
    .select('id', { count: 'exact', head: true })
    .eq('prestador_id', prestadorId)
    .eq('sessao_id', sessaoId)
    .gte('created_at', desde)

  if (error) throw error
  return (count ?? 0) > 0
}

export async function inserirClique(db: SupabaseClient, clique: NovoClique): Promise<void> {
  const { error } = await db.from('cliques').insert({
    prestador_id: clique.prestadorId,
    created_at: new Date().toISOString(),
    origem: clique.origem,
    campanha: clique.campanha,
    sessao_id: clique.sessaoId,
  })

  if (error) throw error
}

export interface LogClique {
  prestadorId: number
  nomePrestador: string | null
  origem: string | null
  campanha: string | null
  usuarioId: string | null
  usuarioEmail: string | null
}

// Log de auditoria (lido na página /admin/logs). Gravado no servidor, só
// quando o clique foi realmente contado, para nunca divergir da tabela
// `cliques`. É auxiliar: quem chama não deve falhar o clique por causa dele.
export async function inserirLogClique(db: SupabaseClient, log: LogClique): Promise<void> {
  const { error } = await db.from('logs_atividades').insert({
    acao: 'CLIQUE_WHATSAPP_ORCAMENTO',
    detalhes: {
      nome_prestador: log.nomePrestador,
      origem: log.origem,
      campanha: log.campanha,
    },
    entidade_tipo: 'prestador',
    entidade_id: String(log.prestadorId),
    usuario_id: log.usuarioId,
    usuario_email: log.usuarioEmail,
  })

  if (error) throw error
}

// ── Leitura para os painéis (prestador e admin) ──────────────────────────

export interface ContagemCliquesPrestador {
  ultimos7: number
  ultimos30: number
  total: number
}

const DIA_MS = 24 * 60 * 60 * 1000

async function contarCliques(db: SupabaseClient, prestadorId: number, desdeISO?: string): Promise<number> {
  let consulta = db
    .from('cliques')
    .select('id', { count: 'exact', head: true })
    .eq('prestador_id', prestadorId)
  if (desdeISO) consulta = consulta.gte('created_at', desdeISO)

  const { count, error } = await consulta
  if (error) throw error
  return count ?? 0
}

// Janelas deslizantes (agora menos 7 ou 30 dias). O total inclui os registros
// históricos importados (sessao_id = 'backfill').
export async function contarCliquesDoPrestador(
  db: SupabaseClient,
  prestadorId: number,
  agora: Date = new Date(),
): Promise<ContagemCliquesPrestador> {
  const desde7 = new Date(agora.getTime() - 7 * DIA_MS).toISOString()
  const desde30 = new Date(agora.getTime() - 30 * DIA_MS).toISOString()

  const [ultimos7, ultimos30, total] = await Promise.all([
    contarCliques(db, prestadorId, desde7),
    contarCliques(db, prestadorId, desde30),
    contarCliques(db, prestadorId),
  ])

  return { ultimos7, ultimos30, total }
}

export async function buscarPrestadorIdDoUsuario(
  db: SupabaseClient,
  userId: string,
): Promise<number | null> {
  const { data, error } = await db
    .from('prestadores')
    .select('id')
    .eq('user_id', userId)
    .limit(1)
    .maybeSingle()

  if (error) throw error
  return data ? Number(data.id) : null
}

const TAMANHO_PAGINA = 1000
const MAX_PAGINAS = 10

// O Supabase devolve no máximo 1000 linhas por consulta, então lê em páginas.
// Se bater o teto de MAX_PAGINAS, avisa com `truncado` em vez de mostrar um
// número menor como se fosse o total.
export async function listarCliquesDesde(
  db: SupabaseClient,
  desdeISO: string,
): Promise<{ linhas: CliqueLinha[]; truncado: boolean }> {
  const linhas: CliqueLinha[] = []

  for (let pagina = 0; pagina < MAX_PAGINAS; pagina++) {
    const inicio = pagina * TAMANHO_PAGINA
    const { data, error } = await db
      .from('cliques')
      .select('prestador_id, created_at, origem, campanha, sessao_id')
      .gte('created_at', desdeISO)
      .order('created_at', { ascending: false })
      .order('id', { ascending: false })
      .range(inicio, inicio + TAMANHO_PAGINA - 1)

    if (error) throw error

    const recebidas = (data ?? []) as CliqueLinha[]
    linhas.push(...recebidas)
    if (recebidas.length < TAMANHO_PAGINA) return { linhas, truncado: false }
  }

  return { linhas, truncado: true }
}

export async function buscarNomesDePrestadores(
  db: SupabaseClient,
  ids: number[],
): Promise<Record<number, string | null>> {
  if (ids.length === 0) return {}

  const { data, error } = await db.from('prestadores').select('id, nome').in('id', ids)
  if (error) throw error

  const nomes: Record<number, string | null> = {}
  for (const linha of data ?? []) nomes[Number(linha.id)] = (linha.nome as string | null) ?? null
  return nomes
}
