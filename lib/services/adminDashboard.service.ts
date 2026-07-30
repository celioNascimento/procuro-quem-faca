//lib/services/adminDashboard.service.ts

import { supabase } from '@/lib/supabase'

export interface CategoriaRanking {
  nome: string
  total: number
}

export interface RadarItem {
  acao: string
  detalhes: { termo?: string } | null
  created_at: string
}

export interface ContadoresGerais {
  cidades: number
  anuncios: number
  prestadores: number
  logs: number
}

export interface OrigemStats {
  curadoria: number
  registrados: number
  reivindicados: number
}

export interface AtivacaoStats {
  total: number
  enviados: number
  ativos: number
}

export async function getContadoresGerais(): Promise<ContadoresGerais> {
  const [cidades, anuncios, prestadores, logs] = await Promise.all([
    supabase.from('cidades').select('*', { count: 'exact', head: true }),
    supabase.from('anuncios').select('*', { count: 'exact', head: true }),
    supabase.from('prestadores').select('*', { count: 'exact', head: true }),
    supabase.from('logs_atividades').select('*', { count: 'exact', head: true }),
  ])

  return {
    cidades: cidades.count || 0,
    anuncios: anuncios.count || 0,
    prestadores: prestadores.count || 0,
    logs: logs.count || 0,
  }
}

export async function getOrigemEAtivacaoStats(): Promise<{ origem: OrigemStats; ativacao: AtivacaoStats }> {
  const { data: pDataAll } = await supabase
    .from('prestadores')
    .select('origem_tipo, user_id, ativacao_status')

  const origem: OrigemStats = {
    curadoria: pDataAll?.filter(p => p.origem_tipo === 'curadoria_publica' && !p.user_id).length || 0,
    registrados: pDataAll?.filter(p => p.origem_tipo === 'registro_direto').length || 0,
    reivindicados: pDataAll?.filter(p => p.user_id && p.origem_tipo === 'curadoria_publica').length || 0,
  }

  const ativacao: AtivacaoStats = {
    total: pDataAll?.length || 0,
    enviados: pDataAll?.filter(p => p.ativacao_status !== 'nao_enviado').length || 0,
    ativos: pDataAll?.filter(p => ['perfil_completo', 'avaliacao_recebida'].includes(p.ativacao_status)).length || 0,
  }

  return { origem, ativacao }
}

/**
 * Ranking de categorias mais buscadas, baseado em logs com
 * acao='FILTRO_CATEGORIA' e entidade_id = id da categoria.
 *
 * NOTA: nenhum ponto do frontend revisado até agora grava esse log
 * explicitamente — se essa gravação não existir de fato em algum lugar
 * do código, este ranking sempre retorna vazio (o card já trata isso
 * com "Sem dados ainda", não é um erro). Confirmar/implementar a
 * gravação desse log é uma pendência registrada no roadmap.
 */
export async function getRankingCategorias(): Promise<CategoriaRanking[]> {
  const { data: logCats } = await supabase
    .from('logs_atividades')
    .select('entidade_id')
    .eq('acao', 'FILTRO_CATEGORIA')

  const { data: catNames } = await supabase.from('categorias').select('id, nome')

  const counts = logCats?.reduce((acc: Record<string, number>, log) => {
    if (log.entidade_id) acc[log.entidade_id] = (acc[log.entidade_id] || 0) + 1
    return acc
  }, {})

  return Object.entries(counts || {})
    .map(([id, total]) => ({
      nome: catNames?.find(c => c.id === id)?.nome || 'Outros',
      total: total as number,
    }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 4)
}

export async function getRadarRecente(): Promise<RadarItem[]> {
  const { data } = await supabase
    .from('logs_atividades')
    .select('acao, detalhes, created_at')
    .in('acao', ['CLIQUE_WHATSAPP', 'BUSCA_SEM_SUCESSO', 'DENUNCIA_PERFIL'])
    .order('created_at', { ascending: false })
    .limit(8)

  return (data as RadarItem[]) || []
}
