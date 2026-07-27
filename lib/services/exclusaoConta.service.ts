import { supabase } from '@/lib/supabase'

export async function removerFotoPrestador(fotoUrl: string) {
  try {
    const bucketMarker = '/object/public/fotos-perfil/'
    const markerIdx = fotoUrl.indexOf(bucketMarker)
    if (markerIdx !== -1) {
      const oldPath = fotoUrl.slice(markerIdx + bucketMarker.length).split('?')[0]
      if (oldPath) await supabase.storage.from('fotos-perfil').remove([oldPath])
    }
  } catch {
    /* silencioso — mesmo comportamento do EditarPerfilTab original */
  }
}

export async function deletarPrestadorPorUserId(userId: string) {
  const { error } = await supabase.from('prestadores').delete().eq('user_id', userId)
  if (error) throw error
}