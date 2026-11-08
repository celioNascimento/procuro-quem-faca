// hooks/useKitDivulgacao.ts
import { useEffect, useState } from 'react'
import { fetchDadosDivulgacao } from '@/lib/services/divulgacao.service'
import { carregarImagensArte, type ImagensArte } from '@/lib/divulgacao/canvas'
import type { DadosDivulgacao } from '@/lib/divulgacao/tipos'

export function useKitDivulgacao(prestadorId: number | null | undefined) {
  const [dados, setDados] = useState<DadosDivulgacao | null>(null)
  const [imagens, setImagens] = useState<ImagensArte | null>(null)
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState(false)

  useEffect(() => {
    if (!prestadorId) return
    let ativo = true
    ;(async () => {
      try {
        const d = await fetchDadosDivulgacao(prestadorId)
        const imgs = await carregarImagensArte(d)
        if (!ativo) return
        setDados(d)
        setImagens(imgs)
        setErro(false)
      } catch (e) {
        console.error('[useKitDivulgacao]', e)
        if (ativo) setErro(true)
      } finally {
        if (ativo) setLoading(false)
      }
    })()
    return () => { ativo = false }
  }, [prestadorId])

  return { dados, imagens, loading, erro }
}
