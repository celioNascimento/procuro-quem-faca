import { supabase } from '@/lib/supabase'

const SELECT_SERVICOS = `
  *,
  prestadores (nome, foto_perfil, whatsapp, categoria:categorias(nome)),
  portfolio_fotos (*)
`

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
    .in('status', ['em_registro', 'pendente', 'em_execucao', 'concluido'])
    .maybeSingle()
  return data ? [data] : []
}

export async function getServicosPorWhatsapp(whatsapp: string) {
  const { data } = await supabase
    .from('portfolio_projetos')
    .select(SELECT_SERVICOS)
    .eq('cliente_whatsapp', whatsapp.replace(/\D/g, ''))
    .in('status', ['em_registro', 'pendente', 'em_execucao', 'concluido'])
    .order('created_at', { ascending: false })
  return data ?? []
}

// ✅ Apenas dois parâmetros — avaliacaoToken removido (navegação é responsabilidade do hook)
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

export async function logout() {
  await supabase.auth.signOut()
}