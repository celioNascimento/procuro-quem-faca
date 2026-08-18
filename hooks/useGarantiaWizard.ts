// hooks/useGarantiaWizard.ts
//
// Hook enxuto para upload/zoom/comentários na timeline de um caso de garantia.
// Espelha o PADRÃO de useUploadWizard (mesmo tipo de UX: carrossel + zoom modal
// com legenda + comentários), mas SEM a lógica que não se aplica aqui:
//  - sem 3 posições fixas (1/2/3) — fotos são sequência livre
//  - sem criação de "projeto" embutida no upload (o caso já existe antes)
//  - sem gerarLinkAceite/gerarLinkConclusao (não há convite/aceite aqui)
//  - sem polling de sincronização de status (o caso muda de status por ação
//    explícita do usuário — responder, confirmar resolução — não por eventos
//    externos assíncronos como o projeto original)
//
// Quem chama este hook informa autorTipo ('cliente' | 'prestador') e
// autorUserId, determinados pelo contexto de tela (painel do cliente vs.
// dashboard do prestador) — o hook não tenta descobrir isso sozinho.

import { useState, useEffect, useCallback, useMemo, ChangeEvent } from 'react'
import {
  getFotosDoCaso,
  getComentariosDoCaso,
  inserirFotoGarantia,
  atualizarLegendaFotoGarantia,
  inserirComentarioGarantia,
  uploadImagemGarantia,
  type GarantiaFoto,
  type GarantiaComentario,
} from '@/lib/services/garantiaWizard.service'

interface UseGarantiaWizardParams {
  casoId: string
  autorTipo: 'cliente' | 'prestador'
  autorUserId: string | null
}

export function useGarantiaWizard({ casoId, autorTipo, autorUserId }: UseGarantiaWizardParams) {
  const [fotos, setFotos] = useState<GarantiaFoto[]>([])
  const [comentarios, setComentarios] = useState<GarantiaComentario[]>([])
  const [loading, setLoading] = useState(true)
  const [enviandoFoto, setEnviandoFoto] = useState(false)
  const [erroUpload, setErroUpload] = useState<string | null>(null)

  const [zoomFotoId, setZoomFotoId] = useState<string | null>(null)
  const [legendaEdit, setLegendaEdit] = useState('')
  const [salvandoLegenda, setSalvandoLegenda] = useState(false)
  const [erroLegenda, setErroLegenda] = useState<string | null>(null)

  const [novoComentario, setNovoComentario] = useState('')
  const [enviandoComentario, setEnviandoComentario] = useState(false)

  const [currentSlide, setCurrentSlide] = useState(0)

  const carregar = useCallback(async () => {
    setLoading(true)
    try {
      const [fotosData, comentariosData] = await Promise.all([
        getFotosDoCaso(casoId),
        getComentariosDoCaso(casoId),
      ])
      setFotos(fotosData)
      setComentarios(comentariosData)
    } catch (err) {
      console.error('Erro ao carregar wizard de garantia:', err)
    } finally {
      setLoading(false)
    }
  }, [casoId])

  useEffect(() => {
    if (casoId) carregar()
  }, [casoId, carregar])

  // Trava scroll do body quando o zoom está aberto — mesmo padrão do wizard original
  useEffect(() => {
    document.body.style.overflow = zoomFotoId ? 'hidden' : 'unset'
    return () => { document.body.style.overflow = 'unset' }
  }, [zoomFotoId])

  useEffect(() => {
    if (!zoomFotoId) return
    const foto = fotos.find((f) => f.id === zoomFotoId)
    setLegendaEdit(foto?.legenda ?? '')
  }, [zoomFotoId, fotos])

  const fotoAtual = fotos[currentSlide] ?? null

  const comentariosDaFotoZoom = useMemo(
    () => comentarios.filter((c) => c.foto_id === zoomFotoId),
    [comentarios, zoomFotoId],
  )

  // Comentários "gerais" do caso, sem foto vinculada (ex: resposta inicial do prestador)
  const comentariosGerais = useMemo(
    () => comentarios.filter((c) => c.foto_id === null),
    [comentarios],
  )

  const handleUpload = async (
    e: ChangeEvent<HTMLInputElement>,
    fase: 'problema' | 'resolucao',
  ) => {
    const file = e.target.files?.[0]
    if (!file) return

    const MAX_MB = 10
    const sizeMB = file.size / (1024 * 1024)
    if (sizeMB > MAX_MB) {
      setErroUpload(`A imagem tem ${sizeMB.toFixed(1)}MB. O limite é de ${MAX_MB}MB.`)
      e.target.value = ''
      return
    }

    setErroUpload(null)
    setEnviandoFoto(true)

    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${Math.random()}.${fileExt}`
      const filePath = `${casoId}/${fileName}`

      const publicUrl = await uploadImagemGarantia(filePath, file)

      const novaFoto = await inserirFotoGarantia({
        caso_id: casoId,
        url_foto: publicUrl,
        autor_tipo: autorTipo,
        autor_user_id: autorUserId,
        fase,
      })

      setFotos((prev) => [...prev, novaFoto])
      setCurrentSlide(fotos.length) // foca na foto recém-enviada
      setZoomFotoId(novaFoto.id)
    } catch (err) {
      console.error('Erro no upload de foto de garantia:', err)
      setErroUpload('Não foi possível enviar a imagem. Verifique sua conexão e tente novamente.')
    } finally {
      setEnviandoFoto(false)
      e.target.value = ''
    }
  }

  const handleSalvarLegenda = async () => {
    if (!zoomFotoId) return
    setSalvandoLegenda(true)
    setErroLegenda(null)
    try {
      await atualizarLegendaFotoGarantia(zoomFotoId, legendaEdit)
      setFotos((prev) =>
        prev.map((f) => (f.id === zoomFotoId ? { ...f, legenda: legendaEdit } : f)),
      )
    } catch (err) {
      console.error('Erro ao salvar legenda:', err)
      setErroLegenda('Não foi possível salvar a descrição. Tente novamente.')
      setTimeout(() => setErroLegenda(null), 4000)
    } finally {
      setSalvandoLegenda(false)
    }
  }

  const handleEnviarComentario = async (fotoId?: string | null) => {
    if (!novoComentario.trim() || enviandoComentario) return
    setEnviandoComentario(true)
    try {
      const novo = await inserirComentarioGarantia({
        caso_id: casoId,
        foto_id: fotoId ?? null,
        autor_tipo: autorTipo,
        texto: novoComentario.trim(),
      })
      setComentarios((prev) => [...prev, novo])
      setNovoComentario('')
    } catch (err) {
      console.error('Erro ao enviar comentário de garantia:', err)
    } finally {
      setEnviandoComentario(false)
    }
  }

  const nextSlide = (e?: React.MouseEvent) => {
    e?.stopPropagation()
    setCurrentSlide((prev) => (prev + 1) % Math.max(fotos.length, 1))
  }

  const prevSlide = (e?: React.MouseEvent) => {
    e?.stopPropagation()
    setCurrentSlide((prev) => (prev - 1 + fotos.length) % Math.max(fotos.length, 1))
  }

  return {
    state: {
      fotos, comentarios, loading, enviandoFoto, erroUpload,
      zoomFotoId, legendaEdit, salvandoLegenda, erroLegenda,
      novoComentario, enviandoComentario, currentSlide,
    },
    derived: {
      fotoAtual, comentariosDaFotoZoom, comentariosGerais,
    },
    actions: {
      setZoomFotoId, setLegendaEdit, setNovoComentario,
      handleUpload, handleSalvarLegenda, handleEnviarComentario,
      nextSlide, prevSlide, recarregar: carregar,
    },
  }
}
