// lib/services/adminAnuncios.service.ts
// (Mantenha todo o código existente e adicione esta função ao final do arquivo)

/**
 * Consulta em tempo real a disponibilidade de inventário para uma segmentação.
 * Calcula 1 vaga a cada 4 prestadores e subtrai os anúncios que já estão rodando.
 */
export async function verificarInventarioSegmento(
  cidadeId: string,
  categoriaId: string,
  posicao: string
) {
  // 1. Conta quantos prestadores ativos existem nessa cidade e categoria
  const { count: totalPrestadores, error: erroPrestadores } = await supabase
    .from('prestadores')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'ativo')
    .eq('cidade_id', cidadeId)
    .eq('categoria_id', categoriaId)

  if (erroPrestadores) {
    console.error('Erro ao contar prestadores:', erroPrestadores)
    return { vagasTotais: 0, vagasDisponiveis: 0, totalPrestadores: 0 }
  }

  // 2. Conta quantos anúncios ativos já ocupam essa exata posição nesta cidade/categoria
  const agora = new Date().toISOString()
  const { count: anunciosOcupados, error: erroAnuncios } = await supabase
    .from('anuncios_segmentacoes')
    .select(`
      id,
      anuncios!inner(status, status_aprovacao, posicao, data_inicio, data_expiracao)
    `, { count: 'exact', head: true })
    .eq('cidade_id', cidadeId)
    .eq('categoria_id', categoriaId)
    .eq('anuncios.status', true)
    .eq('anuncios.status_aprovacao', 'aprovado')
    .eq('anuncios.posicao', posicao)
    .or(`data_inicio.is.null,data_inicio.lte.${agora}`, { foreignTable: 'anuncios' })
    .or(`data_expiracao.is.null,data_expiracao.gte.${agora}`, { foreignTable: 'anuncios' })

  if (erroAnuncios) {
    console.error('Erro ao contar anúncios ocupados:', erroAnuncios)
    return { vagasTotais: 0, vagasDisponiveis: 0, totalPrestadores: 0 }
  }

  // 3. Aplica a regra de negócio (Ex: 1 anúncio a cada 4 prestadores)
  const prestadores = totalPrestadores || 0
  const ocupados = anunciosOcupados || 0
  
  const vagasTotais = Math.floor(prestadores / 4)
  const vagasDisponiveis = Math.max(0, vagasTotais - ocupados)

  return {
    totalPrestadores: prestadores,
    vagasTotais,
    vagasDisponiveis,
    ocupados
  }
}
