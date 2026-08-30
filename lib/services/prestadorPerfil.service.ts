import { supabase } from '@/lib/supabase'
import { Prestador } from '@/types/prestador'

/**
 * Atualizar a configuração de portfólio obrigatório do prestador
 */
export async function updatePortfolioObrigatorio(
  prestadorId: number,
  obrigatorio: boolean,
) {
  console.log(`🎯 Iniciando atualização: prestadorId=${prestadorId}, portfolio_obrigatorio=${obrigatorio}`)
  
  const { data, error } = await supabase
    .from('prestadores')
    .update({ portfolio_obrigatorio: obrigatorio })
    .eq('id', prestadorId)
    .select('id, portfolio_obrigatorio')

  console.log('📤 Resposta do Supabase:', { data, error })

  if (error) {
    console.error('❌ Erro ao atualizar:', error)
    throw new Error(`Falha ao atualizar portfólio: ${error.message}`)
  }
  
  if (!data || data.length === 0) {
    console.warn('⚠️ Nenhuma linha foi atualizada. Verifique se o prestadorId existe:', prestadorId)
    throw new Error('Nenhuma linha foi atualizada. Prestador não encontrado.')
  }
  
  console.log('✅ Atualização bem-sucedida:', data[0])
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
