// lib/services/visitas.service.ts
//
// Camada de banco (somente consultas) do registro de visitas ao perfil público.
// Recebe o cliente do Supabase como parâmetro, então não decide permissões:
// quem chama (a rota no servidor) passa o cliente administrativo.
//
// Atenção: na tabela visitas_perfil a coluna de data é `criado_em`
// (na tabela cliques é `created_at`).

import type { SupabaseClient } from '@supabase/supabase-js'

export interface PrestadorParaVisita {
  id: number
  user_id: string | null
}

export interface NovaVisita {
  prestadorId: number
  origem: string | null
  campanha: string | null
  sessaoId: string
}

export async function buscarPrestadorParaVisita(
  db: SupabaseClient,
  prestadorId: number,
): Promise<PrestadorParaVisita | null> {
  const { data, error } = await db
    .from('prestadores')
    .select('id, user_id')
    .eq('id', prestadorId)
    .maybeSingle()

  if (error) throw error
  return data as PrestadorParaVisita | null
}

// Já houve visita desta sessão a este prestador nas últimas N horas?
export async function jaContouVisitaRecente(
  db: SupabaseClient,
  prestadorId: number,
  sessaoId: string,
  horas = 24,
): Promise<boolean> {
  const desde = new Date(Date.now() - horas * 60 * 60 * 1000).toISOString()

  const { count, error } = await db
    .from('visitas_perfil')
    .select('id', { count: 'exact', head: true })
    .eq('prestador_id', prestadorId)
    .eq('sessao_id', sessaoId)
    .gte('criado_em', desde)

  if (error) throw error
  return (count ?? 0) > 0
}

export async function inserirVisita(db: SupabaseClient, visita: NovaVisita): Promise<void> {
  const { error } = await db.from('visitas_perfil').insert({
    prestador_id: visita.prestadorId,
    origem: visita.origem,
    campanha: visita.campanha,
    sessao_id: visita.sessaoId,
  })

  if (error) throw error
}