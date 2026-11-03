// lib/services/adCardPainelCliente.service.ts
//
// Consultas do banner de anúncio do painel do cliente
// (components/painel/AdCardPainelCliente.tsx via hooks/useAdCardPainelCliente.ts).

import { supabase } from '@/lib/supabase/client'
import type { AnuncioComAnunciante } from '@/lib/services/adminAnuncios.service'

export type AnuncioComMetrica = AnuncioComAnunciante & { segmentacao_id_ativa?: string }

export async function buscarCidadeIdDoPrestador(prestadorId: string | number): Promise<string | null> {
  const { data, error } = await supabase
    .from('prestadores')
    .select('cidade_id')
    .eq('id', prestadorId)
    .maybeSingle()

  if (error) throw error
  return data?.cidade_id ? String(data.cidade_id) : null
}

/** Primeiro anúncio próprio, aprovado e vigente da praça (cidade) na posição dada. */
export async function buscarAnuncioDaPraca(cidadeId: string, posicao: string): Promise<AnuncioComMetrica | null> {
  const agora = new Date().toISOString()

  const { data } = await supabase
    .from('anuncios_segmentacoes')
    .select(`
      id,
      anuncios!inner(
        *,
        anunciantes(id, razao_social, whatsapp)
      )
    `)
    .eq('cidade_id', cidadeId)
    .eq('anuncios.status', true)
    .eq('anuncios.status_aprovacao', 'aprovado')
    .eq('anuncios.tipo', 'proprio')
    .eq('anuncios.posicao', posicao)
    .or(`data_inicio.is.null,data_inicio.lte.${agora}`, { foreignTable: 'anuncios' })
    .or(`data_expiracao.is.null,data_expiracao.gte.${agora}`, { foreignTable: 'anuncios' })

  if (!data || data.length === 0) return null

  const anuncio = data[0].anuncios as unknown as AnuncioComMetrica
  anuncio.segmentacao_id_ativa = data[0].id
  return anuncio
}
