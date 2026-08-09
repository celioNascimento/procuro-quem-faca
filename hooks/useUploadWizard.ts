//hooks/useUploadWizard.ts

import { useState, useEffect, useCallback, useMemo, useRef, ChangeEvent } from 'react'
import { Projeto } from '@/hooks/usePortfolioDashboard'
import { FotoPortfolio, ComentarioPortfolio, ProjetoIdentificado } from '@/types/portfolio'
import {
  getPrestadorBaseInfo,
  getFotosDoProjeto,
  getComentariosDaFoto,
  buscarProjetosPorTelefone,
  criarNovoProjeto,
  atualizarStatusProjeto,
  atualizarTituloProjeto,
  upsertFotoProjeto,
  atualizarLegendaFoto,
  getStatusETokenProjeto,
  uploadImagemPortfolio
} from '@/lib/services/uploadWizard.service'

type ProjetoCompleto = Projeto & {
  cliente_whatsapp?: string | null
  cliente_nome?: string | null
}

const cleanPhone = (phone?: string | null): string => phone?.replace(/\D/g, '') || ''

const maskPhone = (v?: string | null): string => {
  if (!v) return ''
  v = v.replace(/\D/g, '').slice(0, 11)
  if (v.length <= 10) return v.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3').replace(/-$/, '')
  return v.replace(/(\d{2})(\d{1})(\d{4})(\d{4})/, '($1) $2 $3-$4')
}

const renderAvatar = (url?: string | null): string | null => url && url.trim() !== "" ? url : null

export function useUploadWizard(prestadorId: string | number, projetoExistente: Projeto | null) {
  const projeto = projetoExistente as ProjetoCompleto | null

  // ── Estados ──────────────────────────────────────────────────────────────
  const [loadingEtapa, setLoadingEtapa] = useState<Record<number, boolean>>({ 1: false, 2: false, 3: false })
  const [erroUpload, setErroUpload] = useState<string | null>(null)
  const [erroLegenda, setErroLegenda] = useState<string | null>(null)
  const [erroTitulo, setErroTitulo] = useState<string | null>(null)
  const [aguardandoAvaliacao, setAguardandoAvaliacao] = useState<boolean>(false)
  const [projetoId, setProjetoId] = useState<string | null>(projeto?.id || null)
  const [projetoStatus, setProjetoStatus] = useState<string>(projeto?.status || 'pendente')
  const [titulo, setTitulo] = useState<string>(projeto?.titulo || '')
  const [prestadorInfo, setPrestadorInfo] = useState({
    nome: '',
    foto: null as string | null,
    whatsapp: '',
    slug: '' as string | null
  })
  const [clienteWhatsapp, setClienteWhatsapp] = useState<string>(() => maskPhone(projeto?.cliente_whatsapp))
  const [clienteNome, setClienteNome] = useState<string>(projeto?.cliente_nome || '')
  const [linkGerado, setLinkGerado] = useState<boolean>(!!projeto)
  const [fotosUrls, setFotosUrls] = useState<Record<number, string | null>>({ 1: null, 2: null, 3: null })
  const [fotosData, setFotosData] = useState<Record<number, FotoPortfolio | null>>({ 1: null, 2: null, 3: null })
  const [zoomEtapa, setZoomEtapa] = useState<number | null>(null)
  const [comentariosZoom, setComentariosZoom] = useState<ComentarioPortfolio[]>([])
  const [comentariosSlideAtual, setComentariosSlideAtual] = useState<ComentarioPortfolio[]>([])
  const [currentSlide, setCurrentSlide] = useState<number>(0)
  const [legendaEdit, setLegendaEdit] = useState<string>('')
  const [salvandoLegenda, setSalvandoLegenda] = useState<boolean>(false)
  const [projetosEncontrados, setProjetosEncontrados] = useState<ProjetoIdentificado[]>([])
  const [statusTitulo, setStatusTitulo] = useState<string>('ocioso')

  // ── FIX 1: fotosCarrossel estabilizado com useMemo ───────────────────────
  // Antes: era recalculado a cada render, gerando nova referência de array que
  // disparava os useEffects de slide e comentários desnecessariamente.
  const fotosCarrossel = useMemo(() => [
    { etapa: 1, url: fotosUrls[1], label: "Início" },
    { etapa: 2, url: fotosUrls[2], label: "Execução" },
    { etapa: 3, url: fotosUrls[3], label: "Conclusão" }
  ].filter(f => f.url), [fotosUrls])

  const fotoAtual = fotosCarrossel[currentSlide] || {}

  // ── Variáveis Derivadas ──────────────────────────────────────────────────
  const hasLegendaSalva = (etapa: number | null) =>
    !!(etapa && fotosData[etapa]?.legenda && fotosData[etapa]?.legenda!.trim().length > 0)

  const isProjetoConcluido = projetoStatus?.toLowerCase() === 'finalizado'
  const isProjetoPendente = ['pendente', 'em_registro'].includes(projetoStatus?.toLowerCase())

  const phoneDigitado = cleanPhone(clienteWhatsapp)
  const phonePrestador = cleanPhone(prestadorInfo.whatsapp)
  const isSelfNumber = phoneDigitado.length >= 10 && phoneDigitado === phonePrestador
  const isPhoneValid = phoneDigitado.length >= 10 && !isSelfNumber
  const isTitleValid = titulo.trim().length > 3

  const canCloseZoom = isProjetoConcluido || comentariosZoom.length > 0 || hasLegendaSalva(zoomEtapa)

  // ── Efeitos ──────────────────────────────────────────────────────────────
  useEffect(() => {
    setErroUpload(null)
    if (zoomEtapa) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => { document.body.style.overflow = 'unset' }
  }, [zoomEtapa])

  const carregarDadosBase = useCallback(async () => {
    try {
      const data = await getPrestadorBaseInfo(Number(prestadorId))
      if (data) {
        setPrestadorInfo({
          nome: data.nome,
          foto: renderAvatar(data.foto_perfil),
          whatsapp: data.whatsapp || '',
          slug: data.slug || null
        })
      }
    } catch (err) {
      console.error('Erro ao carregar dados base:', err)
    }
  }, [prestadorId])

  const carregarProgresso = useCallback(async (projId: string) => {
    try {
      const fotos = await getFotosDoProjeto(projId)
      if (fotos) {
        const fMap: Record<number, string | null> = { 1: null, 2: null, 3: null }
        const dMap: Record<number, FotoPortfolio | null> = { 1: null, 2: null, 3: null }
        fotos.forEach(f => { fMap[f.ordem] = f.url_foto; dMap[f.ordem] = f })
        setFotosUrls(fMap)
        setFotosData(dMap)
      }
    } catch (err) {
      console.error('Erro ao carregar progresso:', err)
    }
  }, [])

  useEffect(() => {
    const buscarProjetos = async () => {
      const phoneLimpo = clienteWhatsapp.replace(/\D/g, '')
      if (phoneLimpo.length >= 10 && !isSelfNumber && !projetoExistente) {
        try {
          const data = await buscarProjetosPorTelefone(Number(prestadorId), phoneLimpo)
          setProjetosEncontrados(data || [])
        } catch (err) {
          console.error('Erro ao buscar projetos:', err)
        }
      }
    }
    const timeoutId = setTimeout(buscarProjetos, 800)
    return () => clearTimeout(timeoutId)
  }, [clienteWhatsapp, prestadorId, isSelfNumber, projetoExistente])

  useEffect(() => {
    if (zoomEtapa && fotosData[zoomEtapa]) {
      setLegendaEdit(fotosData[zoomEtapa]?.legenda || '')
    }
  }, [zoomEtapa, fotosData])

  // ── FIX 3: dep estabilizada — só busca comentários quando o ID da foto mudar
  // Antes: [zoomEtapa, fotosData] — fotosData é objeto, muda referência ao salvar
  // legenda, causando nova busca desnecessária em paralelo com o upload.
  const fotoIdParaZoom = zoomEtapa ? fotosData[zoomEtapa]?.id : undefined
  useEffect(() => {
    if (!zoomEtapa || !fotoIdParaZoom) return
    const idFoto = fotoIdParaZoom
    let cancelado = false
    const buscar = async () => {
      try {
        const data = await getComentariosDaFoto(idFoto)
        if (!cancelado) setComentariosZoom(data || [])
      } catch (err) {
        console.error('Erro ao buscar comentários do zoom:', err)
      }
    }
    buscar()
    return () => { cancelado = true }
  }, [zoomEtapa, fotoIdParaZoom])

  useEffect(() => {
    if (!isProjetoConcluido || !fotosCarrossel[currentSlide]) return
    const etapaAtual = fotosCarrossel[currentSlide].etapa
    const fotoIdAtual = fotosData[etapaAtual]?.id
    if (!fotoIdAtual) { setComentariosSlideAtual([]); return }
    let cancelado = false
    const buscar = async () => {
      try {
        const data = await getComentariosDaFoto(fotoIdAtual)
        if (!cancelado) setComentariosSlideAtual(data || [])
      } catch (err) {
        console.error('Erro ao buscar comentários do slide:', err)
      }
    }
    buscar()
    return () => { cancelado = true }
  }, [currentSlide, isProjetoConcluido, fotosCarrossel, fotosData])

  useEffect(() => {
    if (isProjetoConcluido && fotosCarrossel.length > 0) {
      setCurrentSlide(fotosCarrossel.length - 1)
    }
  }, [isProjetoConcluido, fotosCarrossel.length])

  useEffect(() => {
    carregarDadosBase()
    if (projeto) {
      setProjetoId(projeto.id)
      setTitulo(projeto.titulo || '')
      setClienteWhatsapp(maskPhone(projeto.cliente_whatsapp))
      setClienteNome(projeto.cliente_nome || '')
      carregarProgresso(projeto.id)
    }
  }, [projetoExistente, carregarProgresso, carregarDadosBase])

  // ── FIX 2: loop de sincronização removido ────────────────────────────────
  // Antes: deps [projetoId, projetoStatus] — setProjetoStatus() dentro do efeito
  // alterava projetoStatus, que estava nas deps, re-disparando o efeito em loop
  // infinito de requisições enquanto o modal ficava aberto.
  // Fix: apenas [projetoId] como dep. Usamos ref para ler o status atual sem
  // adicioná-lo como dep reativa.
  const projetoStatusRef = useRef(projetoStatus)
  projetoStatusRef.current = projetoStatus

  useEffect(() => {
    if (!projetoId) return
    const idSincronizado = projetoId
    const sincronizarStatus = async () => {
      try {
        const data = await getStatusETokenProjeto(idSincronizado)
        if (data) {
          if (data.status !== projetoStatusRef.current) setProjetoStatus(data.status)
          if (data.status === 'em_execucao') {
            const fotos = await getFotosDoProjeto(idSincronizado)
            const temFoto3 = fotos?.some(f => f.ordem === 3)
            if (temFoto3) setAguardandoAvaliacao(true)
          }
          if (data.status === 'finalizado') setAguardandoAvaliacao(false)
        }
      } catch (err) {
        console.error('Erro ao sincronizar status:', err)
      }
    }
    sincronizarStatus()
  }, [projetoId]) // ← projetoStatus removido das deps intencionalmente

  // ── Ações ────────────────────────────────────────────────────────────────
  const handleShare = async () => {
    let token = ''
    if (projetoId) {
      try {
        const projData = await getStatusETokenProjeto(projetoId)
        token = projData?.avaliacao_token || ''
      } catch (err) { }
    }
    const linkProjeto = `${window.location.origin}/meus-servicos${token ? `?token=${token}` : ''}`
    const shareData = {
      title: `Projeto: ${titulo}`,
      text: `Olá! Acompanhe o progresso do serviço "${titulo}" em tempo real através deste link exclusivo.`,
      url: linkProjeto
    }
    try {
      if (navigator.share) {
        await navigator.share(shareData)
      } else {
        await navigator.clipboard.writeText(shareData.url)
        alert('Link do projeto copiado!')
      }
    } catch (err) {
      console.error('Erro ao compartilhar:', err)
    }
  }

  const handleUpload = async (e: ChangeEvent<HTMLInputElement>, ordem: number) => {
    const file = e.target.files?.[0]
    if (!file) return

    const MAX_MB = 10
    const sizeMB = file.size / (1024 * 1024)
    if (sizeMB > MAX_MB) {
      setErroUpload(`A imagem tem ${sizeMB.toFixed(1)}MB. O limite é de ${MAX_MB}MB. Reduza o tamanho e tente novamente.`)
      e.target.value = ''
      return
    }
    setErroUpload(null)
    setLoadingEtapa(prev => ({ ...prev, [ordem]: true }))

    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${Math.random()}.${fileExt}`
      const filePath = `${prestadorId}/${fileName}`

      const publicUrl = await uploadImagemPortfolio(filePath, file)

      let currentProjId: string = projetoId || ''

      if (!currentProjId) {
        const newProj = await criarNovoProjeto({
          prestador_id: Number(prestadorId),
          titulo: titulo,
          cliente_whatsapp: phoneDigitado,
          cliente_nome: clienteNome.trim() || 'Cliente',
          status: 'em_registro',
          avaliacao_token: crypto.randomUUID()
        })
        currentProjId = newProj.id
        setProjetoId(newProj.id)
        setProjetoStatus('em_registro')
      }

      const data = await upsertFotoProjeto({
        projeto_id: currentProjId,
        url_foto: publicUrl,
        ordem: ordem,
        prestador_id: Number(prestadorId)
      })

      setFotosUrls(prev => ({ ...prev, [ordem]: publicUrl }))
      setFotosData(prev => ({ ...prev, [ordem]: data }))
      setLegendaEdit(data.legenda || '')
      setZoomEtapa(ordem)

      if (ordem === 3) {
        setAguardandoAvaliacao(true)
        await atualizarStatusProjeto(currentProjId, 'em_execucao')
        setProjetoStatus('em_execucao')
      }
    } catch (err) {
      console.error("Erro no upload:", err)
      setErroUpload('Não foi possível enviar a imagem. Verifique sua conexão e tente novamente.')
    } finally {
      setLoadingEtapa(prev => ({ ...prev, [ordem]: false }))
      e.target.value = ''
    }
  }

  const handleSalvarLegenda = async () => {
    const etapaAlvo = zoomEtapa
    const fotoAlvo = etapaAlvo ? fotosData[etapaAlvo] : null
    if (!etapaAlvo || !fotoAlvo) return

    setSalvandoLegenda(true)
    setErroLegenda(null)

    try {
      await atualizarLegendaFoto(fotoAlvo.id, legendaEdit)
      setFotosData(prev => {
        const atual = prev[etapaAlvo]
        if (!atual) return prev
        return { ...prev, [etapaAlvo]: { ...atual, legenda: legendaEdit } }
      })
    } catch (err: any) {
      console.error('Erro ao salvar legenda — RAW:', err)
      setErroLegenda('Não foi possível salvar a descrição. Tente novamente.')
      setTimeout(() => setErroLegenda(null), 4000)
    } finally {
      setSalvandoLegenda(false)
    }
  }

  const handleAtualizarTitulo = async () => {
    if (!projetoId || !isTitleValid) return
    setStatusTitulo('salvando')
    try {
      await atualizarTituloProjeto(projetoId, titulo.trim())
      setStatusTitulo('salvo')
      setTimeout(() => setStatusTitulo('ocioso'), 3000)
    } catch (err) {
      console.error("Erro ao atualizar título:", err)
      setStatusTitulo('ocioso')
      setErroTitulo('Erro ao salvar título.')
      setTimeout(() => setErroTitulo(null), 3000)
    }
  }

  const gerarLinkAceite = async () => {
    setLinkGerado(true)
    if (projetoId) {
      const currentId = projetoId
      if (projetoStatus === 'em_registro') {
        await atualizarStatusProjeto(currentId, 'pendente')
        setProjetoStatus('pendente')
      }
      const projData = await getStatusETokenProjeto(currentId)
      const token = projData?.avaliacao_token
      const numTelefone = clienteWhatsapp.replace(/\D/g, '')
      const linkProjeto = `${window.location.origin}/meus-servicos${token ? `?token=${token}` : ''}`
      const mensagem = `Olá${clienteNome ? `, ${clienteNome}` : ''}! 👋\n\nRegistramos o início do serviço *${titulo}* e preparamos um acompanhamento exclusivo para você.\n\nPor este link você visualiza as fotos de cada etapa e pode deixar comentários em tempo real:\n\n🔗 ${linkProjeto}\n\nAssim que confirmar o início, seguimos com o serviço. Qualquer dúvida, é só chamar!`
      const urlWhatsapp = `https://wa.me/55${numTelefone}?text=${encodeURIComponent(mensagem)}`
      window.open(urlWhatsapp, '_blank')
    }
  }

  const gerarLinkConclusao = async () => {
    if (!projetoId) return
    const currentId = projetoId
    const projData = await getStatusETokenProjeto(currentId)
    const token = projData?.avaliacao_token
    const numTelefone = clienteWhatsapp.replace(/\D/g, '')
    const linkAvaliacao = `${window.location.origin}/avaliar/${token}`
    const mensagem = `Olá${clienteNome ? `, ${clienteNome}` : ''}! 🎉\n\nO serviço *${titulo}* foi concluído com sucesso!\n\nAcesse o link abaixo para conferir as fotos do resultado final e deixar sua avaliação — ela é muito importante para nós:\n\n🔗 ${linkAvaliacao}\n\nFoi um prazer trabalhar com você!`
    const urlWhatsapp = `https://wa.me/55${numTelefone}?text=${encodeURIComponent(mensagem)}`
    window.open(urlWhatsapp, '_blank')
  }

  const selecionarProjeto = (proj: ProjetoIdentificado) => {
    setProjetoId(proj.id)
    setTitulo(proj.titulo)
    setClienteNome(proj.cliente_nome || '')
    setClienteWhatsapp(prev => maskPhone(prev))
    setProjetoStatus(proj.status)
    setLinkGerado(true)
    carregarProgresso(proj.id)
    setProjetosEncontrados([])
  }

  const nextSlide = (e?: React.MouseEvent) => {
    e?.stopPropagation()
    setCurrentSlide((prev) => (prev + 1) % fotosCarrossel.length)
  }

  const prevSlide = (e?: React.MouseEvent) => {
    e?.stopPropagation()
    setCurrentSlide((prev) => (prev - 1 + fotosCarrossel.length) % fotosCarrossel.length)
  }

  const handleZoomClose = () => { if (canCloseZoom) setZoomEtapa(null) }

  return {
    state: {
      loadingEtapa, erroUpload, erroLegenda, erroTitulo, aguardandoAvaliacao,
      projetoId, projetoStatus, titulo, clienteWhatsapp, clienteNome, linkGerado,
      fotosUrls, fotosData, zoomEtapa, comentariosZoom, comentariosSlideAtual,
      currentSlide, legendaEdit, salvandoLegenda, projetosEncontrados, statusTitulo,
      prestadorInfo
    },
    derived: {
      hasLegendaSalva, isProjetoConcluido, isProjetoPendente, isSelfNumber,
      isPhoneValid, isTitleValid, canCloseZoom, fotosCarrossel, fotoAtual
    },
    actions: {
      setErroUpload, setErroLegenda,
      setClienteWhatsapp: (v: string | null) => setClienteWhatsapp(maskPhone(v)),
      setClienteNome, setTitulo, setZoomEtapa, setLegendaEdit,
      handleShare, handleUpload, handleSalvarLegenda, handleAtualizarTitulo,
      gerarLinkAceite, gerarLinkConclusao, selecionarProjeto, nextSlide, prevSlide, handleZoomClose
    }
  }
}