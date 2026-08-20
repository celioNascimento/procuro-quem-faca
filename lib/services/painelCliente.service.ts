//services/painelCliente.service.ts

import { supabase } from '@/lib/supabase'

// Adicionado o user_id no retorno de prestadores para permitir o filtro
const SELECT_SERVICOS = `
  *,
  prestadores (id, user_id, nome, foto_perfil, whatsapp, categoria:categorias(nome)),
  portfolio_fotos (*)
`

const STATUS_VISIVEIS = ['em_registro', 'pendente', 'em_execucao', 'finalizado']

// Status de solicitacoes_garantia considerados "ativos" — casos já resolvidos
// ou recusados não aparecem na aba Garantia (voltam a contar como Concluídos).
const STATUS_GARANTIA_ATIVOS = ['aguardando_aceite_cliente', 'aberta', 'respondida']

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
 * Projetos do cliente que têm um caso de garantia ATIVO agora
 * (aguardando_aceite_cliente | aberta | respondida).
 * Casos resolvidos/sem_resposta/recusados não aparecem aqui — o projeto
 * volta a contar normalmente como 'Concluído'.
 *
 * Nota: como solicitacoes_garantia.status já filtra por "ativo", não
 * aplicamos STATUS_VISIVEIS aqui — um projeto com garantia ativa é, por
 * definição, um projeto finalizado (garantia só existe pós-conclusão).
 */
export async function getServicosComGarantiaAtiva(userId: string) {
  const { data, error } = await supabase
    .from('portfolio_projetos')
    .select(`
      ${SELECT_SERVICOS},
      solicitacoes_garantia!inner (id, status, origem, prazo_resposta)
    `)
    .eq('cliente_user_id', userId)
    .in('solicitacoes_garantia.status', STATUS_GARANTIA_ATIVOS)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Erro ao buscar serviços com garantia ativa:', error)
    return []
  }
  return data ?? []
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
