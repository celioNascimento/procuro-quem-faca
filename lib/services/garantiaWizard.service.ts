// lib/services/garantiaWizard.service.ts
//
// Espelha uploadWizard.service.ts, mas para garantia_fotos/garantia_comentarios.
// Diferenças-chave em relação ao original:
//  - sem posições fixas (1/2/3): ordem é sequencial, calculada no insert
//  - autor_tipo por foto (cliente OU prestador podem postar, não só prestador)
//  - sem "criar projeto" embutido: o caso (solicitacoes_garantia) já existe
//    antes do wizard ser aberto

import { supabase } from '@/lib/supabase'

export interface GarantiaFoto {
  id: string
  caso_id: string
  url_foto: string
  ordem: number
  legenda: string | null
  autor_tipo: 'cliente' | 'prestador'
  autor_user_id: string | null
  fase: 'problema' | 'resolucao'
  publica: boolean
  created_at: string
}

export interface GarantiaComentario {
  id: string
  foto_id: string | null
  caso_id: string
  autor_tipo: 'cliente' | 'prestador'
  texto: string
  criado_at: string
  lido: boolean
}

export async function getFotosDoCaso(casoId: string): Promise<GarantiaFoto[]> {
  const { data, error } = await supabase
    .from('garantia_fotos')
    .select('*')
    .eq('caso_id', casoId)
    .order('ordem', { ascending: true })

  if (error) throw error
  return data ?? []
}

export async function getComentariosDoCaso(casoId: string): Promise<GarantiaComentario[]> {
  const { data, error } = await supabase
    .from('garantia_comentarios')
    .select('*')
    .eq('caso_id', casoId)
    .order('criado_at', { ascending: true })

  if (error) throw error
  return data ?? []
}

export async function getComentariosDaFotoGarantia(fotoId: string): Promise<GarantiaComentario[]> {
  const { data, error } = await supabase
    .from('garantia_comentarios')
    .select('*')
    .eq('foto_id', fotoId)
    .order('criado_at', { ascending: true })

  if (error) throw error
  return data ?? []
}

/**
 * Insere nova foto no caso. Ordem é sequencial (próxima posição livre),
 * diferente do wizard original que usa 3 posições fixas.
 * `fase` é obrigatório e explícito — não inferido pelo status do caso.
 */
export async function inserirFotoGarantia(input: {
  caso_id: string
  url_foto: string
  autor_tipo: 'cliente' | 'prestador'
  autor_user_id: string | null
  fase: 'problema' | 'resolucao'
  legenda?: string
}): Promise<GarantiaFoto> {
  const { data: existentes } = await supabase
    .from('garantia_fotos')
    .select('ordem')
    .eq('caso_id', input.caso_id)
    .order('ordem', { ascending: false })
    .limit(1)

  const proximaOrdem = (existentes?.[0]?.ordem ?? -1) + 1

  const { data, error } = await supabase
    .from('garantia_fotos')
    .insert({
      caso_id: input.caso_id,
      url_foto: input.url_foto,
      ordem: proximaOrdem,
      autor_tipo: input.autor_tipo,
      autor_user_id: input.autor_user_id,
      fase: input.fase,
      legenda: input.legenda ?? null,
    })
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Promove as fotos de resolução (fase='resolucao') de um caso para exibição
 * pública, marcando publica=true. Chamado quando o caso fecha como 'resolvida'.
 * Fotos de fase='problema' NUNCA são promovidas — permanecem privadas.
 *
 * Nota: isto marca a flag no banco; a cópia física do arquivo do bucket
 * privado 'garantia' para um bucket/pasta pública (ou geração de URL pública)
 * deve ser feita à parte, conforme a política de storage adotada.
 */
export async function promoverFotosResolucao(casoId: string) {
  const { data, error } = await supabase
    .from('garantia_fotos')
    .update({ publica: true })
    .eq('caso_id', casoId)
    .eq('fase', 'resolucao')
    .select()

  if (error) throw error
  return data ?? []
}

export async function atualizarLegendaFotoGarantia(fotoId: string, legenda: string) {
  const { error } = await supabase
    .from('garantia_fotos')
    .update({ legenda })
    .eq('id', fotoId)

  if (error) throw error
}

/**
 * Insere comentário. foto_id é opcional — permite comentário geral do caso
 * (ex: resposta inicial do prestador sem foto anexada).
 */
export async function inserirComentarioGarantia(input: {
  caso_id: string
  foto_id?: string | null
  autor_tipo: 'cliente' | 'prestador'
  texto: string
}): Promise<GarantiaComentario> {
  const { data, error } = await supabase
    .from('garantia_comentarios')
    .insert({
      caso_id: input.caso_id,
      foto_id: input.foto_id ?? null,
      autor_tipo: input.autor_tipo,
      texto: input.texto,
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function uploadImagemGarantia(filePath: string, file: File): Promise<string> {
  const { error } = await supabase.storage
    .from('garantia') // TODO: confirmar nome do bucket — pode ser o mesmo 'portfolio' já usado
    .upload(filePath, file)

  if (error) throw error

  const { data } = supabase.storage.from('garantia').getPublicUrl(filePath)
  return data.publicUrl
}
