//hooks/useAvaliacao.ts

'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import {
  fetchProjetoPorToken,
  reivindicarProjetoPorToken,
  type ResultadoReivindicacao,
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
  const [indica, setIndica] = useState<boolean | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [vinculo, setVinculo] = useState<ResultadoReivindicacao | null>(null)

  const avaliacaoFinalizada = avaliacaoExistente?.status === 'finalizado'

  const fotosCarrossel: FotoOrdenada[] =
    (projeto?.portfolio_fotos?.sort((a, b) => a.ordem - b.ordem) ?? []).map(f => ({
      ...f,
      label: f.ordem === 1 ? 'Antes' : f.ordem === 2 ? 'Durante' : 'Depois',
    }))

  useEffect(() => {
    queueMicrotask(() => setMounted(true))
  }, [])

  useEffect(() => {
    if (!token || !mounted) return

    async function carregar() {
      try {
        const projData = await fetchProjetoPorToken(token)
        if (!projData) { setLoading(false); return }

        setProjeto(projData)

        // Primeira conta logada que abre o link vira a dona do vínculo do projeto.
        const { data: userData } = await supabase.auth.getUser()
        if (userData.user) setVinculo(await reivindicarProjetoPorToken(token))

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

    queueMicrotask(() => carregar())
  }, [token, mounted])

  // Pré-seleciona indicação com base na nota
  useEffect(() => {
    if (nota >= 4) queueMicrotask(() => setIndica(true))
    else if (nota > 0 && nota <= 2) queueMicrotask(() => setIndica(false))
    else if (nota === 3) queueMicrotask(() => setIndica(null))
  }, [nota])

  const nextSlide = () =>
    setCurrentSlide(prev => (prev + 1) % fotosCarrossel.length)

  const prevSlide = () =>
    setCurrentSlide(prev => (prev - 1 + fotosCarrossel.length) % fotosCarrossel.length)

  const handleFinalizarAvaliacao = async () => {
    // Projeto vinculado a outra conta: só quem é o cliente do projeto avalia.
    if (nota === 0 || submitting || avaliacaoFinalizada || vinculo === 'vinculado_outra_conta') return
    setSubmitting(true)
    try {
      await inserirAvaliacao({
        projeto_id: projeto!.id,
        prestador_id: projeto!.prestador_id,
        nota,
        comentario: comentarioGeral,
        indica: indica ?? false,
        visivel: true,
        status: 'finalizado',
        cliente_nome: projeto!.cliente_nome ?? null,
        cliente_foto_url: projeto!.cliente_foto_url ?? null,
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
    indica, setIndica, submitting, vinculo,
    handleFinalizarAvaliacao,
  }
}
