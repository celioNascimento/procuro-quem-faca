import { supabase } from './supabase'

/**
 * Função universal para registrar logs de atividades
 * @param {string} acao - Nome da ação (ex: 'BUSCA_REALIZADA', 'PERFIL_VISUALIZADO')
 * @param {Object} opcoes - Objeto contendo detalhes, entidade e usuario
 */
export async function registrarLog(acao, { 
  detalhes = {}, 
  entidade_tipo = null, 
  entidade_id = null, 
  usuario_email = null,
  usuario_id = null 
} = {}) {
  try {
    const { error } = await supabase
      .from('logs_atividades')
      .insert([
        {
          acao,
          detalhes,
          entidade_tipo,
          entidade_id,
          usuario_email,
          usuario_id,
          // O ip_address pode ser coletado via API externa se necessário, 
          // ou deixado para o backend/edge functions.
        }
      ]);

    if (error) throw error;
  } catch (error) {
    // Usamos um log silencioso no console para não interromper a experiência do usuário
    console.warn('Erro ao registrar log de atividade:', error.message);
  }
}