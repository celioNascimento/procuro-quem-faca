//hooks/useAvaliacao.ts 

'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  fetchProjetoPorToken,
  fetchAvaliacaoPorProjeto,
  inserirAvaliacao,
  finalizarProjeto,
} from '@/lib/services/avaliacao.service'
import type { FotoOrdenada, Avaliacao, Projeto } from '@/types/avaliacao'

export function useAvaliar(token: string) {
  const router = useRouter()

  const [projeto, setProjeto] = useState<Projeto | null>(null)
  const [avaliacaoExistente, setAvaliacaoExistente] = useState<Avaliacao | null>(null)
  const [loading, setLoading] = useState(true)
  const [mounted, setMounted] = useState(false)
  const [currentSlide, setCurrentSlide] = useState(0)

  const [nota, setNota] = useState(0)
  const [hoverNota, setHoverNota] = useState(0)
  const [comentarioGeral, setComentarioGeral] = useState('')
  const [indica, setIndica] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const avaliacaoFinalizada = avaliacaoExistente?.status === 'finalizado'

  const fotosCarrossel: FotoOrdenada[] =
    (projeto?.portfolio_fotos?.sort((a, b) => a.ordem - b.ordem) ?? []).map(f => ({
      ...f,
      label: f.ordem === 1 ? 'Antes' : f.ordem === 2 ? 'Durante' : 'Depois',
    }))

  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    if (!token || !mounted) return

    async function carregar() {
      try {
        const projData = await fetchProjetoPorToken(token)
        if (!projData) { setLoading(false); return }

        setProjeto(projData)  // 👈 seta o projeto ANTES de buscar avaliação

        const avalData = await fetchAvaliacaoPorProjeto(projData.id)
        if (avalData) setAvaliacaoExistente(avalData)

        const total = projData.portfolio_fotos?.length ?? 0
        if (total > 0) setCurrentSlide(total - 1)
      } catch (err) {
        console.error('Erro ao carregar projeto:', err)
      } finally {
        setLoading(false)
      }
    }

    carregar()
  }, [token, mounted])

  const nextSlide = () =>
    setCurrentSlide(prev => (prev + 1) % fotosCarrossel.length)

  const prevSlide = () =>
    setCurrentSlide(prev => (prev - 1 + fotosCarrossel.length) % fotosCarrossel.length)

  const handleFinalizarAvaliacao = async () => {
    if (nota === 0 || submitting || avaliacaoFinalizada) return
    setSubmitting(true)
    try {
      await inserirAvaliacao({
        projeto_id: projeto!.id,
        prestador_id: projeto!.prestador_id,
        nota,
        comentario: comentarioGeral,
        indica,
        visivel: true,
        status: 'finalizado',
      })
      await finalizarProjeto(projeto!.id)
      setProjeto(prev => prev ? { ...prev, status: 'finalizado' } : prev)
      router.push('/sucesso')
    } catch (err) {
      console.error(err)
    } finally {
      setSubmitting(false)
    }
  }

  return {
    projeto, avaliacaoExistente, avaliacaoFinalizada,
    fotosCarrossel, currentSlide, nextSlide, prevSlide,
    loading, mounted,
    nota, setNota, hoverNota, setHoverNota,
    comentarioGeral, setComentarioGeral,
    indica, setIndica, submitting,
    handleFinalizarAvaliacao,
  }
}