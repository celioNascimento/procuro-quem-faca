import { supabase } from '@/lib/supabase'

export async function fetchClienteProfile(userId: string) {
  const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle()
  if (error) throw error
  return data
}

export async function fetchClienteServicos(whatsapp: string) {
  const numLimpo = whatsapp.replace(/\D/g, '')
  const { data, error } = await supabase
    .from('portfolio_projetos')
    .select(`
      id, titulo, status, created_at, avaliacao_token,
      portfolio_fotos(ordem),
      prestadores!inner(nome, foto_perfil, categoria:categorias(nome)),
      avaliacoes(id)
    `)
    .eq('cliente_whatsapp', numLimpo)
    .in('status', ['pendente', 'em_execucao', 'finalizado', 'concluido'])
  if (error) throw error
  return data
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

export async function deleteClienteAccount(userId: string, whatsapp: string) {
  const numLimpo = whatsapp.replace(/\D/g, '')
  if (numLimpo) {
    await supabase
      .from('portfolio_projetos')
      .update({ cliente_nome: 'Cliente removido', cliente_whatsapp: null })
      .eq('cliente_whatsapp', numLimpo)
  }
  await supabase.from('profiles').delete().eq('id', userId)
  await fetch('/api/delete-account', { method: 'POST' })
  await supabase.auth.signOut()
}

export async function ensureGoogleAvatarProfile(userId: string, googleAvatar: string, currentAvatarUrl?: string) {
  if (!currentAvatarUrl && googleAvatar) {
    await supabase.from('profiles').upsert({
      id: userId,
      avatar_url: googleAvatar,
      updated_at: new Date().toISOString()
    }).then(() => {}) 
  }
}