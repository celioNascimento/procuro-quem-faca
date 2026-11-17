//lib/services/meusDados.service.ts
//
// Exportação dos dados da própria pessoa. A função do banco usa sempre o usuário logado,
// então não há como pedir os dados de outra conta.

import { supabase } from '@/lib/supabase'
import type { ExportacaoDados } from '@/lib/meusDados/resumo'

export async function buscarMeusDados(): Promise<ExportacaoDados> {
  // A função do banco é negada a visitantes (erro 42501, não 28000): sem sessão, nem chama.
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) throw new Error('LOGIN_NECESSARIO')

  const { data, error } = await supabase.rpc('exportar_meus_dados')
  if (error) {
    if (error.code === '28000') throw new Error('LOGIN_NECESSARIO')
    throw error
  }
  return data as ExportacaoDados
}
