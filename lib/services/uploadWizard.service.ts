import { supabase } from '@/lib/supabase'
import { FotoPortfolio, ComentarioPortfolio, ProjetoIdentificado } from '@/types/portfolio'

export async function getPrestadorBaseInfo(prestadorId: number) {
  const { data, error } = await supabase
    .from('prestadores')
    .select('nome, foto_perfil, whatsapp, slug')  // ✅ slug adicionado
    .eq('id', prestadorId)
    .single()

  if (error) throw error
  return data
}

export async function getFotosDoProjeto(projetoId: string) {
  const { data, error } = await supabase
    .from('portfolio_fotos')
    .select('*')
    .eq('projeto_id', projetoId)

  if (error) throw error
  return data as FotoPortfolio[]
}

export async function getComentariosDaFoto(fotoId: string) {
  const { data, error } = await supabase
    .from('portfolio_comentarios')
    .select('*')
    .eq('foto_id', fotoId)
    .eq('autor_tipo', 'cliente')
    .order('criado_at', { ascending: true })

  if (error) throw error
  return data as ComentarioPortfolio[]
}

export async function buscarProjetosPorTelefone(prestadorId: number, clienteWhatsappLimpo: string) {
  const { data, error } = await supabase
    .from('portfolio_projetos')
    .select('id, titulo, status, cliente_nome, created_at')
    .eq('prestador_id', prestadorId)
    .eq('cliente_whatsapp', clienteWhatsappLimpo)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data as ProjetoIdentificado[]
}

export async function criarNovoProjeto(payload: {
  prestador_id: number
  titulo: string
  cliente_whatsapp: string
  cliente_nome: string
  status: string
  avaliacao_token: string
}) {
  const { data, error } = await supabase
    .from('portfolio_projetos')
    .insert(payload)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function atualizarStatusProjeto(projetoId: string, status: string) {
  const { error } = await supabase
    .from('portfolio_projetos')
    .update({ status })
    .eq('id', projetoId)

  if (error) throw error
}

export async function atualizarTituloProjeto(projetoId: string, titulo: string) {
  const { error } = await supabase
    .from('portfolio_projetos')
    .update({ titulo })
    .eq('id', projetoId)

  if (error) throw error
}

export async function upsertFotoProjeto(payload: {
  projeto_id: string
  url_foto: string
  ordem: number
  prestador_id: number
}) {
  const { data, error } = await supabase
    .from('portfolio_fotos')
    .upsert(payload, { onConflict: 'projeto_id, ordem' })
    .select()
    .single()

  if (error) throw error
  return data as FotoPortfolio
}

export async function atualizarLegendaFoto(fotoId: string, legenda: string) {
  const { error } = await supabase
    .from('portfolio_fotos')
    .update({ legenda })
    .eq('id', fotoId)

  if (error) throw error
}

export async function getStatusETokenProjeto(projetoId: string) {
  const { data, error } = await supabase
    .from('portfolio_projetos')
    .select('status, avaliacao_token')
    .eq('id', projetoId)
    .single()

  if (error) throw error
  return data
}

export async function uploadImagemPortfolio(filePath: string, file: File) {
  const { error: uploadError } = await supabase.storage
    .from('portfolios')
    .upload(filePath, file)

  if (uploadError) throw uploadError

  const { data: { publicUrl } } = supabase.storage
    .from('portfolios')
    .getPublicUrl(filePath)

  return publicUrl
}