// lib/services/adminVerificacoes.service.ts
// Fila de revisão do CNPJ (painel admin). Uma função por operação; a regra fica no banco.

import { supabase } from '@/lib/supabase'
import type { FiltroVerificacoes, VerificacaoCnpjAdmin } from '@/types/verificacoesAdmin'

export async function fetchFilaVerificacoes(filtro: FiltroVerificacoes): Promise<VerificacaoCnpjAdmin[]> {
  const { data, error } = await supabase.rpc('admin_fila_verificacoes', { p_filtro: filtro })
  if (error) throw error
  return (data as VerificacaoCnpjAdmin[] | null) ?? []
}

/** Aprova, rejeita ou revoga. Rejeitar/revogar libera o CNPJ para outro perfil (feito no banco). */
export async function decidirVerificacao(
  verificacaoId: string,
  decisao: 'aprovada' | 'rejeitada',
  motivo?: string,
): Promise<void> {
  const { error } = await supabase.rpc('admin_decidir_verificacao', {
    p_verificacao_id: verificacaoId,
    p_decisao: decisao,
    p_motivo: motivo?.trim() || null,
  })
  if (error) throw error
}
