//lib/uploadFoto.ts

import { supabase } from '@/lib/supabase'

const BUCKET = 'fotos-perfil'
const MAX_KB = 10240

export type UploadResult =
  | { ok: true; url: string }
  | { ok: false; error: 'TOO_LARGE'; sizeMB: number }
  | { ok: false; error: 'UPLOAD_FAILED' }

/** Extrai o path relativo dentro do bucket a partir da URL pública */
function extrairPathDoBucket(url: string, bucket: string): string | null {
  const marker = `/object/public/${bucket}/`
  const idx = url.indexOf(marker)
  if (idx === -1) return null
  return url.slice(idx + marker.length).split('?')[0] || null
}

export async function removerFotoAntiga(fotoUrl: string, bucket = BUCKET): Promise<void> {
  const path = extrairPathDoBucket(fotoUrl, bucket)
  if (path) {
    await supabase.storage.from(bucket).remove([path]).catch(() => {})
  }
}

export async function fazerUploadFoto(
  arquivo: File,
  userId: string,
  fotoAtual?: string,
  bucket = BUCKET
): Promise<UploadResult> {
  const fileSizeKB = arquivo.size / 1024

  if (fileSizeKB > MAX_KB) {
    return { ok: false, error: 'TOO_LARGE', sizeMB: fileSizeKB / 1024 }
  }

  if (fotoAtual) {
    await removerFotoAntiga(fotoAtual, bucket)
  }

  const ext = arquivo.name.split('.').pop()
  const fileName = `${userId}-${Date.now()}.${ext}`

  const { error: uploadError } = await supabase.storage
    .from(bucket)
    .upload(fileName, arquivo)

  if (uploadError) return { ok: false, error: 'UPLOAD_FAILED' }

  const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(fileName)

  return { ok: true, url: publicUrl }
}
