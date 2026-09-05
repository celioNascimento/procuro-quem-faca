'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import {
  fetchProjetoPorToken,
  fetchAvaliacaoClientePorProjeto,
  fetchComentariosPorProjeto,
  inserirComentario,
  reivindicarProjetoParaCliente,
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
        // Reivindicação silenciosa: se o projeto ainda não tem
        // cliente_user_id (caso legado) e o usuário logado bate pelo
        // whatsapp, vincula agora e atualiza o objeto em memória —
        // sem isso, a verificação de dono em abrirCasoGarantiaCliente
        // só passaria a funcionar na visita SEGUINTE (já que o objeto
        // buscado acima não reflete a mudança feita depois dele).
        const { data: userData } = await supabase.auth.getUser()
        if (userData.user) {
          await reivindicarProjetoParaCliente(projData.id, userData.user.id)
          if (!projData.cliente_user_id) {
            projData.cliente_user_id = userData.user.id
          }
        }

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
      title: `Serviço de ${projeto?.prestadores?.nome || 'Prestador'}`,
      text: `Confira este serviço no portfólio de ${projeto?.prestadores?.nome || 'Prestador'} no Procuro Quem Faça.`,
      url: urlPublica,
    }

    try {
      if (navigator.share) {
        await navigator.share(shareData)
      } else {
        await navigator.clipboard.writeText(urlPublica)
        alert('Link do projeto copiado com sucesso!')
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
