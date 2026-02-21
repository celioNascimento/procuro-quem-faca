'use client'
import { useEffect, useState, use, useRef } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { 
  Star, Clock, X, ShieldCheck, ChevronRight, User, MessageSquare, 
  Phone, Briefcase, CheckCircle2, Loader2, Send, Activity, LayoutGrid, Award,
  Heart, Bookmark, ChevronLeft, MoreHorizontal
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
  
  // Estados para Comentários Técnicos
  const [comentarios, setComentarios] = useState([])
  const [novoComentario, setNovoComentario] = useState('')
  const [enviandoComentario, setEnviandoComentario] = useState(false)
  
  const [nota, setNota] = useState(0)
  const [hoverNota, setHoverNota] = useState(0)
  const [comentarioGeral, setComentarioGeral] = useState('')
  
  const [currentSlide, setCurrentSlide] = useState(0)

  useEffect(() => { setMounted(true) }, []);

  const isProjetoConcluido = projeto?.status?.toLowerCase() === 'concluido' || projeto?.status?.toLowerCase() === 'finalizado'
  const visualmenteConcluido = isProjetoConcluido || !!avaliacaoExistente

  const fotosCarrossel = projeto?.portfolio_fotos?.sort((a, b) => a.ordem - b.ordem)
    .map(f => ({
      ...f,
      label: f.ordem === 1 ? "Início" : f.ordem === 2 ? "Execução" : "Conclusão"
    })) || []

  useEffect(() => {
    if (visualmenteConcluido && fotosCarrossel.length > 0) {
      setCurrentSlide(fotosCarrossel.length - 1)
    }
  }, [visualmenteConcluido, fotosCarrossel.length])

  // Navegação do Carrossel
  const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % fotosCarrossel.length)
  const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + fotosCarrossel.length) % fotosCarrossel.length)

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
      await supabase.from('avaliacoes').insert({
        projeto_id: projeto.id,
        prestador_id: projeto.prestador_id,
        nota: nota,
        comentario: comentarioGeral,
        visivel: true
      })

      await supabase.from('portfolio_projetos')
        .update({ status: 'finalizado', data_conclusao: new Date().toISOString().split('T')[0] })
        .eq('id', projeto.id)

      setProjeto(prev => ({ ...prev, status: 'finalizado' }))
      router.push('/sucesso')
    } catch (err) {
      console.error(err)
      alert("Erro ao enviar avaliação.")
    } finally {
      setSubmitting(false)
    }
  }

  if (!mounted || loading) return <div className="min-h-screen bg-white flex flex-col items-center justify-center italic font-black uppercase text-slate-400">Sincronizando Relatórios...</div>

  const fotosOrdenadas = projeto?.portfolio_fotos?.sort((a, b) => a.ordem - b.ordem) || []
  const temConclusao = fotosOrdenadas.some(f => f.ordem === 3)
  const labelEtapaAtual = visualmenteConcluido ? 'Finalizado' : (fotosOrdenadas.length > 0 ? (fotosOrdenadas.length === 1 ? "Início" : fotosOrdenadas.length === 2 ? "Execução" : "Conclusão") : 'Pendente')

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 pb-20 font-sans antialiased">
      <HeaderCliente nomeCliente={projeto?.cliente_nome?.split(' ')[0]} />

      <div className="max-w-xl mx-auto px-6 pt-8 space-y-6 animate-in fade-in duration-700">
        {avaliacaoExistente && (
            <div className="bg-blue-600 p-6 rounded-[2.5rem] text-white space-y-4 shadow-xl shadow-blue-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Star size={16} fill="white" />
                  <span className="text-[10px] font-black uppercase italic tracking-widest">Sua Avaliação</span>
                </div>
                <div className="flex gap-0.5">
                  {[1, 2, 3, 4, 5].map(s => <Star key={s} size={12} fill={avaliacaoExistente.nota >= s ? "white" : "transparent"} stroke="white" strokeWidth={2.5} />)}
                </div>
              </div>
              <p className="text-[13px] font-bold italic leading-tight">"{avaliacaoExistente.comentario || "Serviço finalizado com excelência."}"</p>
            </div>
        )}

        {!visualmenteConcluido ? (
          <>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white/60 backdrop-blur-sm p-4 rounded-[2rem] border border-white flex items-center gap-3 shadow-sm">
                <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 border border-blue-100 text-blue-600">
                  <Activity size={18} strokeWidth={2.5} />
                </div>
                <div>
                  <p className="text-[8px] font-black uppercase text-slate-400 tracking-widest leading-none mb-1 italic">Status</p>
                  <p className="text-[10px] font-black uppercase italic text-slate-800 leading-none">{labelEtapaAtual}</p>
                </div>
              </div>
              <div className="bg-white/60 backdrop-blur-sm p-4 rounded-[2rem] border border-white flex items-center gap-3 shadow-sm">
                <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 shrink-0 border border-slate-100">
                  <LayoutGrid size={18} strokeWidth={2.5} />
                </div>
                <div>
                  <p className="text-[8px] font-black uppercase text-slate-400 tracking-widest leading-none mb-1 italic">Documentos</p>
                  <p className="text-[10px] font-black text-slate-800 uppercase italic leading-none">{fotosOrdenadas.length} de 3</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-2xl">
              <div className="flex items-center gap-4">
                <img src={projeto.prestadores?.foto_perfil} className="w-14 h-14 rounded-2xl object-cover border-2 border-slate-50" />
                <div className="flex-1 min-w-0">
                  <p className="text-[9px] font-black uppercase text-slate-400 tracking-wider italic mb-1">{projeto.prestadores?.categoria?.nome}</p>
                  <h2 className="text-md font-black text-slate-800 uppercase italic leading-none truncate">{projeto.prestadores?.nome}</h2>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1 italic leading-none truncate">{projeto.titulo}</p>
                </div>
                <a href={`tel:${projeto.prestadores?.whatsapp}`} className="p-4 bg-green-500 text-white rounded-[1.2rem] shadow-lg active:scale-90 transition-all"><Phone size={16} fill="currentColor" /></a>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {fotosOrdenadas.map((foto) => (
                <button key={foto.id} onClick={() => setFotoSelecionada(foto)} className="aspect-square rounded-[2rem] overflow-hidden bg-white border-2 border-slate-50 shadow-md relative group active:scale-95 transition-all">
                  <img src={foto.url_foto} className="w-full h-full object-cover" />
                  {comentarios.filter(c => c.foto_id === foto.id).length > 0 && (
                     <div className="absolute top-2 right-2 w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center border-2 border-white shadow-lg">
                       <span className="text-[8px] font-black text-white">{comentarios.filter(c => c.foto_id === foto.id).length}</span>
                     </div>
                   )}
                </button>
              ))}
            </div>
          </>
        ) : (
          <div className="animate-in fade-in slide-in-from-bottom-8 duration-700">
            <div className="bg-white border border-slate-100 rounded-[2.5rem] overflow-hidden shadow-2xl">
              <div className="flex items-center justify-between p-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full p-[2px] bg-gradient-to-tr from-blue-400 to-blue-600">
                    <img src={projeto.prestadores?.foto_perfil} className="w-full h-full rounded-full object-cover border-2 border-white" />
                  </div>
                  <p className="text-[11px] font-black text-slate-900 leading-none italic uppercase">{projeto.prestadores?.nome}</p>
                </div>
              </div>
              
              <div className="relative aspect-square bg-slate-100 flex items-center justify-center overflow-hidden">
                <img src={fotosCarrossel[currentSlide]?.url_foto} className="w-full h-full object-contain" />
                
                {/* Overlay de Etapa */}
                <div className="absolute top-5 right-5 bg-black/50 backdrop-blur-md text-white px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border border-white/10">
                  {fotosCarrossel[currentSlide]?.label} ({currentSlide + 1}/{fotosCarrossel.length})
                </div>

                {/* Navegação Funcional */}
                {fotosCarrossel.length > 1 && (
                  <>
                    <button onClick={prevSlide} className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/90 p-2 rounded-full text-slate-900 shadow-xl hover:bg-white transition-colors active:scale-90">
                      <ChevronLeft size={24} />
                    </button>
                    <button onClick={nextSlide} className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/90 p-2 rounded-full text-slate-900 shadow-xl hover:bg-white transition-colors active:scale-90">
                      <ChevronRight size={24} />
                    </button>
                  </>
                )}
              </div>

              <div className="p-6">
                 <p className="text-[12px] text-slate-800 italic font-black uppercase">{projeto.prestadores?.nome}</p>
                 <p className="text-[12px] text-slate-600 mt-1">{projeto.titulo}</p>
              </div>
            </div>
          </div>
        )}

        {!visualmenteConcluido && temConclusao && (
          <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-2xl shadow-blue-900/5 space-y-8">
            <div className="text-center space-y-2">
              <h3 className="text-2xl font-black italic uppercase text-slate-800 tracking-tighter">Validar Serviço</h3>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Sua nota final assina o registro</p>
            </div>
            <div className="flex justify-center gap-3">
              {[1, 2, 3, 4, 5].map(star => (
                <button key={star} onClick={() => setNota(star)} onMouseEnter={() => setHoverNota(star)} onMouseLeave={() => setHoverNota(0)}>
                  <Star size={42} fill={(hoverNota || nota) >= star ? "#2563eb" : "transparent"} color={(hoverNota || nota) >= star ? "#2563eb" : "#E2E8F0"} />
                </button>
              ))}
            </div>
            <textarea className="w-full p-6 bg-slate-50 rounded-[2rem] border border-slate-100 outline-none text-[13px] font-bold min-h-[140px] resize-none" placeholder="Feedbacks do serviço..." value={comentarioGeral} onChange={e => setComentarioGeral(e.target.value)} />
            <button disabled={nota === 0 || submitting} className="w-full py-6 bg-blue-600 text-white rounded-[1.8rem] font-black uppercase text-[11px] tracking-[0.3em] flex items-center justify-center gap-3 disabled:opacity-50" onClick={handleFinalizarAvaliacao}>
              {submitting ? <Loader2 className="animate-spin" size={16} /> : <><CheckCircle2 size={16} strokeWidth={3} /> Concluir e Assinar</>}
            </button>
          </div>
        )}
      </div>

      {fotoSelecionada && !visualmenteConcluido && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/90 backdrop-blur-xl p-4 animate-in fade-in">
          <div className="w-full max-w-5xl bg-white rounded-[3rem] overflow-hidden flex flex-col md:flex-row h-[90vh] shadow-2xl">
            <div className="flex-1 bg-slate-100 relative flex items-center justify-center overflow-hidden">
              <img src={fotoSelecionada.url_foto} className="max-w-full max-h-full object-contain" />
              <button onClick={() => setFotoSelecionada(null)} className="absolute top-6 right-6 p-3 bg-black/20 rounded-full text-white md:hidden"><X size={20} /></button>
            </div>
            
            <div className="w-full md:w-[420px] bg-white flex flex-col">
              <div className="p-6 border-b border-slate-50 flex items-center justify-between">
                <p className="text-[10px] font-black uppercase italic tracking-widest text-slate-400">Discussão Técnica</p>
                <button onClick={() => setFotoSelecionada(null)} className="hidden md:block text-slate-300 hover:text-slate-600"><X size={24} /></button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                <div className="flex gap-3">
                  <img src={projeto.prestadores?.foto_perfil} className="w-8 h-8 rounded-lg object-cover border border-slate-100" />
                  <div className="flex-1 bg-slate-50 p-4 rounded-2xl rounded-tl-none border border-slate-100/50">
                    <p className="text-[12px] font-bold text-slate-700 italic">{fotoSelecionada.legenda || "Nota técnica registrada."}</p>
                  </div>
                </div>

                {comentarios.filter(c => c.foto_id === fotoSelecionada.id).map(com => (
                  <div key={com.id} className={`flex gap-3 ${com.autor_tipo === 'cliente' ? 'flex-row-reverse' : ''}`}>
                    <div className={`flex-1 p-4 rounded-2xl border ${com.autor_tipo === 'cliente' ? 'bg-blue-600 text-white border-blue-500 rounded-tr-none' : 'bg-slate-50 text-slate-700 border-slate-100 rounded-tl-none'}`}>
                      <p className="text-[12px] font-bold leading-relaxed">{com.texto}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-6 border-t border-slate-50 bg-slate-50/30">
                <div className="relative">
                  <input value={novoComentario} onChange={e => setNovoComentario(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleEnviarComentario()} placeholder="Tirar dúvida técnica..." className="w-full pl-6 pr-14 py-4 bg-white rounded-2xl border border-slate-200 outline-none text-[12px] font-bold italic focus:border-blue-400 transition-all shadow-inner" />
                  <button onClick={handleEnviarComentario} disabled={enviandoComentario || !novoComentario.trim()} className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-blue-600 text-white rounded-xl active:scale-90 transition-all disabled:opacity-30">
                    {enviandoComentario ? <Loader2 className="animate-spin" size={16} /> : <Send size={16} />}
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