//lib/services/consentimento.service.ts

import { supabase } from '@/lib/supabase'
import {
  CONSENTIMENTOS_OBRIGATORIOS,
  VERSAO_DOCUMENTOS,
  type OrigemConsentimento,
  type TipoConsentimento,
} from '@/config/documentos'

// Tipos obrigatórios que o usuário já aceitou na versão atual dos documentos
export async function buscarTiposAceitos(
  userId: string,
  versao: string = VERSAO_DOCUMENTOS,
): Promise<TipoConsentimento[]> {
  const { data, error } = await supabase
    .from('consentimentos')
    .select('tipo')
    .eq('user_id', userId)
    .eq('versao_documento', versao)
    .eq('concedido', true)
    .in('tipo', [...CONSENTIMENTOS_OBRIGATORIOS])
  if (error) throw error

  const aceitos = new Set((data ?? []).map(linha => linha.tipo as TipoConsentimento))
  return CONSENTIMENTOS_OBRIGATORIOS.filter(tipo => aceitos.has(tipo))
}

export function faltaAceitar(tiposAceitos: TipoConsentimento[]): boolean {
  return CONSENTIMENTOS_OBRIGATORIOS.some(tipo => !tiposAceitos.includes(tipo))
}

interface RegistrarParams {
  userId: string
  origem: OrigemConsentimento
  tipos?: readonly TipoConsentimento[]
  prestadorId?: number | null
  versao?: string
}

// Grava um registro por tipo aceito, com a versão do documento e a origem do aceite
export async function registrarConsentimentos({
  userId,
  origem,
  tipos = CONSENTIMENTOS_OBRIGATORIOS,
  prestadorId = null,
  versao = VERSAO_DOCUMENTOS,
}: RegistrarParams): Promise<void> {
  const linhas = tipos.map(tipo => ({
    user_id: userId,
    prestador_id: prestadorId,
    tipo,
    versao_documento: versao,
    concedido: true,
    origem,
  }))
  const { error } = await supabase.from('consentimentos').insert(linhas)
  if (error) throw error
}
