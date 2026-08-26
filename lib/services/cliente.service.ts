// lib/services/cliente.service.ts

import { supabase } from '@/lib/supabase'
import type { ClienteServico } from '@/types/clienteServicos'

// Status de solicitacoes_garantia considerados ativos — mesmo critério de
// painelCliente.service.ts, centralizado aqui para evitar divergência.
export const STATUS_GARANTIA_ATIVOS = ['aguardando_aceite_cliente', 'aberta', 'respondida']

// LEFT JOIN em solicitacoes_garantia: traz array vazio quando não há garantia,
// em vez de excluir a linha. Elimina a necessidade de fetchClienteGarantias
// separado e o risco de dessincronia entre dois arrays de origens diferentes.
const SELECT_CLIENTE_SERVICOS = `
  id, titulo, status, created_at, avaliacao_token,
  portfolio_fotos(ordem),
  prestadores!inner(id, nome, foto_perfil, whatsapp, categoria:categorias(nome)),
  avaliacoes(id),
  solicitacoes_garantia(id, status, origem, prazo_resposta)
`

export async function fetchClienteProfile(userId: string) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle()
  if (error) throw error
  return data
}

/**
 * Busca todos os projetos do cliente por whatsapp — garantias derivadas
 * localmente via temGarantiaAtiva(), sem query separada.
 */
export async function fetchClienteServicos(whatsapp: string): Promise<ClienteServico[]> {
  const numLimpo = whatsapp.replace(/\D/g, '')
  const { data, error } = await supabase
    .from('portfolio_projetos')
    .select(SELECT_CLIENTE_SERVICOS)
    .eq('cliente_whatsapp', numLimpo)
    .in('status', ['pendente', 'em_execucao', 'finalizado'])
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as unknown as ClienteServico[]
}

/**
 * Deriva se um projeto tem garantia ativa a partir do array já embutido —
 * não faz consulta separada. Cada ClienteServico carrega sua própria resposta.
 */
export function temGarantiaAtiva(servico: ClienteServico): boolean {
  return (servico.solicitacoes_garantia ?? []).some(g =>
    STATUS_GARANTIA_ATIVOS.includes(g.status)
  )
}

export async function fetchEstados() {
  const { data, error } = await supabase
    .from('estados')
    .select('sigla, nome')
    .order('nome')
  if (error) throw error
  return data
}

export async function fetchCidades(uf: string) {
  const { data, error } = await supabase
    .from('cidades')
    .select('nome')
    .eq('estado_sigla', uf)
    .eq('ativa', true)
    .order('nome')
  if (error) throw error
  return data
}

export async function updateClienteProfile(userId: string, profileData: any) {
  const { error } = await supabase.from('profiles').upsert({
    id: userId,
    ...profileData,
    updated_at: new Date().toISOString(),
  })
  if (error) throw error
}

export async function uploadClienteAvatar(
  userId: string,
  file: File,
  currentAvatarUrl?: string,
) {
  if (currentAvatarUrl) {
    try {
      const bucketMarker = '/object/public/fotos-perfil/'
      const markerIdx = currentAvatarUrl.indexOf(bucketMarker)
      if (markerIdx !== -1) {
        const oldPath = currentAvatarUrl
          .slice(markerIdx + bucketMarker.length)
          .split('?')[0]
        if (oldPath) await supabase.storage.from('fotos-perfil').remove([oldPath])
      }
    } catch { /* silencioso */ }
  }

  const fileExt = file.name.split('.').pop()
  const fileName = `${userId}-${Date.now()}.${fileExt}`
  const { error: uploadError } = await supabase.storage
    .from('fotos-perfil')
    .upload(fileName, file)
  if (uploadError) throw uploadError

  const { data: { publicUrl } } = supabase.storage
    .from('fotos-perfil')
    .getPublicUrl(fileName)

  const { error: dbError } = await supabase
    .from('profiles')
    .update({ avatar_url: publicUrl, updated_at: new Date().toISOString() })
    .eq('id', userId)
  if (dbError) throw dbError

  return publicUrl
}

// deleteClienteAccount cuida apenas da limpeza de dados de domínio.
// A remoção do usuário de auth.users é feita pelo chamador via /api/delete-account.
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
