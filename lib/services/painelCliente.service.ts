//services/painelCliente.service.ts

import { supabase } from '@/lib/supabase'

const SELECT_SERVICOS = `
  *,
  prestadores (nome, foto_perfil, whatsapp, categoria:categorias(nome)),
  portfolio_fotos (*)
`

const STATUS_VISIVEIS = ['em_registro', 'pendente', 'em_execucao', 'finalizado']

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

// NOVO: Busca blindada pelo ID do Cliente logado
export async function getServicosPorUserId(userId: string) {
  const { data } = await supabase
    .from('portfolio_projetos')
    .select(SELECT_SERVICOS)
    .eq('cliente_user_id', userId) // ← Usa a âncora forte (ajuste este nome da coluna se diferir do banco)
    .in('status', STATUS_VISIVEIS)
    .order('created_at', { ascending: false })
  return data ?? []
}

// MANTIDA para legacy ou clientes não logados (mas evitada sempre que possível)
export async function getServicosPorWhatsapp(whatsapp: string) {
  const { data } = await supabase
    .from('portfolio_projetos')
    .select(SELECT_SERVICOS)
    .eq('cliente_whatsapp', whatsapp.replace(/\D/g, ''))
    .in('status', STATUS_VISIVEIS)
    .order('created_at', { ascending: false })
  return data ?? []
}

export async function aceitarServico(
  servicoId: string,
  nomeCliente: string,
) {
  const { error } = await supabase
    .from('portfolio_projetos')
    .update({
      status: 'em_execucao',
      aceito_at: new Date().toISOString(),
      cliente_nome: nomeCliente,
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
