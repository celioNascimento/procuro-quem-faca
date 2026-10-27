// lib/services/cliques.service.ts
//
// Camada de banco (somente consultas) do registro de cliques no WhatsApp.
// Recebe o cliente do Supabase como parâmetro, então não decide permissões:
// quem chama (a rota no servidor) passa o cliente administrativo.

import type { SupabaseClient } from '@supabase/supabase-js'

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
