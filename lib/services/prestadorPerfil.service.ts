import { supabase } from '@/lib/supabase'
import { Prestador } from '@/types/prestador'

/**
 * Atualizar a configuração de portfólio obrigatório do prestador
 */
export async function updatePortfolioObrigatorio(
  prestadorId: number,
  obrigatorio: boolean,
) {
  const { error } = await supabase
    .from('prestadores')
    .update({ portfolio_obrigatorio: obrigatorio })
    .eq('id', prestadorId)

  if (error) throw error
}

/**
 * Atualizar múltiplos campos do perfil do prestador
 */
export async function atualizarPerfilPrestador(
  prestadorId: number,
  dados: Partial<Prestador>,
) {
  const { error } = await supabase
    .from('prestadores')
    .update(dados)
    .eq('id', prestadorId)

  if (error) throw error
}

/**
 * Buscar informações do prestador
 */
export async function getPrestador(prestadorId: number) {
  const { data, error } = await supabase
    .from('prestadores')
    .select('*')
    .eq('id', prestadorId)
    .single()

  if (error) throw error
  return data as Prestador
}
