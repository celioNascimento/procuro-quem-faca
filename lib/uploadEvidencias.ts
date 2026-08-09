//lib/uploadEvidencias.ts

import { supabase } from '@/lib/supabase'

const BUCKET = 'evidencias-contestacao'
const MAX_KB = 10240
const MAX_ARQUIVOS = 5

export type UploadArquivoResult =
  | { ok: true; url: string; file: File }
  | { ok: false; error: 'TOO_LARGE'; sizeMB: number; file: File }
  | { ok: false; error: 'UPLOAD_FAILED'; file: File }

export interface UploadEvidenciasResult {
  urls: string[]
  falhas: UploadArquivoResult[]
}

function extrairPathDoBucket(url: string, bucket: string): string | null {
  const marker = `/object/public/${bucket}/`
  const idx = url.indexOf(marker)
  if (idx === -1) return null
  return url.slice(idx + marker.length).split('?')[0] || null
}

export async function removerEvidencias(urls: string[]): Promise<void> {
  const paths = urls
    .map((url) => extrairPathDoBucket(url, BUCKET))
    .filter((p): p is string => p !== null)

  if (paths.length > 0) {
    await supabase.storage.from(BUCKET).remove(paths).catch(() => {})
  }
}

async function uploadUmArquivo(
  arquivo: File,
  contestacaoId: string,
  index: number
): Promise<UploadArquivoResult> {
  const fileSizeKB = arquivo.size / 1024

  if (fileSizeKB > MAX_KB) {
    return { ok: false, error: 'TOO_LARGE', sizeMB: fileSizeKB / 1024, file: arquivo }
  }

  const ext = arquivo.name.split('.').pop()
  const fileName = `${contestacaoId}/${index}-${Date.now()}.${ext}`

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(fileName, arquivo)

  if (uploadError) return { ok: false, error: 'UPLOAD_FAILED', file: arquivo }

  const { data: { publicUrl } } = supabase.storage.from(BUCKET).getPublicUrl(fileName)

  return { ok: true, url: publicUrl, file: arquivo }
}

export async function uploadEvidencias(
  arquivos: File[],
  contestacaoId: string
): Promise<UploadEvidenciasResult> {
  const limitados = arquivos.slice(0, MAX_ARQUIVOS)

  const resultados = await Promise.all(
    limitados.map((arquivo, i) => uploadUmArquivo(arquivo, contestacaoId, i))
  )

  return {
    urls: resultados.filter((r): r is Extract<UploadArquivoResult, { ok: true }> => r.ok).map((r) => r.url),
    falhas: resultados.filter((r) => !r.ok),
  }
}

export { MAX_ARQUIVOS, MAX_KB }