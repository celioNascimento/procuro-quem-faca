'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  fetchProjetoComToken,
  fetchAvaliacaoPorProjeto,
  fetchComentariosPorProjeto,
  inserirComentario,
  inserirAvaliacao,
  finalizarProjeto,
} from '@/lib/services/avaliacaoService'

export type FotoOrdenada = {
  id: string
  url_foto: string
  ordem: number
  legenda?: string
  label?: string
}

export type Comentario = {
  id: string
  foto_id: string
  projeto_id: string
  autor_tipo: 'cliente' | 'prestador'
  texto: string
  criado_at: string
}

export type Projeto = {
  id: string
  titulo: string
  status: string
  prestador_id: string
  cliente_nome: string
  portfolio_fotos: FotoOrdenada[]
  prestadores: {
    nome: string
    foto_perfil: string
    whatsapp: string
    categoria: { nome: string }
  }
  [key: string]: unknown
}

export type Avaliacao = {
  id: string
  nota: number
  comentario?: string
  indica: boolean
}

export function useAvaliacao(projetoId: string, token: string | null) {
  const router = useRouter()

  // ── Dados remotos ───────────────────────────────────────────────────────────
  const [projeto, setProjeto] = useState<Projeto | null>(null)
  const [avaliacaoExistente, setAvaliacaoExistente] = useState<Avaliacao | null>(null)
  const [comentarios, setComentarios] = useState<Comentario[]>([])

  // ── UI state ────────────────────────────────────────────────────────────────
  const [loading, setLoading] = useState(true)
  const [mounted, setMounted] = useState(false)
  const [fotoSelecionada, setFotoSelecionada] = useState<FotoOrdenada | null>(null)
  const [currentSlide, setCurrentSlide] = useState(0)

  // ── Formulário de avaliação ─────────────────────────────────────────────────
  const [nota, setNota] = useState(0)
  const [hoverNota, setHoverNota] = useState(0)
  const [comentarioGeral, setComentarioGeral] = useState('')
  const [indica, setIndica] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  // ── Formulário de comentário ────────────────────────────────────────────────
  const [novoComentario, setNovoComentario] = useState('')
  const [enviandoComentario, setEnviandoComentario] = useState(false)

  // ── Derivados ───────────────────────────────────────────────────────────────
  const isProjetoConcluido =
    projeto?.status?.toLowerCase() === 'concluido' ||
    projeto?.status?.toLowerCase() === 'finalizado'

  const visualmenteConcluido = isProjetoConcluido || !!avaliacaoExistente

  const fotosOrdenadas: FotoOrdenada[] =
    projeto?.portfolio_fotos?.sort((a, b) => a.ordem - b.ordem) ?? []

  const temConclusao = fotosOrdenadas.some((f) => f.ordem === 3)

  const fotosCarrossel: FotoOrdenada[] = fotosOrdenadas.map((f) => ({
    ...f,
    label: f.ordem === 1 ? 'Antes' : f.ordem === 2 ? 'Durante' : 'Depois',
  }))

  const labelEtapaAtual = visualmenteConcluido
    ? 'Concluído ✓'
    : projeto?.status === 'em_execucao'
    ? 'Aguardando sua avaliação'
    : 'Em andamento'

  // ── Efeitos ─────────────────────────────────────────────────────────────────
  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    if (!token || !mounted || !projetoId) return

    async function carregar() {
      try {
        const projData = await fetchProjetoComToken(projetoId, token!)
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
  }, [projetoId, token, mounted])

  // Posiciona carrossel na última foto quando concluído
  useEffect(() => {
    if (visualmenteConcluido && fotosCarrossel.length > 0) {
      setCurrentSlide(fotosCarrossel.length - 1)
    }
  }, [visualmenteConcluido, fotosCarrossel.length])

  // ── Handlers ────────────────────────────────────────────────────────────────
  const nextSlide = () =>
    setCurrentSlide((prev) => (prev + 1) % fotosCarrossel.length)

  const prevSlide = () =>
    setCurrentSlide((prev) => (prev - 1 + fotosCarrossel.length) % fotosCarrossel.length)

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
      setComentarios((prev) => [...prev, novo])
      setNovoComentario('')
    } catch (err) {
      console.error(err)
    } finally {
      setEnviandoComentario(false)
    }
  }

  const handleFinalizarAvaliacao = async () => {
    if (nota === 0 || submitting || avaliacaoExistente) return
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
      setProjeto((prev) => prev ? { ...prev, status: 'finalizado' } : prev)
      router.push('/sucesso')
    } catch (err) {
      console.error(err)
    } finally {
      setSubmitting(false)
    }
  }

  return {
    // dados
    projeto,
    avaliacaoExistente,
    comentarios,
    fotosOrdenadas,
    fotosCarrossel,
    temConclusao,
    labelEtapaAtual,
    visualmenteConcluido,

    // UI
    loading,
    mounted,
    fotoSelecionada,
    setFotoSelecionada,
    currentSlide,
    nextSlide,
    prevSlide,

    // formulário avaliação
    nota,
    setNota,
    hoverNota,
    setHoverNota,
    comentarioGeral,
    setComentarioGeral,
    indica,
    setIndica,
    submitting,

    // formulário comentário
    novoComentario,
    setNovoComentario,
    enviandoComentario,

    // handlers
    handleShare,
    handleEnviarComentario,
    handleFinalizarAvaliacao,
  }
}