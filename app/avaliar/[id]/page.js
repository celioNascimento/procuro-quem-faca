'use client'
import { useEffect, useState, use, useRef } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import {
  Star, Clock, X, ShieldCheck, ChevronRight, User, MessageSquare,
  Phone, Briefcase, CheckCircle2, Loader2, Send, Activity, LayoutGrid,
  Share2, ChevronLeft, MoreHorizontal, ZoomIn, Camera
} from 'lucide-react'
import HeaderCliente from '@/components/HeaderCliente'

export default function PaginaAvaliacaoCliente({ params: paramsPromise }) {
  const params = use(paramsPromise)
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')
  const projetoIdEstavel = params?.id

  const [projeto, setProjeto] = useState(null)
  const [avaliacaoExistente, setAvaliacaoExistente] = useState(null)
  const [loading, setLoading] = useState(true)
  const [mounted, setMounted] = useState(false)
  const [fotoSelecionada, setFotoSelecionada] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const [comentarios, setComentarios] = useState([])
  const [novoComentario, setNovoComentario] = useState('')
  const [enviandoComentario, setEnviandoComentario] = useState(false)

  const [nota, setNota] = useState(0)
  const [hoverNota, setHoverNota] = useState(0)
  const [comentarioGeral, setComentarioGeral] = useState('')
  const [currentSlide, setCurrentSlide] = useState(0)

  useEffect(() => { setMounted(true) }, [])

  const isProjetoConcluido = projeto?.status?.toLowerCase() === 'concluido' || projeto?.status?.toLowerCase() === 'finalizado'
  const visualmenteConcluido = isProjetoConcluido || !!avaliacaoExistente

  const fotosCarrossel = projeto?.portfolio_fotos?.sort((a, b) => a.ordem - b.ordem)
    .map(f => ({
      ...f,
      label: f.ordem === 1 ? 'Início' : f.ordem === 2 ? 'Execução' : 'Conclusão'
    })) || []

  useEffect(() => {
    if (visualmenteConcluido && fotosCarrossel.length > 0) {
      setCurrentSlide(fotosCarrossel.length - 1)
    }
  }, [visualmenteConcluido, fotosCarrossel.length])

  const nextSlide = () => setCurrentSlide(prev => (prev + 1) % fotosCarrossel.length)
  const prevSlide = () => setCurrentSlide(prev => (prev - 1 + fotosCarrossel.length) % fotosCarrossel.length)

  const carregarProjeto = async () => {
    const { data: projData } = await supabase
      .from('portfolio_projetos')
      .select(`*, portfolio_fotos(*), prestadores(nome, foto_perfil, whatsapp, categoria:categorias(nome))`)
      .eq('id', projetoIdEstavel).eq('avaliacao_token', token).single()

    if (projData) {
      const { data: avalData } = await supabase.from('avaliacoes').select('*').eq('projeto_id', projData.id).maybeSingle()
      if (avalData) setAvaliacaoExistente(avalData)

      const { data: comData } = await supabase.from('portfolio_comentarios').select('*').eq('projeto_id', projData.id).order('criado_at', { ascending: true })
      if (comData) setComentarios(comData)

      setProjeto(projData)
    }
    setLoading(false)
  }

  useEffect(() => {
    if (token && mounted && projetoIdEstavel) carregarProjeto()
  }, [projetoIdEstavel, token, mounted])

  const handleShare = async () => {
    const shareData = {
      title: `Serviço: ${projeto?.titulo}`,
      text: `Acompanhe o progresso: "${projeto?.titulo}"`,
      url: window.location.href
    }
    try {
      if (navigator.share) await navigator.share(shareData)
      else { await navigator.clipboard.writeText(window.location.href); alert('Link copiado!') }
    } catch (err) { console.error(err) }
  }

  const handleEnviarComentario = async () => {
    if (!novoComentario.trim() || !fotoSelecionada || enviandoComentario) return
    setEnviandoComentario(true)
    try {
      const { data, error } = await supabase.from('portfolio_comentarios').insert({
        foto_id: fotoSelecionada.id,
        projeto_id: projeto.id,
        autor_tipo: 'cliente',
        texto: novoComentario.trim()
      }).select().single()
      if (error) throw error
      setComentarios([...comentarios, data])
      setNovoComentario('')
    } catch (err) { console.error(err) }
    finally { setEnviandoComentario(false) }
  }

  const handleFinalizarAvaliacao = async () => {
    if (nota === 0 || submitting || avaliacaoExistente) return
    setSubmitting(true)
    try {
      await supabase.from('avaliacoes').insert({
        projeto_id: projeto.id,
        prestador_id: projeto.prestador_id,
        nota,
        comentario: comentarioGeral,
        visivel: true,
        status: 'finalizado'
      })
      await supabase.from('portfolio_projetos')
        .update({ status: 'finalizado', data_conclusao: new Date().toISOString().split('T')[0] })
        .eq('id', projeto.id)
      setProjeto(prev => ({ ...prev, status: 'finalizado' }))
      router.push('/sucesso')
    } catch (err) { console.error(err) }
    finally { setSubmitting(false) }
  }

  if (!mounted || loading) return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center font-bold text-slate-300 uppercase tracking-widest animate-pulse">
      Sincronizando Relatórios...
    </div>
  )

  const fotosOrdenadas = projeto?.portfolio_fotos?.sort((a, b) => a.ordem - b.ordem) || []
  const temConclusao = fotosOrdenadas.some(f => f.ordem === 3)
  const labelEtapaAtual = visualmenteConcluido ? 'Finalizado' : (projeto?.status === 'em_execucao' ? 'Em Execução' : 'Pendente')

  // Etapas da linha do tempo
  const etapas = [
    { ordem: 1, label: 'Início',    sublabel: 'Antes do serviço' },
    { ordem: 2, label: 'Execução',  sublabel: 'Durante a obra'   },
    { ordem: 3, label: 'Conclusão', sublabel: 'Entrega final'    },
  ]

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 pb-20 font-sans antialiased">
      <HeaderCliente nomeCliente={projeto?.cliente_nome} />

      <div className="max-w-xl mx-auto px-5 pt-6 space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-700">

        {/* ── CARD DO PRESTADOR ─────────────────────────────────────────────── */}
        <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
          
          {/* Topo colorido com foto sobreposta */}
          <div className="h-2 bg-blue-600" />
          
          <div className="p-5 flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 overflow-hidden shrink-0 border-2 border-slate-50 shadow-inner">
              <img src={projeto.prestadores?.foto_perfil} className="w-full h-full object-cover" alt="Prestador" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[9px] font-black uppercase text-blue-600 tracking-widest mb-0.5">
                {projeto.prestadores?.categoria?.nome}
              </p>
              <h2 className="text-sm font-black text-slate-800 uppercase leading-tight">
                {projeto.prestadores?.nome}
              </h2>
              <p className="text-[11px] font-medium text-slate-400 mt-1 italic leading-snug line-clamp-2">
                {projeto.titulo}
              </p>
            </div>
            <div className="flex flex-col gap-2 shrink-0">
              <button onClick={handleShare}
                className="w-10 h-10 bg-slate-50 text-slate-400 rounded-xl flex items-center justify-center active:scale-95 transition-all border border-slate-100">
                <Share2 size={16} />
              </button>
              <a href={`tel:${projeto.prestadores?.whatsapp}`}
                className="w-10 h-10 bg-green-500 text-white rounded-xl flex items-center justify-center shadow-md shadow-green-100 active:scale-95 transition-all">
                <Phone size={16} fill="currentColor" />
              </a>
            </div>
          </div>
        </div>

        {/* ── LINHA DO TEMPO DE OBRA ────────────────────────────────────────── */}
        {!visualmenteConcluido && (
          <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-6 space-y-5">

            <div className="flex items-center justify-between">
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                Progresso da Obra
              </h3>
              <span className={`text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full border ${
                projeto?.status === 'em_execucao'
                  ? 'bg-blue-50 text-blue-600 border-blue-100 animate-pulse'
                  : 'bg-yellow-50 text-yellow-600 border-yellow-100'
              }`}>
                {labelEtapaAtual}
              </span>
            </div>

            {/* Trilho de etapas */}
            <div className="relative">
              {/* Linha conectora */}
              <div className="absolute top-6 left-6 right-6 h-0.5 bg-slate-100 z-0" />
              {/* Progresso preenchido */}
              <div
                className="absolute top-6 left-6 h-0.5 bg-blue-500 z-0 transition-all duration-700"
                style={{ width: `${Math.max(0, (fotosOrdenadas.length - 1) / 2) * 100}%` }}
              />

              <div className="relative z-10 flex justify-between">
                {etapas.map((etapa, idx) => {
                  const foto = fotosOrdenadas.find(f => f.ordem === etapa.ordem)
                  const concluida = !!foto
                  const atual = fotosOrdenadas.length === etapa.ordem

                  return (
                    <div key={etapa.ordem} className="flex flex-col items-center gap-2 w-1/3">

                      {/* Bolinha / foto em miniatura */}
                      <button
                        onClick={() => foto && setFotoSelecionada(foto)}
                        disabled={!foto}
                        className={`w-12 h-12 rounded-2xl overflow-hidden border-2 transition-all active:scale-90 ${
                          concluida
                            ? atual
                              ? 'border-blue-500 shadow-lg shadow-blue-100 ring-2 ring-blue-200 ring-offset-2'
                              : 'border-green-200 shadow-sm'
                            : 'border-dashed border-slate-200 bg-slate-50'
                        }`}
                      >
                        {foto ? (
                          <img src={foto.url_foto} className="w-full h-full object-cover" alt={etapa.label} />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Camera size={18} className="text-slate-300" />
                          </div>
                        )}
                      </button>

                      {/* Label + sublabel */}
                      <div className="text-center">
                        <p className={`text-[10px] font-black uppercase tracking-wide leading-none ${
                          concluida ? (atual ? 'text-blue-600' : 'text-green-600') : 'text-slate-300'
                        }`}>
                          {etapa.label}
                        </p>
                        <p className="text-[9px] text-slate-400 font-medium mt-0.5 leading-none">
                          {etapa.sublabel}
                        </p>
                      </div>

                      {/* Badge de comentários */}
                      {foto && comentarios.filter(c => c.foto_id === foto.id).length > 0 && (
                        <div className="flex items-center gap-1 bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">
                          <MessageSquare size={8} />
                          <span className="text-[8px] font-black">
                            {comentarios.filter(c => c.foto_id === foto.id).length}
                          </span>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Instrução contextual */}
            <p className="text-center text-[10px] font-medium text-slate-400 pt-1">
              {fotosOrdenadas.length === 0
                ? 'Aguardando o prestador iniciar os registros.'
                : fotosOrdenadas.length === 3
                  ? 'Todos os registros enviados. Avalie abaixo para concluir.'
                  : `${3 - fotosOrdenadas.length} registro${3 - fotosOrdenadas.length > 1 ? 's' : ''} pendente${3 - fotosOrdenadas.length > 1 ? 's' : ''} — toque nas fotos para discutir.`
              }
            </p>
          </div>
        )}

        {/* ── STATUS MINI (só quando não há linha do tempo) ─────────────────── */}
        {visualmenteConcluido && (
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white p-4 rounded-2xl border border-slate-100 flex items-center gap-3 shadow-sm">
              <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
                <Activity size={16} />
              </div>
              <div className="min-w-0">
                <p className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Progresso</p>
                <p className="text-[11px] font-black text-slate-800 uppercase truncate">{labelEtapaAtual}</p>
              </div>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-slate-100 flex items-center gap-3 shadow-sm">
              <div className="w-9 h-9 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 shrink-0">
                <LayoutGrid size={16} />
              </div>
              <div className="min-w-0">
                <p className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Registros</p>
                <p className="text-[11px] font-black text-slate-800 uppercase">{fotosOrdenadas.length} de 3</p>
              </div>
            </div>
          </div>
        )}

        {/* ── CARROSSEL DE FINALIZAÇÃO ──────────────────────────────────────── */}
        {visualmenteConcluido && (
          <div className="animate-in fade-in slide-in-from-bottom-8 duration-700 space-y-5">
            <div className="bg-white rounded-[2.5rem] overflow-hidden shadow-xl border border-slate-100">
              <div className="p-5 border-b border-slate-50 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-600 p-[2px]">
                  <img src={projeto.prestadores?.foto_perfil} className="w-full h-full rounded-full object-cover border-2 border-white" />
                </div>
                <p className="text-xs font-black text-slate-800 uppercase">{projeto.prestadores?.nome}</p>
              </div>

              <div className="relative aspect-square bg-slate-50">
                <img src={fotosCarrossel[currentSlide]?.url_foto} className="w-full h-full object-contain" />
                <div className="absolute top-5 right-5 bg-black/60 backdrop-blur-md text-white px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border border-white/20">
                  {fotosCarrossel[currentSlide]?.label}
                </div>
                {fotosCarrossel.length > 1 && (
                  <>
                    <button onClick={prevSlide} className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/90 p-3 rounded-full text-slate-900 shadow-xl active:scale-90 transition-all border border-slate-100">
                      <ChevronLeft size={20} />
                    </button>
                    <button onClick={nextSlide} className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/90 p-3 rounded-full text-slate-900 shadow-xl active:scale-90 transition-all border border-slate-100">
                      <ChevronRight size={20} />
                    </button>
                  </>
                )}
              </div>

              <div className="p-6 text-center bg-white">
                <h4 className="text-sm font-black text-slate-800 uppercase tracking-tight">{projeto.titulo}</h4>
                <div className="flex items-center justify-center gap-2 mt-3">
                  <div className="h-[2px] w-8 bg-blue-100 rounded-full" />
                  <p className="text-[9px] font-black text-blue-600 uppercase tracking-widest">Entrega Finalizada</p>
                  <div className="h-[2px] w-8 bg-blue-100 rounded-full" />
                </div>
              </div>
            </div>

            {avaliacaoExistente && (
              <div className="bg-blue-600 p-8 rounded-[2.5rem] text-white shadow-2xl shadow-blue-200 animate-in zoom-in-95 duration-500">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Star size={16} fill="white" className="text-white" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Feedback do Cliente</span>
                  </div>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map(s => (
                      <Star key={s} size={10} fill={avaliacaoExistente.nota >= s ? 'white' : 'transparent'} stroke="white" strokeWidth={2} />
                    ))}
                  </div>
                </div>
                <p className="text-sm font-medium leading-relaxed opacity-90 italic">
                  "{avaliacaoExistente.comentario || 'Serviço finalizado com sucesso.'}"
                </p>
              </div>
            )}
          </div>
        )}

        {/* ── BLOCO DE AVALIAÇÃO (quando tem foto de conclusão e não finalizou) ── */}
        {!visualmenteConcluido && temConclusao && (
          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-8 animate-in slide-in-from-bottom-10 duration-700">
            <div className="text-center">
              <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 size={28} className="text-blue-600" />
              </div>
              <h3 className="text-2xl font-black text-slate-800 tracking-tighter uppercase italic">Assinar Entrega</h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-2">
                Sua nota oficializa a conclusão do serviço
              </p>
            </div>

            <div className="flex justify-center gap-2">
              {[1, 2, 3, 4, 5].map(star => (
                <button key={star} onClick={() => setNota(star)}
                  onMouseEnter={() => setHoverNota(star)} onMouseLeave={() => setHoverNota(0)}
                  className="transition-transform active:scale-90">
                  <Star size={38}
                    fill={(hoverNota || nota) >= star ? '#2563eb' : 'transparent'}
                    color={(hoverNota || nota) >= star ? '#2563eb' : '#E2E8F0'}
                    strokeWidth={2}
                  />
                </button>
              ))}
            </div>

            <textarea
              className="w-full p-6 bg-slate-50 rounded-[2rem] border border-slate-100 outline-none text-sm font-medium text-slate-700 min-h-[120px] resize-none focus:border-blue-200 focus:bg-white transition-all placeholder:text-slate-300 shadow-inner"
              placeholder="Escreva um breve depoimento..."
              value={comentarioGeral}
              onChange={e => setComentarioGeral(e.target.value)}
            />

            <button
              disabled={nota === 0 || submitting}
              onClick={handleFinalizarAvaliacao}
              className="w-full py-5 bg-blue-600 text-white rounded-[2rem] font-black uppercase text-[11px] tracking-[0.2em] italic flex items-center justify-center gap-3 disabled:opacity-40 shadow-xl shadow-blue-200 active:scale-[0.98] transition-all"
            >
              {submitting
                ? <Loader2 className="animate-spin" size={20} />
                : <><CheckCircle2 size={18} strokeWidth={2.5} /> Validar e Concluir</>
              }
            </button>
          </div>
        )}

        {/* ── RODAPÉ DE SEGURANÇA ───────────────────────────────────────────── */}
        <div className="bg-slate-900 rounded-[2rem] p-6 text-white relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 w-48 h-48 bg-blue-600/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="relative z-10 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-blue-400 shrink-0">
              <ShieldCheck size={20} />
            </div>
            <p className="text-[10px] font-medium text-slate-400 leading-relaxed">
              Projeto registrado com token único e verificado. Cada etapa é carimbada com data e hora.
            </p>
          </div>
        </div>

      </div>

      {/* ── MODAL DE DISCUSSÃO TÉCNICA ────────────────────────────────────── */}
      {fotoSelecionada && !visualmenteConcluido && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/95 backdrop-blur-md p-2 md:p-4 animate-in fade-in">
          <div className="w-full max-w-5xl bg-white rounded-[2.5rem] md:rounded-[3rem] overflow-hidden flex flex-col md:flex-row h-[90vh] md:h-[85vh] shadow-2xl">

            <div className="flex-1 bg-slate-100 relative flex items-center justify-center overflow-hidden">
              <img src={fotoSelecionada.url_foto} className="w-full h-full object-contain" />
              <button onClick={() => setFotoSelecionada(null)} className="absolute top-5 right-5 p-3 bg-black/20 backdrop-blur-md rounded-full text-white md:hidden active:scale-90 transition-all">
                <X size={20} />
              </button>
              <div className="absolute top-5 left-5 bg-blue-600 text-white px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest shadow-lg">
                Fase {fotoSelecionada.ordem === 1 ? 'Início' : fotoSelecionada.ordem === 2 ? 'Execução' : 'Conclusão'}
              </div>
            </div>

            <div className="w-full md:w-[400px] bg-white flex flex-col border-l border-slate-50">
              <div className="p-6 border-b border-slate-50 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-4 bg-blue-600 rounded-full" />
                  <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-800 italic">Discussão Técnica</h3>
                </div>
                <button onClick={() => setFotoSelecionada(null)} className="hidden md:block text-slate-300 hover:text-slate-600 transition-colors">
                  <X size={22} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-[#F8FAFC]/50">
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-xl bg-slate-200 shrink-0 overflow-hidden border border-white shadow-sm">
                    <img src={projeto.prestadores?.foto_perfil} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 bg-white p-4 rounded-2xl rounded-tl-none border border-slate-100 shadow-sm">
                    <p className="text-[13px] font-medium text-slate-600 leading-relaxed italic">
                      {fotoSelecionada.legenda || 'Nota técnica enviada pelo prestador.'}
                    </p>
                  </div>
                </div>

                {comentarios.filter(c => c.foto_id === fotoSelecionada.id).map(com => (
                  <div key={com.id} className={`flex gap-3 ${com.autor_tipo === 'cliente' ? 'flex-row-reverse' : ''}`}>
                    <div className={`flex-1 p-4 rounded-2xl border ${com.autor_tipo === 'cliente' ? 'bg-blue-600 text-white border-blue-500 rounded-tr-none shadow-md' : 'bg-white text-slate-700 border-slate-100 rounded-tl-none shadow-sm'}`}>
                      <p className="text-[13px] font-medium leading-relaxed">{com.texto}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-5 bg-white border-t border-slate-50 shrink-0">
                <div className="relative">
                  <input
                    value={novoComentario}
                    onChange={e => setNovoComentario(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleEnviarComentario()}
                    placeholder="Tirar dúvida técnica..."
                    className="w-full pl-6 pr-14 py-4 bg-slate-50 rounded-2xl border border-slate-100 outline-none text-[13px] font-medium focus:border-blue-400 focus:bg-white transition-all shadow-inner"
                  />
                  <button
                    onClick={handleEnviarComentario}
                    disabled={enviandoComentario || !novoComentario.trim()}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-blue-600 text-white rounded-xl active:scale-90 transition-all disabled:opacity-30 shadow-lg shadow-blue-100"
                  >
                    {enviandoComentario ? <Loader2 className="animate-spin" size={16} /> : <Send size={18} />}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}