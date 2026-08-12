// lib/services/adminAnuncios.service.ts
// (Substitua a função verificarInventarioSegmento no final do seu arquivo atual por esta)

/**
 * Consulta em tempo real a disponibilidade de inventário para uma segmentação.
 * Calcula 1 vaga a cada 4 prestadores e subtrai os anúncios que já estão rodando.
 * Caso esteja lotado, retorna a data de expiração mais próxima para agendamento.
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
    return { vagasTotais: 0, vagasDisponiveis: 0, totalPrestadores: 0, ocupados: 0, proximaExpiracao: null }
  }

  // 2. Busca anúncios ativos e suas datas de expiração
  const agora = new Date().toISOString()
  const { data: anunciosAtivos, error: erroAnuncios } = await supabase
    .from('anuncios_segmentacoes')
    .select(`
      anuncios!inner(id, data_expiracao)
    `)
    .eq('cidade_id', cidadeId)
    .eq('categoria_id', categoriaId)
    .eq('anuncios.status', true)
    .eq('anuncios.status_aprovacao', 'aprovado')
    .eq('anuncios.posicao', posicao)
    .or(`data_inicio.is.null,data_inicio.lte.${agora}`, { foreignTable: 'anuncios' })
    .or(`data_expiracao.is.null,data_expiracao.gte.${agora}`, { foreignTable: 'anuncios' })

  if (erroAnuncios) {
    console.error('Erro ao buscar anúncios ocupados:', erroAnuncios)
    return { vagasTotais: 0, vagasDisponiveis: 0, totalPrestadores: 0, ocupados: 0, proximaExpiracao: null }
  }

  const prestadores = totalPrestadores || 0
  
  // Usamos um Set para contar anúncios únicos (evitando duplicidade do join)
  const idsUnicos = new Set(anunciosAtivos?.map((a: any) => a.anuncios.id))
  const ocupados = idsUnicos.size

  const vagasTotais = Math.floor(prestadores / 4)
  const vagasDisponiveis = Math.max(0, vagasTotais - ocupados)

  // 3. Descobre quando a próxima vaga abre (se houver anúncios com data de expiração)
  let proximaExpiracao: string | null = null
  if (anunciosAtivos && anunciosAtivos.length > 0) {
    const datas = anunciosAtivos
      .map((a: any) => a.anuncios.data_expiracao)
      .filter(Boolean)
      .map((d: string) => new Date(d).getTime())
    
    if (datas.length > 0) {
      proximaExpiracao = new Date(Math.min(...datas)).toISOString()
    }
  }

  return {
    totalPrestadores: prestadores,
    vagasTotais,
    vagasDisponiveis,
    ocupados,
    proximaExpiracao
  }
}
