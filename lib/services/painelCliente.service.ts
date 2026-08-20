//services/painelCliente.service.ts

 import { supabase } from '@/lib/supabase'

// Adicionado o user_id no retorno de prestadores para permitir o filtro.
// solicitacoes_garantia é LEFT JOIN (sem !inner) — traz o array vazio []
// quando o projeto não tem nenhum caso de garantia, em vez de excluir a
// linha. Isso é o que permite saber, dentro do MESMO objeto de projeto,
// se ele tem garantia ativa — sem precisar de uma segunda consulta
// separada e comparar arrays por id depois (fonte de bugs sutis se os
// tipos/formatos de id não baterem entre as duas queries).
const SELECT_SERVICOS = `
  *,
  prestadores (id, user_id, nome, foto_perfil, whatsapp, categoria:categorias(nome)),
  portfolio_fotos (*),
  solicitacoes_garantia (id, status, origem, prazo_resposta)
`

const STATUS_VISIVEIS = ['em_registro', 'pendente', 'em_execucao', 'finalizado']

// Status de solicitacoes_garantia considerados "ativos" — casos já resolvidos
// ou recusados não contam como garantia ativa (voltam a contar como Concluídos).
const STATUS_GARANTIA_ATIVOS = ['aguardando_aceite_cliente', 'aberta', 'respondida']

/**
 * Deriva se um serviço tem garantia ativa a partir do array
 * solicitacoes_garantia já embutido nele pelo join — não faz consulta
 * nem comparação externa. Cada Servico carrega sua própria resposta.
 */
export function temGarantiaAtiva(servico: { solicitacoes_garantia?: { status: string }[] }): boolean {
  return (servico.solicitacoes_garantia ?? []).some(g => STATUS_GARANTIA_ATIVOS.includes(g.status))
}

export async function getProfile(userId: string) {
  const { data } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle()
  return data
}

export async function getServicoPorToken(token: string) {
  const { data } = await supabase
    .from('portfolio_projetos')
    .select(SELECT_SERVICOS)
    .eq('avaliacao_token', token)
    .in('status', STATUS_VISIVEIS)
    .maybeSingle()
  return data ? [data] : []
}

// Nova função usando a coluna que já existe no banco
export async function getServicosPorUserId(userId: string) {
  const { data } = await supabase
    .from('portfolio_projetos')
    .select(SELECT_SERVICOS)
    .eq('cliente_user_id', userId)
    .in('status', STATUS_VISIVEIS)
    .order('created_at', { ascending: false })
  return data ?? []
}

export async function getServicosPorWhatsapp(whatsapp: string) {
  const { data } = await supabase
    .from('portfolio_projetos')
    .select(SELECT_SERVICOS)
    .eq('cliente_whatsapp', whatsapp.replace(/\D/g, ''))
    .in('status', STATUS_VISIVEIS)
    .order('created_at', { ascending: false })
  return data ?? []
}

/**
 * Projetos do cliente que têm um caso de garantia ATIVO agora —
 * derivado diretamente do array já embutido nos serviços (temGarantiaAtiva),
 * sem consulta separada. Mantida como função por conveniência de uso nos
 * hooks, mas agora é um filtro local, não uma query própria.
 */
export function filtrarComGarantiaAtiva<T extends { solicitacoes_garantia?: { status: string }[] }>(
  servicos: T[],
): T[] {
  return servicos.filter(temGarantiaAtiva)
}

export async function aceitarServico(
  servicoId: string,
  nomeCliente: string,
  clienteUserId?: string,
) {
  const { error } = await supabase
    .from('portfolio_projetos')
    .update({
      status: 'em_execucao',
      aceito_at: new Date().toISOString(),
      cliente_nome: nomeCliente,
      // Vínculo forte no exato momento em que o cliente confirma que é ele
      // mesmo (clicou no link recebido via WhatsApp e está logado) — esta é
      // a âncora que o "Efeito Espelho" (ver glossário) foi desenhada para
      // usar, mas que nunca era preenchida em nenhum ponto de escrita real.
      ...(clienteUserId ? { cliente_user_id: clienteUserId } : {}),
    })
    .eq('id', servicoId)

  if (error) throw error
}

export async function loginComGoogle(tokenUrl: string | null) {
  const base = typeof window !== 'undefined' ? window.location.origin : ''
  const redirectTo = tokenUrl
    ? `${base}/meus-servicos?token=${tokenUrl}`
    : `${base}/meus-servicos`

  await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo } })
}
