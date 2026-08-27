//lib/services/adminLogs.service.ts

import { supabase } from '@/lib/supabase'

export interface LogAtividade {
  id: string
  acao: string
  detalhes: Record<string, unknown> | null
  usuario_email: string | null
  created_at: string
}

/**
 * FIX: antes buscava sempre os últimos 1000 registros inteiros, sem recorte
 * de data — com o volume crescente de logs_atividades (ACESSO_SESSAO,
 * VISITA_PERFIL_VIA_BUSCA etc.), isso ia puxar cada vez mais dado por
 * carregamento da tela sem ganho real (a maior parte do uso do admin é
 * "o que aconteceu recentemente", não histórico completo).
 *
 * Passa a filtrar por período (padrão: últimos 30 dias) além do limite de
 * linhas, que continua como um teto de segurança. Histórico mais antigo
 * pode ser buscado sob demanda ampliando diasAtras, não por padrão.
 */
export async function fetchLogsRecentes(limite = 1000, diasAtras = 30): Promise<LogAtividade[]> {
  const dataLimite = new Date()
  dataLimite.setDate(dataLimite.getDate() - diasAtras)

  const { data, error } = await supabase
    .from('logs_atividades')
    .select('*')
    .gte('created_at', dataLimite.toISOString())
    .order('created_at', { ascending: false })
    .limit(limite)

  if (error) throw error
  return data || []
}
