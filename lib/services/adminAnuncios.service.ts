//lib/services/adminAnuncios.service.ts

import { createClient } from '@/lib/supabase/client' // ajustar import conforme o client já usado no projeto

const supabase = createClient()

export type AnuncioComAnunciante = {
  id: string
  status: boolean
  tipo: string
  titulo: string
  link_destino: string | null
  imagem_url: string | null
  posicao: string
  categoria_id: string | null
  cidade_id: string | null
  publico_alvo: string
  status_aprovacao: string
  anunciante_id: string
  created_at: string
  anunciantes: {
    id: string
    razao_social: string
    whatsapp: string | null
  } | null
}

export type NovoAnuncioInput = {
  anuncianteId: string
  titulo: string
  linkDestino: string
  imagemUrl: string
  posicao: string // 'topo_busca' | 'entre_cards' | 'topo_perfil'
  categoriaId: string | null
  cidadeId: string | null
  ativo: boolean
}

/**
 * Cria/atualiza um Customer no Asaas está FORA de escopo aqui — este MVP
 * não usa cobrança. status_aprovacao nasce 'aprovado' porque quem cadastra é
 * o admin (curadoria já acontece no ato do cadastro, ver documentacao/11-anuncios.md).
 */
export async function criarAnuncio(input: NovoAnuncioInput) {
  const { data, error } = await supabase
    .from('anuncios')
    .insert({
      anunciante_id: input.anuncianteId,
      titulo: input.titulo,
      link_destino: input.linkDestino,
      imagem_url: input.imagemUrl,
      posicao: input.posicao,
      categoria_id: input.categoriaId,
      cidade_id: input.cidadeId,
      tipo: 'proprio',
      status: input.ativo,
      status_aprovacao: 'aprovado',
      publico_alvo: 'todos',
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function atualizarAnuncio(id: string, input: Partial<NovoAnuncioInput>) {
  const payload: Record<string, unknown> = {}
  if (input.titulo !== undefined) payload.titulo = input.titulo
  if (input.linkDestino !== undefined) payload.link_destino = input.linkDestino
  if (input.imagemUrl !== undefined) payload.imagem_url = input.imagemUrl
  if (input.posicao !== undefined) payload.posicao = input.posicao
  if (input.categoriaId !== undefined) payload.categoria_id = input.categoriaId
  if (input.cidadeId !== undefined) payload.cidade_id = input.cidadeId
  if (input.ativo !== undefined) payload.status = input.ativo

  const { data, error } = await supabase.from('anuncios').update(payload).eq('id', id).select().single()
  if (error) throw error
  return data
}

export async function alternarStatusAnuncio(id: string, ativo: boolean) {
  const { data, error } = await supabase.from('anuncios').update({ status: ativo }).eq('id', id).select().single()
  if (error) throw error
  return data
}

export async function excluirAnuncio(id: string) {
  const { error } = await supabase.from('anuncios').delete().eq('id', id)
  if (error) throw error
}

export async function listarAnuncios(): Promise<AnuncioComAnunciante[]> {
  const { data, error } = await supabase
    .from('anuncios')
    .select('*, anunciantes(id, razao_social, whatsapp)')
    .order('created_at', { ascending: false })

  if (error) throw error
  return data as AnuncioComAnunciante[]
}

/**
 * Chama a API route que cria o usuário Auth (ou reaproveita um existente por
 * e-mail) e o registro em anunciantes. Usa service role no servidor —
 * por isso passa pela API route em vez de chamar Supabase direto do client.
 */
export async function criarOuBuscarAnunciante(input: {
  email: string
  razaoSocial: string
  cnpjCpf?: string
  whatsapp?: string
}) {
  const res = await fetch('/api/admin/anunciantes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error ?? 'Erro ao criar anunciante')
  return data as { anunciante: any; senhaTemporaria: string | null; novoUsuario: boolean }
}

/**
 * Upload da imagem do banner para o bucket dedicado 'anuncios-banners'
 * (separado do bucket de fotos de projeto — ver decisão em conversa com Célio,
 * motivo: policies e ciclo de vida diferentes).
 */
export async function uploadBannerAnuncio(file: File, anuncianteId: string) {
  const extensao = file.name.split('.').pop()
  const nomeArquivo = `${anuncianteId}/${Date.now()}.${extensao}`

  const { error } = await supabase.storage.from('anuncios-banners').upload(nomeArquivo, file, {
    cacheControl: '3600',
    upsert: false,
  })
  if (error) throw error

  const { data: urlData } = supabase.storage.from('anuncios-banners').getPublicUrl(nomeArquivo)
  return urlData.publicUrl
}
