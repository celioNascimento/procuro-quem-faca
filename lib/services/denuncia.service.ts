//lib/services/denuncia.service.ts

import { supabase } from '@/lib/supabase'

export async function criarDenuncia(prestadorId: number, motivo: string): Promise<void> {
  // 1. Cria a Denúncia
  const { error: denunciaError } = await supabase
    .from('denuncias')
    .insert({
      prestador_id: prestadorId,
      motivo: motivo,
      status: 'aberta'
    })

  if (denunciaError) throw denunciaError

  // 2. Log de Auditoria
  const { error: logError } = await supabase.from('logs_atividades').insert({
    acao: 'DENUNCIA_PERFIL',
    entidade_tipo: 'prestador',
    entidade_id: prestadorId,
    detalhes: { motivo, timestamp: new Date().toISOString() }
  })

  if (logError) throw logError
}