'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import {
  fetchProjetoPorToken,
  fetchAvaliacaoClientePorProjeto,
  fetchComentariosPorProjeto,
  inserirComentario,
  reivindicarProjetoPorToken,
  type ResultadoReivindicacao,
} from '@/lib/services/avaliacao.service'
import type { FotoOrdenada, Comentario, Projeto } from '@/types/avaliacao'

export function useAcompanhamento(token: string) {
  const [projeto, setProjeto]       = useState<Projeto | null>(null)
  const [comentarios, setComentarios] = useState<Comentario[]>([])
  const [loading, setLoading]       = useState(true)
  const [mounted, setMounted]       = useState(false)
  const [fotoSelecionada, setFotoSelecionada] = useState<FotoOrdenada | null>(null)
  const [novoComentario, setNovoComentario]   = useState('')
  const [enviandoComentario, setEnviandoComentario] = useState(false)
  const [vinculo, setVinculo] = useState<ResultadoReivindicacao | null>(null)
  const [avisoLink, setAvisoLink] = useState<string | null>(null)

  const fotosOrdenadas: FotoOrdenada[] =
    projeto?.portfolio_fotos?.sort((a, b) => a.ordem - b.ordem) ?? []

  const temConclusao = fotosOrdenadas.some(f => f.ordem === 3)

  const labelEtapaAtual =
    projeto?.status === 'em_execucao'
      ? temConclusao ? 'Aguardando sua avaliação' : 'Registrando etapas'
      : projeto?.status === 'finalizado'
      ? 'Trabalho concluído'
      : 'Em andamento'

  useEffect(() => {
    queueMicrotask(() => setMounted(true))
  }, [])

  useEffect(() => {
    if (!token || !mounted) return

    async function carregar() {
      try {
        // Reivindicação pelo token: a primeira conta logada que abre o link vira a dona do vínculo
        // (cliente_user_id). Vem ANTES de carregar o trabalho: as fotos de um trabalho com aceite
        // pendente só são legíveis pelo cliente dono, que ainda não é dono na primeira abertura.
        const { data: userData } = await supabase.auth.getUser()
        if (userData.user) setVinculo(await reivindicarProjetoPorToken(token))

        const projData = await fetchProjetoPorToken(token)
        if (!projData) { setLoading(false); return }

        const comData = await fetchComentariosPorProjeto(projData.id)
        setComentarios(comData)

        // Busca a avaliação depois da reivindicação para que clientes de
        // projetos legados também consigam enxergar o feedback salvo.
        const avaliacaoCliente = await fetchAvaliacaoClientePorProjeto(projData.id)
        projData.avaliacoes_clientes = avaliacaoCliente ? [avaliacaoCliente] : []

        setProjeto(projData)
      } catch (err) {
        console.error('Erro ao carregar projeto:', err)
      } finally {
        setLoading(false)
      }
    }

    carregar()
  }, [token, mounted])

  
  const handleShare = async () => {
    // 🔒 SEGURANÇA E UX: Aponta para a vitrine pública já focada no projeto específico
    const slugPrestador = projeto?.prestadores?.slug
    const urlPublica = slugPrestador 
      ? `${window.location.origin}/${slugPrestador}?projeto=${projeto?.id}`
      : window.location.origin

    const shareData = {
      title: `Trabalho de ${projeto?.prestadores?.nome || 'Prestador'}`,
      text: `Confira este trabalho no portfólio de ${projeto?.prestadores?.nome || 'Prestador'} no Procuro Quem Faça.`,
      url: urlPublica,
    }

    try {
      if (navigator.share) {
        await navigator.share(shareData)
      } else {
        await navigator.clipboard.writeText(urlPublica)
        setAvisoLink('Link copiado. Agora é só colar onde quiser compartilhar.')
        setTimeout(() => setAvisoLink(null), 4000)
      }
    } catch (err) {
      // Quem fecha a janela de compartilhar não deve ver erro; só avisamos quando era cópia.
      if (err instanceof Error && err.name === 'AbortError') return
      console.error(err)
      setAvisoLink('Não deu para copiar o link. Tente de novo.')
      setTimeout(() => setAvisoLink(null), 4000)
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

  return {
    projeto, comentarios, fotosOrdenadas, temConclusao, labelEtapaAtual, vinculo,
    loading, mounted, fotoSelecionada, setFotoSelecionada,
    novoComentario, setNovoComentario, enviandoComentario,
    handleShare, handleEnviarComentario, avisoLink,
  }
}
