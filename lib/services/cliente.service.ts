// lib/services/cliente.service.ts

import { supabase } from '@/lib/supabase'
import type { ClienteServico } from '@/types/clienteServicos'

export async function fetchClienteProfile(userId: string) {
  const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle()
  if (error) throw error
  return data
}

export async function fetchClienteServicos(whatsapp: string): Promise<ClienteServico[]> {
  const numLimpo = whatsapp.replace(/\D/g, '')
  const { data, error } = await supabase
    .from('portfolio_projetos')
    .select(`
      id, titulo, status, created_at, avaliacao_token,
      portfolio_fotos(ordem),
      prestadores!inner(id, nome, foto_perfil, categoria:categorias(nome)),
      avaliacoes(id)
    `)
    .eq('cliente_whatsapp', numLimpo)
    .in('status', ['pendente', 'em_execucao', 'finalizado'])
  if (error) throw error
  return (data ?? []) as unknown as ClienteServico[]
}

/**
 * Casos de garantia ATIVOS vinculados aos projetos do cliente, buscados por
 * whatsapp — consistente com fetchClienteServicos, que também usa whatsapp
 * (não cliente_user_id) como chave de busca nesta tela.
 *
 * A ligação é indireta: portfolio_projetos.cliente_whatsapp identifica o
 * cliente aqui; solicitacoes_garantia.projeto_id aponta para esses projetos.
 * cliente_user_id em solicitacoes_garantia continua existindo e é usado nas
 * AÇÕES de escrita (abrir, responder, confirmar — ver garantia.service.ts),
 * onde autenticação real é obrigatória; aqui, para leitura/listagem, basta
 * o vínculo por projeto.
 */
export async function fetchClienteGarantias(whatsapp: string): Promise<ClienteServico[]> {
  const numLimpo = whatsapp.replace(/\D/g, '')
  const { data, error } = await supabase
    .from('portfolio_projetos')
    .select(`
      id, titulo, status, created_at, avaliacao_token,
      portfolio_fotos(ordem),
      prestadores!inner(id, nome, foto_perfil, categoria:categorias(nome)),
      avaliacoes(id),
      solicitacoes_garantia!inner(id, status, origem, prazo_resposta)
    `)
    .eq('cliente_whatsapp', numLimpo)
    .in('solicitacoes_garantia.status', ['aguardando_aceite_cliente', 'aberta', 'respondida'])

  if (error) {
    console.error('Erro ao buscar garantias do cliente:', error.message)
    return []
  }
  return (data ?? []) as unknown as ClienteServico[]
}

export async function fetchEstados() {
  const { data, error } = await supabase.from('estados').select('sigla, nome').order('nome')
  if (error) throw error
  return data
}

export async function fetchCidades(uf: string) {
  const { data, error } = await supabase.from('cidades').select('nome').eq('estado_sigla', uf).eq('ativa', true).order('nome')
  if (error) throw error
  return data
}

export async function updateClienteProfile(userId: string, profileData: any) {
  const { error } = await supabase.from('profiles').upsert({
    id: userId,
    ...profileData,
    updated_at: new Date().toISOString()
  })
  if (error) throw error
}

export async function uploadClienteAvatar(userId: string, file: File, currentAvatarUrl?: string) {
  if (currentAvatarUrl) {
    try {
      const bucketMarker = '/object/public/fotos-perfil/'
      const markerIdx = currentAvatarUrl.indexOf(bucketMarker)
      if (markerIdx !== -1) {
        const oldPath = currentAvatarUrl.slice(markerIdx + bucketMarker.length).split('?')[0]
        if (oldPath) await supabase.storage.from('fotos-perfil').remove([oldPath])
      }
    } catch { /* silencioso */ }
  }

  const fileExt = file.name.split('.').pop()
  const fileName = `${userId}-${Date.now()}.${fileExt}`
  const { error: uploadError } = await supabase.storage.from('fotos-perfil').upload(fileName, file)
  if (uploadError) throw uploadError

  const { data: { publicUrl } } = supabase.storage.from('fotos-perfil').getPublicUrl(fileName)

  const { error: dbError } = await supabase.from('profiles').update({
    avatar_url: publicUrl,
    updated_at: new Date().toISOString()
  }).eq('id', userId)

  if (dbError) throw dbError

  return publicUrl
}

// FIX: deleteClienteAccount agora só cuida da limpeza de DADOS (profiles +
// anonimização de projetos). A chamada a /api/delete-account (que remove o
// usuário de auth.users de verdade via service role) é feita pelo chamador
// (usePerfilDados.handleDeleteAccount), não aqui dentro — mantém esta função
// fazendo uma coisa só (limpar dados de domínio) e deixa a decisão de
// "quando invalidar a sessão/conta" com quem orquestra o fluxo.
export async function deleteClienteAccount(userId: string, whatsapp: string) {
  const numLimpo = whatsapp.replace(/\D/g, '')
  if (numLimpo) {
    await supabase
      .from('portfolio_projetos')
      .update({ cliente_nome: 'Cliente removido', cliente_whatsapp: null })
      .eq('cliente_whatsapp', numLimpo)
  }
  await supabase.from('profiles').delete().eq('id', userId)
}
