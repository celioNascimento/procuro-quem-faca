//lib/services/ativacao.service.ts

import { supabase } from '@/lib/supabase'

// Gera (ou reaproveita) o token do link pessoal do prestador. Só administradores conseguem,
// e só para perfis que ainda não têm conta.
export async function gerarTokenReivindicacao(prestadorId: number): Promise<string> {
  const { data, error } = await supabase.rpc('admin_token_reivindicacao', { p_prestador_id: prestadorId })
  if (error) {
    if (error.code === '22023') throw new Error('PERFIL_JA_TEM_CONTA')
    if (error.code === '42501') throw new Error('SEM_PERMISSAO')
    throw new Error(error.message || 'ERRO_AO_GERAR_TOKEN')
  }
  return data as string
}
