'use client'
import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { 
  Smartphone, Camera, X, Loader2, User, 
  CheckCircle2, ChevronRight, ChevronLeft, MoreHorizontal, 
  Activity, Share2, MessageSquare, AlertCircle, Link as LinkIcon,
  CloudCheck, RefreshCw
} from 'lucide-react'

export default function UploadWizard({ prestadorId, projetoExistente = null, onComplete }) {
  const [loadingEtapa, setLoadingEtapa] = useState({ 1: false, 2: false, 3: false })
  const [erroUpload, setErroUpload] = useState(null)
  const [erroLegenda, setErroLegenda] = useState(null)
  const [erroTitulo, setErroTitulo] = useState(null)
  const [aguardandoAvaliacao, setAguardandoAvaliacao] = useState(false)
  const [projetoId, setProjetoId] = useState(projetoExistente?.id || null)
  const [projetoStatus, setProjetoStatus] = useState(projetoExistente?.status || 'pendente')
  const [titulo, setTitulo] = useState(projetoExistente?.titulo || '')
  const [prestadorInfo, setPrestadorInfo] = useState({ nome: '', foto: null, whatsapp: '' })
  const [clienteWhatsapp, setClienteWhatsapp] = useState(projetoExistente?.cliente_whatsapp || '')
  const [clienteNome, setClienteNome] = useState(projetoExistente?.cliente_nome || '') 
  const [linkGerado, setLinkGerado] = useState(!!projetoExistente) 
  const [fotosUrls, setFotosUrls] = useState({ 1: null, 2: null, 3: null })
  const [fotosData, setFotosData] = useState({ 1: null, 2: null, 3: null }) 
  const [zoomEtapa, setZoomEtapa] = useState(null)
  const [comentariosZoom, setComentariosZoom] = useState([])
  const [comentariosSlideAtual, setComentariosSlideAtual] = useState([]) 
  const [currentSlide, setCurrentSlide] = useState(0)
  const [legendaEdit, setLegendaEdit] = useState('')
  const [salvandoLegenda, setSalvandoLegenda] = useState(false)
  const [projetosEncontrados, setProjetosEncontrados] = useState([])
  const [statusTitulo, setStatusTitulo] = useState('ocioso') // ocioso, salvando, salvo

  // --- FUNÇÕES DE UTILIDADE E VALIDAÇÃO ---
  const hasLegendaSalva = (etapa) => !!(fotosData[etapa]?.legenda && fotosData[etapa].legenda.trim().length > 0)
  
  const isProjetoConcluido = projetoStatus?.toLowerCase() === 'finalizado'
  const isProjetoPendente = ['pendente', 'em_registro'].includes(projetoStatus?.toLowerCase())
  
  const cleanPhone = (phone) => phone?.replace(/\D/g, '') || ''
  const phoneDigitado = cleanPhone(clienteWhatsapp)
  const phonePrestador = cleanPhone(prestadorInfo.whatsapp) 
  const isSelfNumber = phoneDigitado.length >= 10 && phoneDigitado === phonePrestador
  const isPhoneValid = phoneDigitado.length >= 10 && !isSelfNumber
  const isTitleValid = titulo.trim().length > 3
  
  const canCloseZoom = isProjetoConcluido || comentariosZoom.length > 0 || hasLegendaSalva(zoomEtapa)

  useEffect(() => {
    if (zoomEtapa) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => { document.body.style.overflow = 'unset' }
  }, [zoomEtapa])

  const handleShare = async () => {
    let token = ''
    if (projetoId) {
      const { data: projData } = await supabase
        .from('portfolio_projetos')
        .select('avaliacao_token')
        .eq('id', projetoId)
        .single()
      token = projData?.avaliacao_token || ''
    }

    const linkProjeto = `${window.location.origin}/meus-servicos${token ? `?token=${token}` : ''}`

    const shareData = {
      title: `Projeto: ${titulo}`,
      text: `Olá! Acompanhe o progresso do serviço "${titulo}" em tempo real através deste link exclusivo.`,
      url: linkProjeto
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(shareData.url);
        alert('Link do projeto copiado!');
      }
    } catch (err) {
      console.error('Erro ao compartilhar:', err);
    }
  };

  const renderAvatar = (url) => url && url.trim() !== "" ? url : null;

  const fotosCarrossel = [
    { etapa: 1, url: fotosUrls[1], label: "Início" },
    { etapa: 2, url: fotosUrls[2], label: "Execução" },
    { etapa: 3, url: fotosUrls[3], label: "Conclusão" }
  ].filter(f => f.url)

  const carregarDadosBase = useCallback(async () => {
    const { data: pData } = await supabase.from('prestadores').select('nome, foto_perfil, whatsapp').eq('id', prestadorId).single()
    if (pData) setPrestadorInfo({ nome: pData.nome, foto: renderAvatar(pData.foto_perfil), whatsapp: pData.whatsapp })
  }, [prestadorId])

  const carregarProgresso = useCallback(async (projId) => {
    const { data: fotos } = await supabase.from('portfolio_fotos').select('*').eq('projeto_id', projId)
    if (fotos) {
      const fMap = { 1: null, 2: null, 3: null }; const dMap = { 1: null, 2: null, 3: null }
      fotos.forEach(f => { fMap[f.ordem] = f.url_foto; dMap[f.ordem] = f })
      setFotosUrls(fMap); setFotosData(dMap)
    }
  }, [])

  const handleUpload = async (e, ordem) => {
    const file = e.target.files[0]
    if (!file) return

    // ── Validação de tamanho: máx 10MB, erro visível ao usuário ──────────
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

      const { error: uploadError } = await supabase.storage.from('portfolios').upload(filePath, file)
      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage.from('portfolios').getPublicUrl(filePath)

      let currentProjId = projetoId

      if (!currentProjId) {
        const { data: newProj, error: projError } = await supabase
          .from('portfolio_projetos')
          .insert({
            prestador_id: prestadorId,
            titulo: titulo,
            cliente_whatsapp: phoneDigitado,
            cliente_nome: clienteNome.trim() || 'Cliente',
            status: 'em_registro',
            avaliacao_token: crypto.randomUUID()
          })
          .select()
          .single()

        if (projError) throw projError
        currentProjId = newProj.id
        setProjetoId(newProj.id)
        setProjetoStatus('em_registro')
      }

      const { data, error } = await supabase
        .from('portfolio_fotos')
        .upsert({
          projeto_id: currentProjId,
          url_foto: publicUrl,
          ordem: ordem,
          prestador_id: prestadorId
        }, { onConflict: 'projeto_id, ordem' })
        .select()
        .single()

      if (!error) {
        setFotosUrls(prev => ({ ...prev, [ordem]: publicUrl }))
        setFotosData(prev => ({ ...prev, [ordem]: data }))
        setLegendaEdit(data.legenda || '')
        setZoomEtapa(ordem)
        // Foto de conclusão enviada: aguardar avaliação do cliente
        if (ordem === 3) setAguardandoAvaliacao(true)
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
    if (!zoomEtapa || !fotosData[zoomEtapa]) return
    setSalvandoLegenda(true)
    try {
      const { error } = await supabase
        .from('portfolio_fotos')
        .update({ legenda: legendaEdit })
        .eq('id', fotosData[zoomEtapa].id)
        
      if (!error) {
        setFotosData(prev => ({
          ...prev,
          [zoomEtapa]: { ...prev[zoomEtapa], legenda: legendaEdit }
        }))
      }
    } catch (err) {
      console.error("Erro ao salvar legenda:", err)
      setErroLegenda('Não foi possível salvar a descrição. Tente novamente.')
    } finally {
      setSalvandoLegenda(false)
    }
  }

  const handleAtualizarTitulo = async () => {
    if (!projetoId || !isTitleValid) return
    setStatusTitulo('salvando')
    try {
      const { error } = await supabase
        .from('portfolio_projetos')
        .update({ titulo: titulo.trim() })
        .eq('id', projetoId)
      
      if (!error) {
        setStatusTitulo('salvo')
        setTimeout(() => setStatusTitulo('ocioso'), 3000)
      }
    } catch (err) {
      console.error("Erro ao atualizar título:", err)
      setStatusTitulo('ocioso')
      setErroTitulo('Erro ao salvar título.')
      setTimeout(() => setErroTitulo(null), 3000)
    }
  }

  const gerarLinkAceite = async () => {
      setLinkGerado(true)
      
      if (projetoStatus === 'em_registro') {
          await supabase.from('portfolio_projetos').update({ status: 'pendente' }).eq('id', projetoId)
          setProjetoStatus('pendente')
      }

      const { data: projData } = await supabase
        .from('portfolio_projetos')
        .select('avaliacao_token')
        .eq('id', projetoId)
        .single()
        
      const token = projData?.avaliacao_token
      const numTelefone = clienteWhatsapp.replace(/\D/g, '')
      
      const linkProjeto = `${window.location.origin}/meus-servicos${token ? `?token=${token}` : ''}` 
      const mensagem = `Olá${clienteNome ? ` ${clienteNome}` : ''}! O projeto *${titulo}* foi iniciado.\n\nVocê pode acompanhar todas as etapas, fotos e adicionar comentários através do link exclusivo abaixo:\n\n👉 ${linkProjeto}\n\nAguardamos seu aceite para seguirmos com o serviço!`
      const urlWhatsapp = `https://wa.me/55${numTelefone}?text=${encodeURIComponent(mensagem)}`
      window.open(urlWhatsapp, '_blank')
  }

  const gerarLinkConclusao = async () => {
    const { data: projData } = await supabase
      .from('portfolio_projetos')
      .select('avaliacao_token')
      .eq('id', projetoId)
      .single()

    const token = projData?.avaliacao_token
    const numTelefone = clienteWhatsapp.replace(/\D/g, '')
    const linkAvaliacao = `${window.location.origin}/avaliar/${projetoId}?token=${token}`
    const mensagem = `Olá${clienteNome ? ` ${clienteNome}` : ''}! O serviço *${titulo}* foi concluído! 🎉\n\nAcesse o link abaixo para ver as fotos finais e deixar sua avaliação:\n\n👉 ${linkAvaliacao}\n\nSua opinião é muito importante!`
    const urlWhatsapp = `https://wa.me/55${numTelefone}?text=${encodeURIComponent(mensagem)}`
    window.open(urlWhatsapp, '_blank')
  }

  useEffect(() => {
    const buscarProjetos = async () => {
      const phoneLimpo = clienteWhatsapp.replace(/\D/g, '')
      if (phoneLimpo.length >= 10 && !isSelfNumber && !projetoExistente) {
        const { data } = await supabase
          .from('portfolio_projetos')
          .select('id, titulo, status, cliente_nome, created_at')
          .eq('prestador_id', prestadorId)
          .eq('cliente_whatsapp', phoneLimpo)
          .order('created_at', { ascending: false })

        if (data && data.length > 0) {
          setProjetosEncontrados(data)
        } else {
          setProjetosEncontrados([])
        }
      }
    }
    const timeoutId = setTimeout(buscarProjetos, 800)
    return () => clearTimeout(timeoutId)
  }, [clienteWhatsapp, prestadorId, isSelfNumber, projetoExistente])

  const selecionarProjeto = (proj) => {
    setProjetoId(proj.id)
    setTitulo(proj.titulo)
    setClienteNome(proj.cliente_nome || '')
    setProjetoStatus(proj.status)
    setLinkGerado(true)
    carregarProgresso(proj.id)
    setProjetosEncontrados([])
  }

  useEffect(() => {
    if (zoomEtapa && fotosData[zoomEtapa]) {
      setLegendaEdit(fotosData[zoomEtapa].legenda || '')
    }
  }, [zoomEtapa, fotosData])

  useEffect(() => {
    if (zoomEtapa && fotosData[zoomEtapa]?.id) {
      const buscar = async () => {
        const { data } = await supabase.from('portfolio_comentarios').select('*').eq('foto_id', fotosData[zoomEtapa].id).eq('autor_tipo', 'cliente').order('criado_at', { ascending: true })
        setComentariosZoom(data || [])
      }
      buscar()
    }
  }, [zoomEtapa, fotosData])

  useEffect(() => {
    if (isProjetoConcluido && fotosCarrossel[currentSlide]) {
      const etapaAtual = fotosCarrossel[currentSlide].etapa
      const fotoIdAtual = fotosData[etapaAtual]?.id
      if (fotoIdAtual) {
        const buscar = async () => {
          const { data } = await supabase.from('portfolio_comentarios').select('*').eq('foto_id', fotoIdAtual).eq('autor_tipo', 'cliente').order('criado_at', { ascending: true })
          setComentariosSlideAtual(data || [])
        }
        buscar()
      } else {
        setComentariosSlideAtual([])
      }
    }
  }, [currentSlide, isProjetoConcluido, fotosCarrossel, fotosData])

  useEffect(() => {
    if (isProjetoConcluido && fotosCarrossel.length > 0) {
      setCurrentSlide(fotosCarrossel.length - 1)
    }
  }, [isProjetoConcluido])

  useEffect(() => {
    carregarDadosBase()
    if (projetoExistente) {
      setProjetoId(projetoExistente.id); setTitulo(projetoExistente.titulo);
      setClienteWhatsapp(projetoExistente.cliente_whatsapp); 
      setClienteNome(projetoExistente.cliente_nome);
      carregarProgresso(projetoExistente.id)
    }
  }, [projetoExistente, carregarProgresso, carregarDadosBase])

  // Sincroniza o status do projeto com o banco ao montar (evita status stale entre sessões).
  // Cenário corrigido: prestador abre o wizard no dia seguinte e o cliente já tinha aceitado —
  // sem isso, projetoStatus viria como 'pendente' do prop e o botão "Enviar WhatsApp" apareceria indevidamente.
  useEffect(() => {
    if (!projetoId) return
    const sincronizarStatus = async () => {
      const { data } = await supabase
        .from('portfolio_projetos')
        .select('status')
        .eq('id', projetoId)
        .single()
      if (data) {
        if (data.status !== projetoStatus) setProjetoStatus(data.status)
        // Prestador subiu foto 3 mas cliente ainda não avaliou
        if (data.status === 'em_execucao') {
          const { data: fotos } = await supabase
            .from('portfolio_fotos')
            .select('ordem')
            .eq('projeto_id', projetoId)
          const temFoto3 = fotos?.some(f => f.ordem === 3)
          if (temFoto3) setAguardandoAvaliacao(true)
        }
        // Cliente avaliou — status virou finalizado
        if (data.status === 'finalizado') setAguardandoAvaliacao(false)
      }
    }
    sincronizarStatus()
  }, [projetoId]) // roda ao mount e sempre que projetoId muda (ex: selecionarProjeto)

  const nextSlide = (e) => { e?.stopPropagation(); setCurrentSlide((prev) => (prev + 1) % fotosCarrossel.length) }
  const prevSlide = (e) => { e?.stopPropagation(); setCurrentSlide((prev) => (prev - 1 + fotosCarrossel.length) % fotosCarrossel.length) }
  const fotoAtual = fotosCarrossel[currentSlide] || {}

  return (
    <>
      <div className="bg-white rounded-[3rem] border border-slate-100 shadow-2xl overflow-hidden max-w-xl mx-auto font-sans animate-in fade-in duration-500">
        
        {isProjetoConcluido ? (
           <div className="flex flex-col w-full">
             <div className="p-4 md:p-5 flex items-center justify-between border-b border-slate-50 shrink-0 bg-white z-10">
               <div className="flex items-center gap-3">
                 <div className="w-10 h-10 rounded-2xl flex items-center justify-center border bg-green-50 border-green-100 text-green-600">
                   <CheckCircle2 size={18} />
                 </div>
                 <div>
                   <h3 className="text-[11px] font-black text-slate-800 uppercase italic leading-none tracking-tight">{titulo}</h3>
                   <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Serviço Concluído</p>
                 </div>
               </div>
               <MoreHorizontal className="text-slate-300 cursor-pointer" />
             </div>

             <div className="relative bg-slate-900 flex items-center justify-center min-h-[350px] overflow-hidden group">
                <img src={fotoAtual.url} className="absolute inset-0 w-full h-full object-cover blur-3xl opacity-40 scale-125" aria-hidden="true" />
                <img src={fotoAtual.url} className="relative z-10 max-w-full max-h-full object-contain shadow-2xl" alt="Registro final" />
                <div className="absolute top-6 right-6 bg-black/60 backdrop-blur-xl text-white px-4 py-2 rounded-full text-[9px] font-black uppercase tracking-[0.2em] border border-white/20 z-30">
                  Fase 0{fotoAtual.etapa}
                </div>
                {fotosCarrossel.length > 1 && (
                  <div className="absolute inset-x-4 top-1/2 -translate-y-1/2 flex justify-between items-center z-40">
                    <button onClick={prevSlide} className="w-10 h-10 bg-white/10 hover:bg-white/90 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:text-slate-900 transition-all shadow-xl active:scale-90 border border-white/10"><ChevronLeft size={20} /></button>
                    <button onClick={nextSlide} className="w-10 h-10 bg-white/10 hover:bg-white/90 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:text-slate-900 transition-all shadow-xl active:scale-90 border border-white/10"><ChevronRight size={20} /></button>
                  </div>
                )}
             </div>

             <div className="flex flex-col bg-white border-t border-slate-50 overflow-hidden">
                <div className="p-6 space-y-6">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-4 bg-blue-600 rounded-full"></div>
                      <span className="font-black text-slate-900 uppercase text-[10px] tracking-widest italic">Legenda</span>
                    </div>
                    <p className="text-xs font-medium text-slate-600 leading-relaxed italic pl-4 border-l-2 border-slate-100">
                      {fotosData[fotoAtual.etapa]?.legenda || "Nenhum detalhamento."}
                    </p>
                  </div>
                  <div className="space-y-4 pt-4 border-t border-slate-50">
                    <div className="flex items-center justify-between">
                      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Interações do Cliente</h4>
                      <div className="flex gap-1.5">
                         {fotosCarrossel.map((_, i) => (
                           <div key={i} className={`h-1.5 rounded-full transition-all duration-300 ${currentSlide === i ? 'w-6 bg-blue-600' : 'w-1.5 bg-slate-200'}`} />
                         ))}
                      </div>
                    </div>
                    {comentariosSlideAtual.length === 0 ? (
                      <p className="text-[11px] text-slate-300 italic pl-1">Sem comentários para esta fase.</p>
                    ) : (
                      comentariosSlideAtual.map((com) => (
                        <div key={com.id} className="flex gap-3 animate-in fade-in slide-in-from-left-2 duration-300">
                          <div className="w-8 h-8 rounded-xl bg-slate-50 shrink-0 flex items-center justify-center border border-slate-100 shadow-sm">
                             <User size={14} className="text-slate-400" />
                          </div>
                          <div className="max-w-[85%] p-3 rounded-2xl text-xs font-bold leading-tight bg-slate-50 text-slate-700 rounded-tl-none border border-slate-100">
                             {com.texto}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
                <div className="p-5 px-8 border-t border-slate-50 flex items-center justify-between bg-white shrink-0">
                  <div className="flex items-center gap-6 text-slate-400">
                     <Share2 size={22} className="hover:text-blue-600 cursor-pointer transition-colors" onClick={handleShare} />
                  </div>
                  <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest italic">ID: {projetoId?.split('-')[0] || '...'}</span>
                </div>
             </div>
           </div>

        ) : (
        
          <div className="p-8 space-y-8 overflow-y-auto max-h-[85vh] custom-scrollbar">

            {/* ── Banner aguardando avaliação do cliente ── */}
            {aguardandoAvaliacao && !isProjetoConcluido && (
              <div className="flex items-center gap-3 bg-blue-50 border border-blue-200 text-blue-700 p-4 rounded-2xl animate-in fade-in slide-in-from-top-2 duration-500">
                <Activity size={16} className="shrink-0 animate-pulse" />
                <div className="flex-1">
                  <p className="text-[11px] font-black uppercase tracking-wide leading-none mb-1">Serviço concluído</p>
                  <p className="text-[11px] font-medium leading-snug">Envie o link de avaliação para <span className="font-black">{clienteNome || 'o cliente'}</span> confirmar e avaliar o trabalho.</p>
                </div>
                <button
                  onClick={gerarLinkConclusao}
                  className="shrink-0 bg-blue-600 hover:bg-blue-700 text-white text-[9px] font-black uppercase px-3 py-2 rounded-xl transition-all active:scale-95 shadow-md"
                >
                  Enviar
                </button>
              </div>
            )}

            {/* ── Banner de erro de upload — visível, não silencioso ── */}
            {erroUpload && (
              <div className="flex items-start gap-3 bg-red-50 border border-red-200 text-red-700 p-4 rounded-2xl animate-in fade-in slide-in-from-top-2 duration-300">
                <AlertCircle size={16} className="shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-[11px] font-black uppercase tracking-wide leading-none mb-1">Imagem não enviada</p>
                  <p className="text-[11px] font-medium leading-snug">{erroUpload}</p>
                </div>
                <button onClick={() => setErroUpload(null)} className="text-red-400 hover:text-red-600 shrink-0">
                  <X size={14} />
                </button>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className={`p-4 rounded-[2rem] border transition-all flex flex-col justify-center gap-2 ${isSelfNumber ? 'bg-red-50/50 border-red-200' : isPhoneValid ? 'bg-blue-50/30 border-blue-100' : 'bg-white border-slate-200'}`}>
                 <div className="flex items-center gap-2 mb-1">
                   <Smartphone size={14} className={isSelfNumber ? "text-red-500" : isPhoneValid ? "text-blue-600" : "text-slate-400"} />
                   <span className={`text-[9px] font-bold uppercase italic tracking-widest ${isSelfNumber ? 'text-red-500' : 'text-slate-400'}`}>
                     {isSelfNumber ? 'Número Inválido' : 'Whatsapp do Cliente'}
                   </span>
                 </div>
                 {projetoId ? (
                   <span className="text-sm font-semibold text-slate-800 ml-1">{clienteWhatsapp}</span>
                 ) : (
                   <input 
                     type="tel"
                     placeholder="(00) 00000-0000"
                     className={`bg-transparent text-sm font-bold placeholder:text-slate-300 outline-none w-full ml-1 ${isSelfNumber ? 'text-red-600' : 'text-slate-800'}`}
                     value={clienteWhatsapp}
                     onChange={e => setClienteWhatsapp(e.target.value)}
                   />
                 )}
                 {isSelfNumber && (
                   <p className="text-[9px] font-bold text-red-500 flex items-center gap-1 mt-1 animate-in fade-in">
                     <AlertCircle size={10} /> Não use o seu próprio número.
                   </p>
                 )}
              </div>

              <div className={`p-4 rounded-[2rem] border transition-all flex flex-col justify-center gap-2 ${!isPhoneValid ? 'opacity-50 grayscale bg-slate-50' : 'bg-white border-slate-200'}`}>
                <span className="text-[9px] font-bold uppercase text-slate-400 italic tracking-widest mb-1">Nome do Cliente</span>
                {projetoId ? (
                   <span className="text-sm font-black text-slate-800 uppercase italic truncate ml-1">{clienteNome}</span>
                ) : (
                   <input 
                     type="text"
                     placeholder="Ex: João Silva"
                     disabled={!isPhoneValid}
                     className="bg-transparent text-sm font-black text-slate-800 uppercase italic placeholder:text-slate-300 outline-none w-full ml-1"
                     value={clienteNome}
                     onChange={e => setClienteNome(e.target.value)}
                   />
                )}
              </div>
            </div>

            <div className={`p-4 rounded-[2rem] border transition-all flex flex-col justify-center gap-2 ${!isPhoneValid ? 'opacity-50 grayscale bg-slate-50' : 'bg-white border-slate-200 focus-within:border-blue-300 relative'}`}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[9px] font-bold uppercase text-slate-400 italic tracking-widest">Título do Projeto</span>
                
                {projetoId && (
                  <div className="flex items-center gap-1.5 animate-in fade-in duration-300">
                    {statusTitulo === 'salvando' && (
                      <>
                        <RefreshCw size={10} className="animate-spin text-blue-500" />
                        <span className="text-[8px] font-black text-blue-500 uppercase tracking-tighter">Sincronizando...</span>
                      </>
                    )}
                    {statusTitulo === 'salvo' && (
                      <>
                        <CloudCheck size={12} className="text-green-500" />
                        <span className="text-[8px] font-black text-green-500 uppercase tracking-tighter">Salvo</span>
                      </>
                    )}
                  </div>
                )}
              </div>
              
              <input 
                type="text"
                placeholder="Ex: Corte de cabelo, pintura sala, instalação..."
                disabled={!isPhoneValid}
                className="bg-transparent text-sm font-black text-slate-800 uppercase italic placeholder:text-slate-300 outline-none w-full ml-1"
                value={titulo}
                onChange={e => setTitulo(e.target.value)}
                onBlur={handleAtualizarTitulo}
              />
            </div>

            {projetosEncontrados.length > 0 && !projetoId && (
              <div className="bg-slate-50 p-6 rounded-[2.5rem] border border-dashed border-slate-200 animate-in slide-in-from-top-4">
                <p className="text-[9px] font-black uppercase italic text-slate-400 mb-4 tracking-widest text-center">Projetos Identificados</p>
                <div className="space-y-3">
                  {projetosEncontrados.map(p => (
                    <button 
                      key={p.id}
                      onClick={() => selecionarProjeto(p)}
                      className="w-full bg-white p-4 rounded-2xl border border-slate-100 flex items-center justify-between hover:border-blue-300 hover:shadow-lg transition-all group"
                    >
                      <div className="text-left">
                        <p className="text-[10px] font-black text-slate-800 uppercase italic leading-none">{p.titulo}</p>
                        <p className="text-[8px] font-bold text-slate-400 uppercase mt-1">Status: {p.status}</p>
                      </div>
                      <div className="flex items-center gap-2 text-blue-600 font-black text-[9px] uppercase italic opacity-0 group-hover:opacity-100 transition-opacity">
                       Visualizar<ChevronRight size={14} />
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="relative space-y-4 before:absolute before:left-[47px] before:top-10 before:bottom-10 before:w-[2px] before:bg-slate-100 before:z-0">
              <div className={`relative z-10 flex items-center gap-6 group ${!isTitleValid ? 'opacity-40 pointer-events-none' : ''}`}>
                 <div className={`w-24 h-24 rounded-[2rem] shrink-0 border-4 border-white shadow-xl flex items-center justify-center overflow-hidden relative ${fotosUrls[1] ? 'bg-white' : 'bg-slate-100/50 border-slate-200 hover:border-blue-300'}`}>
                    {fotosUrls[1] ? (
                      <img src={fotosUrls[1]} onClick={() => setZoomEtapa(1)} className="w-full h-full object-cover cursor-pointer" />
                    ) : (
                      <>
                        <div className="flex flex-col items-center gap-1 text-blue-500/50">
                           {loadingEtapa[1] ? <Loader2 size={24} className="animate-spin" /> : <Camera size={24} />}
                           <span className="text-[8px] font-black uppercase italic">Antes</span>
                        </div>
                        <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => handleUpload(e, 1)} disabled={loadingEtapa[1] || !isTitleValid} />
                      </>
                    )}
                 </div>
                 <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                       <span className={`text-[9px] font-black uppercase tracking-tighter px-2 py-0.5 rounded-full border ${fotosUrls[1] ? 'bg-green-50 text-green-600 border-green-100' : 'bg-slate-100 text-slate-400 border-slate-200'}`}>
                        {fotosUrls[1] ? 'Registrado' : 'Obrigatório'}
                       </span>
                       <span className="text-[10px] font-black text-slate-400 uppercase italic">Etapa 1: Antes</span>
                    </div>
                    {isProjetoPendente && fotosUrls[1] && hasLegendaSalva(1) && (
                        <button onClick={gerarLinkAceite} className="mt-2 flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-xl shadow-lg shadow-green-200 transition-all active:scale-95">
                           <LinkIcon size={14} /> <span className="text-[10px] font-black uppercase italic">Enviar WhatsApp</span>
                        </button>
                    )}
                    
                    {fotosUrls[1] && !hasLegendaSalva(1) && (
                      <div className="mt-2 flex items-center gap-1.5 text-amber-600 animate-in fade-in duration-500">
                        <AlertCircle size={10} className="shrink-0" />
                        <span className="text-[8px] font-black uppercase italic leading-none">Adicione uma descrição</span>
                      </div>
                    )}
                    
                    {!fotosUrls[1] && isTitleValid && <p className="text-[9px] font-black text-blue-500 uppercase italic mt-1 animate-pulse">Aguardando Foto...</p>}
                 </div>
              </div>

              <div className={`relative z-10 flex items-center gap-6 group ${!linkGerado ? 'opacity-40 pointer-events-none grayscale' : ''}`}>
                 <div className={`w-24 h-24 rounded-[2rem] shrink-0 border-4 border-white shadow-xl flex items-center justify-center overflow-hidden relative ${fotosUrls[2] ? 'bg-white' : 'bg-slate-100/50 border-slate-200 hover:border-blue-300'}`}>
                    {fotosUrls[2] ? (
                      <img src={fotosUrls[2]} onClick={() => setZoomEtapa(2)} className="w-full h-full object-cover cursor-pointer" />
                    ) : (
                      <>
                        <div className="flex flex-col items-center gap-1 text-blue-500/50">
                           {loadingEtapa[2] ? <Loader2 size={24} className="animate-spin" /> : <Camera size={24} />}
                           <span className="text-[8px] font-black uppercase italic">Durante</span>
                        </div>
                        <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => handleUpload(e, 2)} disabled={loadingEtapa[2] || !linkGerado} />
                      </>
                    )}
                 </div>
                 <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-[9px] font-black uppercase tracking-tighter px-2 py-0.5 rounded-full border ${fotosUrls[2] ? 'bg-green-50 text-green-600 border-green-100' : 'bg-slate-100 text-slate-400 border-slate-200'}`}>
                        {fotosUrls[2] ? 'Registrado' : 'Aguardando...'}
                      </span>
                      <span className="text-[10px] font-black text-slate-400 uppercase italic">Etapa 2: Durante</span>
                    </div>
                    {!(projetoStatus?.toLowerCase() === 'finalizado' || fotosUrls[3]) && (
                      <h4 className="text-xs font-semibold text-slate-700 italic mt-1">
                        {isProjetoPendente ? "Aguardando Aceite" : (projetoStatus === 'em_execucao' || fotosUrls[2] ? "Em andamento" : "Aguardando...")}
                      </h4>
                    )}
                    {fotosUrls[2] && !hasLegendaSalva(2) && (
                      <div className="mt-1 flex items-center gap-1.5 text-amber-600 animate-in fade-in duration-500">
                        <AlertCircle size={10} className="shrink-0" />
                        <span className="text-[8px] font-black uppercase italic leading-none">Adicione uma descrição</span>
                      </div>
                    )}
                 </div>
              </div>

              <div className={`relative z-10 flex items-center gap-6 group ${!linkGerado ? 'opacity-40 pointer-events-none grayscale' : ''}`}>
                 <div className={`w-24 h-24 rounded-[2rem] shrink-0 border-4 border-white shadow-xl flex items-center justify-center overflow-hidden relative ${fotosUrls[3] ? 'bg-white' : 'bg-slate-100/50 border-slate-200 hover:border-blue-300'}`}>
                    {fotosUrls[3] ? (
                      <img src={fotosUrls[3]} onClick={() => setZoomEtapa(3)} className="w-full h-full object-cover cursor-pointer" />
                    ) : (
                      <>
                        <div className="flex flex-col items-center gap-1 text-blue-500/50">
                           {loadingEtapa[3] ? <Loader2 size={24} className="animate-spin" /> : <Camera size={24} />}
                           <span className="text-[8px] font-black uppercase italic">Depois</span>
                        </div>
                        <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => handleUpload(e, 3)} disabled={loadingEtapa[3] || !linkGerado} />
                      </>
                    )}
                 </div>
                 <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-[9px] font-black uppercase tracking-tighter px-2 py-0.5 rounded-full border ${fotosUrls[3] ? 'bg-green-50 text-green-600 border-green-100' : 'bg-slate-100 text-slate-400 border-slate-200'}`}>
                        {fotosUrls[3] ? 'Registrado' : 'Aguardando...'}
                      </span>
                      <span className="text-[10px] font-black text-slate-400 uppercase italic">Etapa 3: Depois</span>
                    </div>
                    {/* Foto enviada + descrição salva + aguardando avaliação */}
                    {fotosUrls[3] && hasLegendaSalva(3) && aguardandoAvaliacao && !isProjetoConcluido && (
                      <button
                        onClick={gerarLinkConclusao}
                        className="mt-2 flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl shadow-lg shadow-blue-100 transition-all active:scale-95"
                      >
                        <LinkIcon size={14} />
                        <span className="text-[10px] font-black uppercase italic">Enviar para avaliar</span>
                      </button>
                    )}
                    {/* Foto enviada mas ainda sem descrição */}
                    {fotosUrls[3] && !hasLegendaSalva(3) && (
                      <div className="mt-1 flex items-center gap-1.5 text-amber-600 animate-in fade-in duration-500">
                        <AlertCircle size={10} className="shrink-0" />
                        <span className="text-[8px] font-black uppercase italic leading-none">Adicione uma descrição</span>
                      </div>
                    )}
                    {/* Foto enviada + descrição + aguardando (sem botão extra) */}
                    {fotosUrls[3] && hasLegendaSalva(3) && aguardandoAvaliacao && (
                      <div className="mt-1 flex items-center gap-1.5 text-blue-500 animate-in fade-in duration-500">
                        <Activity size={10} className="shrink-0 animate-pulse" />
                        <span className="text-[8px] font-black uppercase italic leading-none">Aguardando avaliação</span>
                      </div>
                    )}
                    {/* Projeto finalizado pelo cliente */}
                    {isProjetoConcluido && (
                      <div className="mt-1 flex items-center gap-1.5 text-green-600 animate-in fade-in duration-300">
                        <CheckCircle2 size={10} className="shrink-0" />
                        <span className="text-[8px] font-black uppercase italic leading-none">Avaliado pelo cliente</span>
                      </div>
                    )}
                    {/* Sem foto ainda */}
                    {!fotosUrls[3] && (
                      <h4 className="text-xs font-semibold text-slate-400 italic mt-1">Aguardando...</h4>
                    )}
                 </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {zoomEtapa && (
        <div className="fixed inset-0 z-[200] bg-blue-950/90 backdrop-blur-md flex items-center justify-center p-2 md:p-8 animate-in fade-in duration-300">
          <button onClick={() => setZoomEtapa(null)} className="absolute top-6 right-6 text-white/50 hover:text-white transition-colors z-[210]">
            <X size={32} />
          </button>
          
          <div className="flex flex-col md:flex-row bg-white rounded-[3rem] overflow-hidden w-full max-w-5xl h-full max-h-[90vh] shadow-2xl">
            <div className="flex-[1.5] bg-slate-50 flex items-center justify-center relative overflow-hidden">
              <img src={fotosUrls[zoomEtapa]} className="absolute inset-0 w-full h-full object-cover blur-3xl opacity-10 scale-125" />
              <img src={fotosUrls[zoomEtapa]} className="relative z-10 max-w-full max-h-full object-contain" alt="Foto do registro" />
              <div className="absolute top-6 left-6 bg-blue-600/90 backdrop-blur-md px-4 py-2 rounded-full text-white text-[10px] font-black uppercase italic tracking-widest border border-blue-400/20 z-20">
                Registro 0{zoomEtapa}
              </div>
            </div>

            <div className="flex-1 p-6 md:p-10 flex flex-col bg-white overflow-hidden border-l border-slate-50">
              <div className="mb-8 shrink-0 border-b border-slate-50 pb-6">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-1.5 h-6 bg-blue-600 rounded-full"></div>
                  <h3 className="text-lg font-black text-slate-900 uppercase italic leading-none">Descrição desta fase</h3>
                </div>
                
                <div className="bg-blue-50/30 p-5 rounded-2xl border border-blue-100/50">
                  {!isProjetoConcluido && comentariosZoom.length === 0 ? (
                    <div className="flex flex-col gap-3">
                      <textarea
                        value={legendaEdit}
                        onChange={(e) => setLegendaEdit(e.target.value)}
                        placeholder="Adicione as descrição para esta fase..."
                        className="w-full bg-white border border-blue-100 rounded-xl p-3 text-xs font-medium italic text-slate-600 outline-none focus:border-blue-300 resize-none custom-scrollbar"
                        rows={3}
                      />
                      
                      <div className="flex items-center gap-3">
                        <div className="relative flex-1">
                           <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => handleUpload(e, zoomEtapa)} disabled={loadingEtapa[zoomEtapa]} />
                           <button className="w-full text-[9px] font-black uppercase tracking-widest bg-slate-100 text-slate-500 px-4 py-2 rounded-xl hover:bg-slate-200 transition-all flex items-center justify-center gap-2">
                              {loadingEtapa[zoomEtapa] ? <Loader2 size={12} className="animate-spin" /> : <Camera size={12} />} 
                              <span className="truncate">{loadingEtapa[zoomEtapa] ? 'Enviando...' : 'Trocar Foto'}</span>
                           </button>
                        </div>
                        <button
                          onClick={handleSalvarLegenda}
                          disabled={salvandoLegenda || legendaEdit.trim() === '' || legendaEdit === (fotosData[zoomEtapa]?.legenda || '')}
                          className="flex-[1.5] text-[9px] font-black uppercase tracking-widest bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-all shadow-md active:scale-95"
                        >
                          {salvandoLegenda ? 'Salvando...' : 'Salvar Descrição'}
                        </button>
                        {erroLegenda && (
                          <p className="text-[9px] text-red-500 font-bold mt-1">{erroLegenda}</p>
                        )}
                      </div>

                      {!hasLegendaSalva(zoomEtapa) && (
                        <div className="mt-4 p-3 bg-amber-50 border border-amber-100 rounded-xl flex items-start gap-3 animate-in fade-in slide-in-from-top-1 duration-500">
                          <AlertCircle size={14} className="text-amber-500 shrink-0 mt-0.5" />
                          <p className="text-[9px] font-bold text-amber-700 leading-tight uppercase tracking-tight">
                            {zoomEtapa === 1
                              ? 'Adicione uma descrição para liberar o envio do link ao cliente.'
                              : 'Adicione uma descrição para esta foto antes de fechar.'}
                          </p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-xs font-medium italic text-slate-600 leading-relaxed">
                      {fotosData[zoomEtapa]?.legenda || "Nenhuma nota técnica registrada."}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
                <div className="flex items-center justify-between border-b border-slate-50 pb-2 mb-2">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Feedback do Cliente</h4>
                  <MessageSquare size={12} className="text-slate-300" />
                </div>
                {comentariosZoom.length === 0 ? (
                  <p className="text-[11px] text-slate-300 italic py-4 text-center">Nenhum comentário nesta etapa.</p>
                ) : (
                  comentariosZoom.map((com) => (
                    <div key={com.id} className="flex gap-3 animate-in slide-in-from-left-2">
                      <div className="w-8 h-8 rounded-xl bg-blue-50 shrink-0 flex items-center justify-center border border-blue-100">
                        <User size={14} className="text-blue-400" />
                      </div>
                      <div className="max-w-[85%] p-3 rounded-2xl text-xs font-bold leading-tight bg-slate-50 text-slate-700 rounded-tl-none border border-slate-100">
                        {com.texto}
                      </div>
                    </div>
                  ))
                )}
              </div>
              
              <button 
                onClick={() => {
                  if (!canCloseZoom) return;
                  setZoomEtapa(null)
                }} 
                className={`mt-6 w-full py-5 rounded-[2rem] font-black uppercase italic text-[10px] tracking-widest transition-all active:scale-95 shrink-0 shadow-xl ${canCloseZoom ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-100' : 'bg-slate-100 text-slate-400 cursor-not-allowed'}`}
              >
                {canCloseZoom ? 'Fechar Inspeção' : 'Legenda Obrigatória'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
