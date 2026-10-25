// lib/stats/ativacaoStats.ts
//
// Cálculo puro usado por hooks/useAdminAtivacao.ts: quantos prestadores há
// em cada status da campanha de ativação. Fica fora do hook (que importa
// lib/services/adminAtivacao.service.ts e por isso precisa das variáveis de
// ambiente do Supabase) para poder ser testado isoladamente — ver
// ativacaoStats.test.ts.

import type { PrestadorAtivacao } from '@/lib/services/adminAtivacao.service'

export function contarPorStatus(lista: PrestadorAtivacao[]): Record<string, number> {
  const contagem: Record<string, number> = {}
  lista.forEach((p) => {
    contagem[p.ativacao_status] = (contagem[p.ativacao_status] || 0) + 1
  })
  return contagem
}
