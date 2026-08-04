//services/painelCliente.service.ts 

import { supabase } from '@/lib/supabase'

const SELECT_SERVICOS = `
  *,
  prestadores (nome, foto_perfil, whatsapp, categoria:categorias(nome)),
  portfolio_fotos (*)
`

// FIX: 'finalizado' é o valor real de portfolio_projetos.status (ver
// 03-banco-de-dados.md). 'concluido' nunca existiu como valor gravado —
// as duas queries abaixo excluíam projetos finalizados dos resultados por
// completo, não só da classificação de UI (esse bug já foi corrigido em
// PainelDoCliente.tsx, mas a causa raiz estava aqui: um projeto finalizado
// nem chegava a ser buscado do banco).
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

export async function getServicosPorWhatsapp(whatsapp: string) {
  const { data } = await supabase
    .from('portfolio_projetos')
    .select(SELECT_SERVICOS)
    .eq('cliente_whatsapp', whatsapp.replace(/\D/g, ''))
    .in('status', STATUS_VISIVEIS)
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
