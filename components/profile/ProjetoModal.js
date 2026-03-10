'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { 
  X, ChevronLeft, ChevronRight, Share2, 
  CheckCircle2, Activity, User, Camera, ArrowLeft
} from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function ProjetoModal({ projeto, onClose }) {
  const router = useRouter()
  const [currentSlide, setCurrentSlide] = useState(0)
  const [comentarios, setComentarios] = useState([])
  
  const fotos = projeto.portfolio_fotos?.sort((a, b) => a.ordem - b.ordem) || []
  const isConcluido = projeto.status === 'finalizado' || fotos.some(f => f.ordem === 3)
  const fotoAtual = fotos[currentSlide]

  useEffect(() => {
    if (fotoAtual?.id) {
      const buscarComentarios = async () => {
        const { data, error } = await supabase
          .from('portfolio_comentarios')
          .select('*')
          .eq('foto_id', fotoAtual.id)
          .eq('autor_tipo', 'cliente')
          .order('criado_at', { ascending: true })
        
        if (!error) setComentarios(data || [])
      }
      buscarComentarios()
    }
  }, [currentSlide, fotoAtual])

  const handleShare = async () => {
    const shareData = {
      title: `Projeto: ${projeto.titulo}`,
      text: `Confira o trabalho de ${projeto.prestadores?.nome || 'um profissional'} no Procuro Quem Faça.`,
      url: `${window.location.origin}/profissional/${projeto.prestador_id}?projeto=${projeto.id}`
    }

    try {
      if (navigator.share) {
        await navigator.share(shareData)
      } else {
        await navigator.clipboard.writeText(shareData.url)
        alert("Link do projeto copiado!")
      }
    } catch (err) {
      console.error("Erro ao compartilhar", err)
    }
  }

  const nextSlide = (e) => {
    e.stopPropagation()
    setCurrentSlide((prev) => (prev + 1) % fotos.length)
  }

  const prevSlide = (e) => {
    e.stopPropagation()
    setCurrentSlide((prev) => (prev - 1 + fotos.length) % fotos.length)
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 md:p-4 bg-slate-900/95 backdrop-blur-md animate-in fade-in duration-300">
      
      {/* BOTÃO FECHAR EXTERNO */}
      <button onClick={onClose} className="absolute top-6 right-6 text-white/50 hover:text-white transition-all z-[120] p-3 hover:bg-white/10 rounded-full hidden md:block">
        <X size={32} strokeWidth={2.5} />
      </button>

      <div className="bg-white w-full max-w-4xl rounded-[3rem] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300 flex flex-col md:flex-row h-fit max-h-[96vh]">
        
        {/* ÁREA VISUAL */}
        <div className="relative flex-[1.4] bg-slate-950 flex items-center justify-center min-h-[300px] md:min-h-[600px] overflow-hidden">
          {fotos.length > 0 ? (
            <>
              <img src={fotoAtual.url_foto} className="absolute inset-0 w-full h-full object-cover blur-3xl opacity-30 scale-125" aria-hidden="true" />
              <img src={fotoAtual.url_foto} className="relative z-10 max-w-full max-h-full object-contain shadow-2xl" alt="Registro do projeto" />

              <div className="absolute top-6 left-6 bg-blue-600/90 backdrop-blur-xl text-white px-4 py-2 rounded-full text-[9px] font-black uppercase tracking-[0.2em] border border-blue-400/20 z-30">
                Fase 0{fotoAtual.ordem}
              </div>

              {fotos.length > 1 && (
                <div className="absolute inset-x-4 top-1/2 -translate-y-1/2 flex justify-between items-center z-40 pointer-events-none">
                  <button onClick={prevSlide} className="w-12 h-12 bg-white/10 hover:bg-white/90 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:text-slate-900 transition-all pointer-events-auto shadow-xl active:scale-90 border border-white/10">
                    <ChevronLeft size={24} strokeWidth={3} />
                  </button>
                  <button onClick={nextSlide} className="w-12 h-12 bg-white/10 hover:bg-white/90 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:text-slate-900 transition-all pointer-events-auto shadow-xl active:scale-90 border border-white/10">
                    <ChevronRight size={24} strokeWidth={3} />
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center text-slate-700 gap-2 font-black uppercase text-[10px] italic"><Camera size={40} /> Sem imagens</div>
          )}
        </div>

        {/* ÁREA DE CONTEÚDO */}
        <div className="flex-1 flex flex-col bg-white min-w-[350px] max-h-[600px] md:max-h-full overflow-hidden">
          
          <div className="p-5 flex items-center justify-between border-b border-slate-50 shrink-0">
            <div className="flex items-center gap-3">
              <button 
                onClick={() => router.push(`/profissional/${projeto.prestador_id}`)}
                className="w-10 h-10 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-blue-600 hover:text-white transition-all shadow-sm active:scale-90 group"
                title="Voltar ao Perfil"
              >
                <ArrowLeft size={18} strokeWidth={3} />
              </button>
              <div>
                <h3 className="text-[11px] font-black text-slate-800 uppercase italic leading-none tracking-tight truncate max-w-[150px]">{projeto.titulo}</h3>
                <div className="flex items-center gap-1.5 mt-1">
                  {isConcluido ? <CheckCircle2 size={10} className="text-green-500" /> : <Activity size={10} className="text-blue-500 animate-pulse" />}
                  <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest leading-none">
                    {isConcluido ? 'Finalizado' : 'Em Registro'}
                  </p>
                </div>
              </div>
            </div>
            <button onClick={onClose} className="md:hidden p-2 text-slate-300"><X size={20} /></button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-4 bg-blue-600 rounded-full"></div>
                <span className="font-black text-slate-900 uppercase text-[10px] tracking-widest italic">Nota Técnica</span>
              </div>
              <p className="text-[14px] text-slate-600 leading-relaxed italic pl-4 border-l-2 border-slate-100 font-medium">
                {fotoAtual?.legenda || "Acompanhamento técnico em andamento."}
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-50 pb-2">
                <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-widest italic">Interações da Fase</h4>
                <div className="flex gap-1">
                   {fotos.map((_, i) => (
                     <div key={i} className={`h-1 rounded-full transition-all duration-300 ${currentSlide === i ? 'w-4 bg-blue-600' : 'w-1 bg-slate-200'}`} />
                   ))}
                </div>
              </div>

              <div className="space-y-4">
                {comentarios.length === 0 ? (
                  <p className="text-[10px] text-slate-300 italic">Sem registros de feedback nesta fase.</p>
                ) : (
                  comentarios.map((com) => (
                    <div key={com.id} className="flex gap-3 animate-in fade-in slide-in-from-left-2 duration-300">
                      <div className="w-8 h-8 rounded-xl bg-slate-50 shrink-0 flex items-center justify-center border border-slate-100">
                        <User size={14} className="text-slate-400" />
                      </div>
                      <div className="max-w-[85%] p-3 rounded-2xl text-[11px] font-bold leading-tight bg-slate-50 text-slate-600 rounded-tl-none border border-slate-100 italic">
                        {com.texto}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* BARRA DE AÇÕES INFERIOR */}
          <div className="p-5 px-8 border-t border-slate-50 flex items-center justify-between bg-white shrink-0">
            <button 
              onClick={handleShare}
              className="text-slate-400 hover:text-blue-600 transition-all active:scale-95 flex items-center gap-2 group"
            >
              <Share2 size={22} className="group-hover:scale-110 transition-transform" />
              <span className="text-[10px] font-black uppercase tracking-widest italic">Compartilhar</span>
            </button>
            <span className="text-[9px] font-black text-slate-200 uppercase tracking-[0.2em] italic">#{projeto.id.split('-')[0]}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
