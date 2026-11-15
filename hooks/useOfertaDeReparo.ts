// hooks/useOfertaDeReparo.ts
//
// Descobre se o prestador pode oferecer reparo neste trabalho: busca a avaliação do trabalho e a
// garantia configurada no perfil, e aplica a regra de lib/garantia/oferta.ts. Qualquer falha de
// leitura vira "não pode" — esconder o formulário é mais seguro do que mostrar um que o banco recusa.

'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { podeOferecerReparo, type AvaliacaoParaOferta } from '@/lib/garantia/oferta'

export function useOfertaDeReparo(projetoId: string | null, prestadorId: number) {
  const [avaliacaoId, setAvaliacaoId] = useState<string | null>(null)
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
    let cancelado = false
    async function buscar() {
      if (!projetoId) { setCarregando(false); return }
      try {
        const [{ data: av }, { data: prest }] = await Promise.all([
          supabase.from('avaliacoes').select('id, nota, indica, oculta_por_garantia').eq('projeto_id', projetoId).limit(1).maybeSingle(),
          supabase.from('prestadores').select('garantia_dias').eq('id', prestadorId).maybeSingle(),
        ])
        if (cancelado) return
        setAvaliacaoId(av && podeOferecerReparo(av as AvaliacaoParaOferta, prest?.garantia_dias) ? (av.id as string) : null)
      } catch {
        if (!cancelado) setAvaliacaoId(null)
      } finally {
        if (!cancelado) setCarregando(false)
      }
    }
    buscar()
    return () => { cancelado = true }
  }, [projetoId, prestadorId])

  return { avaliacaoId, carregando }
}
