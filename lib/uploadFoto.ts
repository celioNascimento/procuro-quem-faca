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

export const EXTENSOES: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'image/heic': 'heic',
  'image/heif': 'heif',
}

const TIPO_POR_EXTENSAO: Record<string, string> = {
  jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp',
  gif: 'image/gif', heic: 'image/heic', heif: 'image/heif',
}

// Alguns aparelhos entregam a foto sem tipo (type vazio): aí vale a extensão do nome, mas só se for de imagem.
export function tipoDaImagem(arquivo: File): string | null {
  if (arquivo.type) return EXTENSOES[arquivo.type] ? arquivo.type : null
  const ext = arquivo.name.split('.').pop()?.toLowerCase() ?? ''
  return TIPO_POR_EXTENSAO[ext] ?? null
}

/**
 * Envia a imagem e devolve a URL pública.
 *
 * Não apaga a foto anterior aqui: a nova ainda não foi salva no perfil, e apagar antes deixaria o
 * perfil apontando para um arquivo que não existe (se o envio falhar ou a pessoa sair sem salvar).
 * Quem salva o perfil remove a antiga depois, com removerFotoAntiga.
 */
export async function fazerUploadFoto(
  arquivo: File,
  userId: string,
  bucket = BUCKET
): Promise<UploadResult> {
  const fileSizeKB = arquivo.size / 1024

  if (fileSizeKB > MAX_KB) {
    return { ok: false, error: 'TOO_LARGE', sizeMB: fileSizeKB / 1024 }
  }

  // Só imagens de verdade; a extensão vem do tipo do arquivo, nunca do nome digitado por quem enviou.
  const tipo = tipoDaImagem(arquivo)
  if (!tipo) return { ok: false, error: 'UPLOAD_FAILED' }
  const ext = EXTENSOES[tipo]

  const fileName = `${userId}-${Date.now()}.${ext}`

  const { error: uploadError } = await supabase.storage
    .from(bucket)
    .upload(fileName, arquivo, { contentType: tipo })

  if (uploadError) return { ok: false, error: 'UPLOAD_FAILED' }

  const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(fileName)

  return { ok: true, url: publicUrl }
}
