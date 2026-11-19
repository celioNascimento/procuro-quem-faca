// lib/services/documentosVerificacao.service.ts
// Seguro e CND: o prestador envia o comprovante para uma área privada e a equipe confere.
// Uma função por operação; as regras de verdade ficam no banco.

import { supabase } from '@/lib/supabase'
import { caminhoDoArquivo, type DadosSeguro, type TipoDocumento, type VerificacaoDocumento } from '@/lib/selos/documentos'

const BUCKET = 'verificacoes-docs'

export async function buscarMeuDocumento(prestadorId: number, tipo: TipoDocumento): Promise<VerificacaoDocumento | null> {
  const { data, error } = await supabase
    .from('prestador_verificacoes')
    .select('status, valido_ate, dados')
    .eq('prestador_id', prestadorId)
    .eq('tipo', tipo)
    .maybeSingle()
  if (error) throw error
  return (data as VerificacaoDocumento | null) ?? null
}

/** Sobe o arquivo e registra o pedido. Se o registro falhar, apaga o arquivo para não deixar lixo. */
export async function enviarDocumento(tipo: TipoDocumento, arquivo: File, seguro?: DadosSeguro): Promise<void> {
  const { data: sessao } = await supabase.auth.getUser()
  const userId = sessao.user?.id
  if (!userId) throw new Error('Entre na sua conta para enviar o comprovante.')

  const caminho = caminhoDoArquivo(userId, tipo, arquivo.name)
  const envio = await supabase.storage.from(BUCKET).upload(caminho, arquivo, { upsert: false, contentType: arquivo.type })
  if (envio.error) throw envio.error

  const dados = seguro
    ? { seguradora: seguro.seguradora, numero_apolice: seguro.numeroApolice, validade_informada: seguro.validade }
    : {}
  const { error } = await supabase.rpc('enviar_documento_verificacao', { p_tipo: tipo, p_dados: dados, p_arquivo: caminho })
  if (error) {
    await supabase.storage.from(BUCKET).remove([caminho])
    throw error
  }
}

// --- Equipe (admin) ---

export interface DocumentoAdmin {
  verificacao_id: string
  prestador_id: number
  prestador_nome: string
  prestador_slug: string
  tipo: TipoDocumento
  status: string
  dados: Record<string, unknown>
  valido_ate: string | null
  criado_em: string
  verificado_em: string | null
  /** CNPJ do perfil (já cadastrado), para a equipe comparar com o titular do documento. */
  cnpj: string | null
  razao_social: string | null
}

export async function fetchFilaDocumentos(filtro: 'pendentes' | 'aprovadas' | 'rejeitadas'): Promise<DocumentoAdmin[]> {
  const { data, error } = await supabase.rpc('admin_fila_documentos', { p_filtro: filtro })
  if (error) throw error
  return (data as DocumentoAdmin[] | null) ?? []
}

/** Link temporário (5 min) para o admin abrir o comprovante. */
export async function linkDoComprovante(caminho: string): Promise<string> {
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(caminho, 300)
  if (error || !data) throw error ?? new Error('Sem link')
  return data.signedUrl
}

/** Decide e, depois da decisão, apaga o comprovante (guardamos só o resumo e a validade). */
export async function decidirDocumento(
  id: string,
  decisao: 'aprovada' | 'rejeitada',
  opcoes: { motivo?: string; validoAte?: string; emissao?: string } = {},
): Promise<void> {
  const { data, error } = await supabase.rpc('admin_decidir_documento', {
    p_verificacao_id: id,
    p_decisao: decisao,
    p_motivo: opcoes.motivo?.trim() || null,
    p_valido_ate: opcoes.validoAte || null,
    p_emissao: opcoes.emissao || null,
  })
  if (error) throw error
  if (typeof data === 'string' && data) await supabase.storage.from(BUCKET).remove([data])
}
