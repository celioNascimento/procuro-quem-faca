// lib/services/adminAnunciosMetricas.service.ts
//
// Leitura de dados para o painel de métricas de anúncios (admin). Responsável
// só por falar com o Supabase/API — não calcula CTR, não combina listas: isso
// é feito em hooks/useMetricasAnuncios.ts.

import { createClient } from '@/lib/supabase/client'

const supabase = createClient()

export interface AnuncioParaMetricas {
  id: string
  titulo: string
  posicao: string
  status: boolean
  data_expiracao: string | null
  anunciantes?: { razao_social?: string | null } | Array<{ razao_social?: string | null }> | null
}

export interface MetricaDiariaApi {
  anuncio_id: string
  data_referencia: string
  impressoes: number
  cliques: number
}

// Leitura direta via client: RLS permite para usuários autenticados (admin).
export async function listarAnunciosParaMetricas(): Promise<AnuncioParaMetricas[]> {
  const { data, error } = await supabase
    .from('anuncios')
    .select('id, titulo, posicao, status, data_expiracao, anunciantes(razao_social)')
    .order('created_at', { ascending: false })

  if (error) throw error
  return (data ?? []) as unknown as AnuncioParaMetricas[]
}

// As métricas diárias vêm de uma API route com service_role — o client
// authenticated não tem permissão de leitura direta na tabela de métricas.
export async function buscarMetricasDiarias(dataInicio: string): Promise<MetricaDiariaApi[]> {
  const res = await fetch(`/api/anuncios/metricas?dataInicio=${dataInicio}`)
  if (!res.ok) throw new Error('Erro ao buscar métricas')
  const { data } = await res.json()
  return data ?? []
}
