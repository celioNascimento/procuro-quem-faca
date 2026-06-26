import { supabase } from '@/lib/supabase'
import { Cidade } from '@/types/localizacao'
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