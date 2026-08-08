//hooks/useAcompanhamento.ts

'use client'
import { useEffect, useState } from 'react'
import {
  fetchProjetoPorToken,
  fetchComentariosPorProjeto,
  inserirComentario,
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

  const fotosOrdenadas: FotoOrdenada[] =
    projeto?.portfolio_fotos?.sort((a, b) => a.ordem - b.ordem) ?? []

  const temConclusao = fotosOrdenadas.some(f => f.ordem === 3)

  const labelEtapaAtual =
    projeto?.status === 'em_execucao'
      ? temConclusao ? 'Aguardando sua avaliação' : 'Registrando etapas'
      : projeto?.status === 'finalizado'
      ? 'Serviço concluído'
      : 'Em andamento'

  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    if (!token || !mounted) return

    async function carregar() {
      try {
        const projData = await fetchProjetoPorToken(token)
        if (!projData) { setLoading(false); return }

        const comData = await fetchComentariosPorProjeto(projData.id)
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

  const handleShare = async () => {
    // 🔒 SEGURANÇA: Aponta para a vitrine pública do prestador em vez do token privado
    const slugPrestador = projeto?.prestadores?.slug
    const urlPublica = slugPrestador 
      ? `${window.location.origin}/${slugPrestador}`
      : window.location.origin

    const shareData = {
      title: `Perfil de ${projeto?.prestadores?.nome || 'Prestador'}`,
      text: `Conheça os serviços e portfólio profissional no Procuro Quem Faça.`,
      url: urlPublica,
    }

    try {
      if (navigator.share) {
        await navigator.share(shareData)
      } else {
        await navigator.clipboard.writeText(urlPublica)
        alert('Link do perfil público copiado com sucesso!')
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

  return {
    projeto, comentarios, fotosOrdenadas, temConclusao, labelEtapaAtual,
    loading, mounted, fotoSelecionada, setFotoSelecionada,
    novoComentario, setNovoComentario, enviandoComentario,
    handleShare, handleEnviarComentario,
  }
}
