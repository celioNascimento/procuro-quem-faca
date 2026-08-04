//dashboard/wizard/WizardCompleted.tsx 

import { CheckCircle2, ChevronRight, ChevronLeft, MoreHorizontal, User, Share2 } from 'lucide-react'
import { useUploadWizard } from '@/hooks/useUploadWizard'

interface Props {
  hookData: ReturnType<typeof useUploadWizard>
}

// Renomeado de UploadWizard para WizardCompleted
export function WizardCompleted({ hookData }: Props) {
  const { titulo, projetoId, fotosData, comentariosSlideAtual, currentSlide } = hookData.state
  const { fotosCarrossel, fotoAtual } = hookData.derived
  const { prevSlide, nextSlide, handleShare } = hookData.actions

  return (
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
        <img src={fotoAtual.url || undefined} className="absolute inset-0 w-full h-full object-cover blur-3xl opacity-40 scale-125" aria-hidden="true" />
        <img src={fotoAtual.url || undefined} className="relative z-10 max-w-full max-h-full object-contain shadow-2xl" alt="Registro final" />
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
  )
}