import { supabase } from '@/lib/supabase'
import { Prestador } from '@/types/prestador'

/**
 * Atualizar a configuração de portfólio obrigatório do prestador
 */
export async function updatePortfolioObrigatorio(
  prestadorId: number,
  obrigatorio: boolean,
) {
  const { data, error } = await supabase
    .from('prestadores')
    .update({ portfolio_obrigatorio: obrigatorio })
    .eq('id', prestadorId)
    .select('id, portfolio_obrigatorio')

  if (error) throw new Error(`Falha ao atualizar portfólio: ${error.message}`)

  // Sem linha afetada = o banco (RLS) não permitiu ou o prestador não existe.
  if (!data || data.length === 0) throw new Error('Nenhuma linha foi atualizada. Prestador não encontrado.')

  return data[0]
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
