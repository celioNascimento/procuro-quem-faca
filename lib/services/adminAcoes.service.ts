// lib/services/adminAcoes.service.ts
// Leitura do registro de ações do admin. Só leitura: a gravação é feita por gatilhos no banco.

import { supabase } from '@/lib/supabase'
import type { AcaoAdmin } from '@/lib/admin/acoes'

export const LIMITE_ACOES = 200

export async function listarAcoesAdmin(limite = LIMITE_ACOES): Promise<AcaoAdmin[]> {
  const { data, error } = await supabase
    .from('admin_acoes')
    .select('id, quando, admin_id, admin_email, acao, alvo_tipo, alvo_id, alvo_nome, motivo, detalhes')
    .order('quando', { ascending: false })
    .limit(limite)
  if (error) throw error
  return (data ?? []) as AcaoAdmin[]
}
