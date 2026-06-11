'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  fetchProjetoPorToken,
  fetchAvaliacaoPorProjeto,
  fetchComentariosPorProjeto,
  inserirComentario,
  inserirAvaliacao,
  finalizarProjeto,
} from '@/lib/services/avaliacao.service'
import type { FotoOrdenada, Comentario, Projeto, Avaliacao } from '@/types/avaliacao'

export function useAvaliacao(token: string) {
  const router = useRouter()

  const [projeto, setProjeto]                       = useState<Projeto | null>(null)
  const [avaliacaoExistente, setAvaliacaoExistente] = useState<Avaliacao | null>(null)
  const [comentarios, setComentarios]               = useState<Comentario[]>([])

  const [loading, setLoading]                 = useState(true)
  const [mounted, setMounted]                 = useState(false)
  const [fotoSelecionada, setFotoSelecionada] = useState<FotoOrdenada | null>(null)
  const [currentSlide, setCurrentSlide]       = useState(0)

  const [nota, setNota]                       = useState(0)
  const [hoverNota, setHoverNota]             = useState(0)
  const [comentarioGeral, setComentarioGeral] = useState('')
  const [indica, setIndica]                   = useState(false)
  const [submitting, setSubmitting]           = useState(false)

  const [novoComentario, setNovoComentario]         = useState('')
  const [enviandoComentario, setEnviandoComentario] = useState(false)

  const isProjetoConcluido =
    projeto?.status?.toLowerCase() === 'concluido' ||
    projeto?.status?.toLowerCase() === 'finalizado'

  const avaliacaoFinalizada = avaliacaoExistente?.status === 'finalizado'
  const visualmenteConcluido = isProjetoConcluido || avaliacaoFinalizada

  const fotosOrdenadas: FotoOrdenada[] =
    projeto?.portfolio_fotos?.sort((a, b) => a.ordem - b.ordem) ?? []

  const temConclusao = fotosOrdenadas.some(f => f.ordem === 3)

  const fotosCarrossel: FotoOrdenada[] = fotosOrdenadas.map(f => ({
    ...f,
    label: f.ordem === 1 ? 'Antes' : f.ordem === 2 ? 'Durante' : 'Depois',
  }))

  // Label evolui conforme o estado real do projeto:
  // pendente/em_registro → Em andamento
  // em_execucao sem foto 3 → Registrando etapas (prestador ainda fotografando)
  // em_execucao com foto 3 → Aguardando sua avaliação (todas as fotos prontas)
  // concluido/finalizado  → Concluído ✓
  const labelEtapaAtual = visualmenteConcluido
    ? 'Concluído ✓'
    : projeto?.status === 'em_execucao'
      ? temConclusao
        ? 'Aguardando sua avaliação'
        : 'Registrando etapas'
      : 'Em andamento'

  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    if (!token || !mounted) return

    async function carregar() {
      try {
        const projData = await fetchProjetoPorToken(token)
        if (!projData) { setLoading(false); return }

        const [avalData, comData] = await Promise.all([
          fetchAvaliacaoPorProjeto(projData.id),
          fetchComentariosPorProjeto(projData.id),
        ])

        if (avalData) setAvaliacaoExistente(avalData)
        setComentarios(comData)
        setProjeto(projData)
      } catch (err) {
        console.error('Erro ao carregar projeto:', err)
      } finally {
        setLoading(false)
      }
    }

    carregar()
  }, [token, mounted])

  useEffect(() => {
    if (visualmenteConcluido && fotosCarrossel.length > 0) {
      setCurrentSlide(fotosCarrossel.length - 1)
    }
  }, [visualmenteConcluido, fotosCarrossel.length])

  const nextSlide = () =>
    setCurrentSlide(prev => (prev + 1) % fotosCarrossel.length)

  const prevSlide = () =>
    setCurrentSlide(prev => (prev - 1 + fotosCarrossel.length) % fotosCarrossel.length)

  const handleShare = async () => {
    const shareData = {
      title: `Serviço: ${projeto?.titulo}`,
      text: `Acompanhe o progresso: "${projeto?.titulo}"`,
      url: window.location.href,
    }
    try {
      if (navigator.share) await navigator.share(shareData)
      else {
        await navigator.clipboard.writeText(window.location.href)
        alert('Link copiado!')
      }
    } catch (err) {
      console.error(err)
    }
  }

  const handleEnviarComentario = async () => {
    if (!novoComentario.trim() || !fotoSelecionada || enviandoComentario) return
    setEnviandoComentario(true)
    try {
      const novo = await inserirComentario({
        foto_id: fotoSelecionada.id,
        projeto_id: projeto!.id,
        autor_tipo: 'cliente',
        texto: novoComentario.trim(),
      })
      setComentarios(prev => [...prev, novo])
      setNovoComentario('')
    } catch (err) {
      console.error(err)
    } finally {
      setEnviandoComentario(false)
    }
  }

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
    projeto, avaliacaoExistente, comentarios,
    fotosOrdenadas, fotosCarrossel, temConclusao, labelEtapaAtual, visualmenteConcluido,
    loading, mounted, fotoSelecionada, setFotoSelecionada, currentSlide, nextSlide, prevSlide,
    nota, setNota, hoverNota, setHoverNota, comentarioGeral, setComentarioGeral,
    indica, setIndica, submitting,
    novoComentario, setNovoComentario, enviandoComentario,
    handleShare, handleEnviarComentario, handleFinalizarAvaliacao,
  }
}