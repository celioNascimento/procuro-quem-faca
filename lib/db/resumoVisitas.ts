// lib/db/resumoVisitas.ts
//
// Resumo de visitas do perfil do prestador logado, para o card do dashboard.
// A conta é feita no banco (função resumo_visitas_prestador): o navegador recebe
// só cinco números, não as linhas de visita. A função descobre o prestador pelo
// usuário logado, então cada pessoa só enxerga o próprio perfil.

import { supabase } from '@/lib/supabase'

export interface ResumoVisitas {
  visitas7d: number
  visitas7dAnterior: number
  visitas30d: number
  visitas30dAnterior: number
  visitasTotal: number
}

type Numero = number | string | null | undefined

interface LinhaResumo {
  visitas_7d: Numero
  visitas_7d_anterior: Numero
  visitas_30d: Numero
  visitas_30d_anterior: Numero
  visitas_total: Numero
}

const numero = (valor: Numero): number => Number(valor ?? 0)

/**
 * Devolve o resumo, ou null quando o usuário não tem perfil de prestador
 * (a função não devolve linhas nesse caso). Lança erro se a consulta falhar.
 */
export async function buscarResumoVisitas(): Promise<ResumoVisitas | null> {
  const { data, error } = await supabase.rpc('resumo_visitas_prestador')
  if (error) throw error

  const linha = (Array.isArray(data) ? data[0] : data) as LinhaResumo | null | undefined
  if (!linha) return null

  return {
    visitas7d: numero(linha.visitas_7d),
    visitas7dAnterior: numero(linha.visitas_7d_anterior),
    visitas30d: numero(linha.visitas_30d),
    visitas30dAnterior: numero(linha.visitas_30d_anterior),
    visitasTotal: numero(linha.visitas_total),
  }
}