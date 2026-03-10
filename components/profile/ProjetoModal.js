'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { X, ChevronLeft, ChevronRight, Share2, CheckCircle2, Activity, User, Camera } from 'lucide-react'

export default function ProjetoModal({ projeto, onClose }) {
  const [currentSlide, setCurrentSlide] = useState(0)
  const [comentarios, setComentarios] = useState([])

  // BUG 4: spread antes de sort — evita mutar o array original do objeto projeto
  const fotos = [...(projeto.portfolio_fotos || [])].sort((a, b) => Number(a.ordem) - Number(b.ordem))

  // BUG 3: Number() — ordem pode vir como string do banco
  const isConcluido = projeto.status === 'finalizado' || fotos.some(f => Number(f.ordem) === 3)
  const fotoAtual = fotos[currentSlide]

  // BUG 5: deps corretas — apenas currentSlide, fotoAtual.id capturado dentro
  useEffect(() => {
    const fotoId = fotos[currentSlide]?.id
    if (!fotoId) return

    const buscarComentarios = async () => {
      const { data, error } = await supabase
        .from('portfolio_comentarios')
        .select('*')
        .eq('foto_id', fotoId)
        .eq('autor_tipo', 'cliente')
        .order('criado_at', { ascending: true })

      if (!error) setComentarios(data || [])
    }
    buscarComentarios()
  }, [currentSlide]) // eslint-disable-line react-hooks/exhaustive-deps

  // BUG 2: share usa URL atual do perfil — não aponta mais para /profissional/
  const handleShare = async () => {
    const url = typeof window !== 'undefined' ? window.location.href : ''
    const texto = `Confira este trabalho no Procuro Quem Faça: ${projeto.titulo}`
    try {
      if (navigator.share) {
        await navigator.share({ title: projeto.titulo, text: texto, url })
      } else {
        await navigator.clipboard.writeText(url)
      }
    } catch { /* usuário cancelou share nativo — silencioso */ }
  }

  const nextSlide = (e) => { e.stopPropagation(); setCurrentSlide(p => (p + 1) % fotos.length) }
  const prevSlide = (e) => { e.stopPropagation(); setCurrentSlide(p => (p - 1 + fotos.length) % fotos.length) }

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-2 md:p-4 bg-slate-900/95 backdrop-blur-md animate-in fade-in duration-300">

      {/* X externo — desktop */}
      <button onClick={onClose} className="absolute top-6 right-6 text-white/50 hover:text-white transition-all z-[210] p-3 hover:bg-white/10 rounded-full hidden md:flex items-center justify-center">
        <X size={32} strokeWidth={2.5} />
      </button>

      <div className="bg-white w-full max-w-4xl rounded-[3rem] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300 flex flex-col md:flex-row h-fit max-h-[96vh]">

        {/* ── Área visual ── */}
        <div className="relative flex-[1.4] bg-slate-950 flex items-center justify-center min-h-[300px] md:min-h-[600px] overflow-hidden">
          {fotos.length > 0 ? (
            <>
              {/* Blur de fundo */}
              <img src={fotoAtual.url_foto} className="absolute inset-0 w-full h-full object-cover blur-3xl opacity-30 scale-125" aria-hidden="true" />
              {/* Foto principal */}
              <img src={fotoAtual.url_foto} className="relative z-10 max-w-full max-h-full object-contain shadow-2xl" alt="Registro do projeto" />

              {/* BUG 6: guard contra ordem null */}
              {fotoAtual.ordem != null && (
                <div className="absolute top-6 left-6 bg-blue-600/90 backdrop-blur-xl text-white px-4 py-2 rounded-full text-[9px] font-black uppercase tracking-[0.2em] border border-blue-400/20 z-30">
                  Fase {String(Number(fotoAtual.ordem)).padStart(2, '0')}
                </div>
              )}

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
            <div className="flex flex-col items-center justify-center text-slate-700 gap-2 font-black uppercase text-[10px] italic">
              <Camera size={40} /> Sem imagens
            </div>
          )}
        </div>

        {/* ── Área de conteúdo ── */}
        <div className="flex-1 flex flex-col bg-white min-w-0 md:min-w-[350px] max-h-[50vh] md:max-h-[600px] overflow-hidden">

          {/* Header do modal */}
          <div className="p-5 flex items-center justify-between border-b border-slate-50 shrink-0">
            <div>
              <h3 className="text-[11px] font-black text-slate-800 uppercase italic leading-none tracking-tight truncate max-w-[200px]">
                {projeto.titulo}
              </h3>
              <div className="flex items-center gap-1.5 mt-1">
                {isConcluido
                  ? <CheckCircle2 size={10} className="text-green-500" />
                  : <Activity size={10} className="text-blue-500 animate-pulse" />
                }
                <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest leading-none">
                  {isConcluido ? 'Finalizado' : 'Em andamento'}
                </p>
              </div>
            </div>

            {/* BUG 9: área de toque adequada no X mobile (mín 44px) */}
            {/* BUG 1: removido botão "Voltar ao Perfil" com rota inexistente —
                o usuário já está no perfil, o modal é uma sobreposição.
                onClose() fecha o modal e o perfil continua aberto. */}
            <button onClick={onClose} className="p-3 text-slate-300 hover:text-slate-600 transition-colors md:hidden">
              <X size={20} />
            </button>
          </div>

          {/* Conteúdo scrollável */}
          {/* BUG 7: scrollbarWidth inline — sem dependência de plugin */}
          <div className="flex-1 overflow-y-auto p-6 space-y-8" style={{ scrollbarWidth: 'thin' }}>

            {/* Nota técnica (legenda da foto) */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-4 bg-blue-600 rounded-full" />
                <span className="font-black text-slate-900 uppercase text-[10px] tracking-widest italic">Nota Técnica</span>
              </div>
              <p className="text-[14px] text-slate-600 leading-relaxed italic pl-4 border-l-2 border-slate-100 font-medium">
                {fotoAtual?.legenda || 'Acompanhamento técnico em andamento.'}
              </p>
            </div>

            {/* Comentários da fase */}
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-50 pb-2">
                <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-widest italic">
                  Interações da Fase
                </h4>
                {/* Dots de progresso */}
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
                  comentarios.map(com => (
                    <div key={com.id} className="flex gap-3 animate-in fade-in slide-in-from-left-2 duration-300">
                      <div className="w-8 h-8 rounded-xl bg-slate-50 shrink-0 flex items-center justify-center border border-slate-100">
                        <User size={14} className="text-slate-400" />
                      </div>
                      <div className="max-w-[85%] p-3 rounded-2xl rounded-tl-none text-[11px] font-bold leading-tight bg-slate-50 text-slate-600 border border-slate-100 italic">
                        {com.texto}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Barra inferior */}
          <div className="p-5 px-8 border-t border-slate-50 flex items-center justify-between bg-white shrink-0">
            <button
              onClick={handleShare}
              className="text-slate-400 hover:text-blue-600 transition-all active:scale-95 flex items-center gap-2 group"
            >
              <Share2 size={22} className="group-hover:scale-110 transition-transform" />
              <span className="text-[10px] font-black uppercase tracking-widest italic">Compartilhar</span>
            </button>
            {/* BUG 8: String() antes de split — projeto.id pode ser bigint */}
            <span className="text-[9px] font-black text-slate-200 uppercase tracking-[0.2em] italic">
              #{String(projeto.id).split('-')[0]}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}