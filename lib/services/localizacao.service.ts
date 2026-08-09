//lib/services/localizacao.service.ts

import { supabase } from '@/lib/supabase'
import type { Estado, Regiao, Cidade } from '@/types/localizacao'
import { Prestador } from '@/types/prestador'

/**
 * Retorna todas as cidades que estão com status ativa = true
 * Usaremos isso para popular o Modal "Onde você está?"
 */
export async function getCidadesAtivasParaFiltro(): Promise<Cidade[]> {
  const { data, error } = await supabase
    .from('cidades')
    .select('id, nome, estado_sigla, ativa')
    .eq('ativa', true)
    .order('nome', { ascending: true })

  if (error) {
    console.error('Erro ao buscar cidades ativas:', error)
    return []
  }

  return data as Cidade[]
}

/**
 * Busca os prestadores aprovados, filtrando obrigatoriamente pela cidade
 * selecionada pelo usuário (salva no Cookie).
 */
export async function getPrestadoresVitrinePorCidade(cidadeId: string): Promise<Prestador[]> {
  const { data, error } = await supabase
    .from('prestadores')
    .select(`
      id,
      slug,
      nome,
      bio,
      foto_perfil,
      categorias(nome),
      cidades(nome, estado_sigla),
      media_nota,
      total_avals
    `)
    // Filtros essenciais para a vitrine pública:
    .eq('cidade_id', cidadeId)
    .eq('status', 'aprovado') // Apenas quem já passou pela sua curadoria
    .eq('bloqueado', false)

  if (error) {
    console.error('Erro ao buscar prestadores da vitrine:', error)
    return []
  }

  return data as unknown as Prestador[]
}

/**
   * Usado pelo fluxo de Cadastro/Edição de Prestador (useLocalizacao) para
   * popular os selects em cascata: estado → região → cidade.
   */
export async function fetchEstados(): Promise<Estado[]> {
  const { data, error } = await supabase.from('estados').select('*').order('nome')
  if (error) {
    console.error('Erro ao buscar estados:', error)
    return []
  }
  return data || []
}

export async function fetchRegioesPorEstado(siglaEstado: string): Promise<Regiao[]> {
  if (!siglaEstado) return []
  const { data, error } = await supabase
    .from('regioes')
    .select('*')
    .eq('estado_sigla', siglaEstado)
    .order('nome')
  if (error) {
    console.error('Erro ao buscar regiões:', error)
    return []
  }
  return data || []
}

/**
 * Busca cidades por região (se informada) ou, na ausência dela, por estado.
 * Retorna [] se nem região nem estado forem fornecidos.
 */
export async function fetchCidadesPorRegiaoOuEstado(
  regiaoId: string | number | null,
  estadoSigla: string
): Promise<Cidade[]> {
  let query = supabase.from('cidades').select('*').eq('ativa', true).order('nome')

  if (regiaoId) {
    query = query.eq('regiao_id', regiaoId)
  } else if (estadoSigla) {
    query = query.eq('estado_sigla', estadoSigla)
  } else {
    return []
  }

  const { data, error } = await query
  if (error) {
    console.error('Erro ao buscar cidades:', error)
    return []
  }
  return data || []
}