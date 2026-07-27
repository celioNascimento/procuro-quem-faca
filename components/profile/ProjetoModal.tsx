//components/profile/ProjetoModal.tsx 

'use client'
import { X, Share2, CheckCircle2, Activity, User, Camera } from 'lucide-react'
import type { ProjetoPerfil } from '@/types/perfil'
import { useSlides } from '@/hooks/useSlides'
import { useComentariosFoto } from '@/hooks/useComentariosFoto'
import { ModalFotoBase } from '@/components/shared/ModalFotoBase'

interface Props {
  projeto: ProjetoPerfil
  onClose: () => void
}

export default function ProjetoModal({ projeto, onClose }: Props) {
  const { sorted: fotos, fotoAtual, current, next, prev } = useSlides(projeto.portfolio_fotos)
  const comentarios = useComentariosFoto(fotoAtual?.id)

  const isConcluido = projeto.status === 'finalizado'
    || fotos.some(f => f.ordem === 3)

  const handleShare = async () => {
    const url   = typeof window !== 'undefined' ? window.location.href : ''
    const texto = `Confira este trabalho no Procuro Quem Faça: ${projeto.titulo}`
    try {
      if (navigator.share) await navigator.share({ title: projeto.titulo, text: texto, url })
      else await navigator.clipboard.writeText(url)
    } catch { /* usuário cancelou — silencioso */ }
  }

  // Sem fotos — modal simplificado sem usar ModalFotoBase
  if (!fotoAtual) {
    return (
      <div className="fixed inset-0 z-[200] bg-slate-900/95 flex items-center justify-center p-4 animate-in fade-in duration-300">
        <button onClick={onClose} className="absolute top-6 right-6 text-white/50 hover:text-white z-[210]">
          <X size={32} />
        </button>
        <div className="bg-white rounded-[3rem] p-12 flex flex-col items-center gap-3 text-slate-300">
          <Camera size={40} />
          <p className="text-[10px] font-black uppercase tracking-widest italic">Sem imagens</p>
        </div>
      </div>
    )
  }

  const ordemLabel = fotoAtual.ordem != null
    ? `Fase ${String(fotoAtual.ordem).padStart(2, '0')}`
    : 'Registro'

  return (
    <ModalFotoBase
      fotoUrl={fotoAtual.url_foto}
      ordemLabel={ordemLabel}
      onClose={onClose}
      navegacao={fotos.length > 1 ? { onPrev: prev, onNext: next } : undefined}
    >
      {/* ── Cabeçalho ── */}
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
        <button onClick={onClose} className="p-3 text-slate-300 hover:text-slate-600 transition-colors md:hidden">
          <X size={20} />
        </button>
      </div>

      {/* ── Conteúdo rolável ── */}
      <div className="flex-1 overflow-y-auto p-6 space-y-8" style={{ scrollbarWidth: 'thin' }}>

        {/* Nota técnica */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-4 bg-blue-600 rounded-full" />
            <span className="font-black text-slate-900 uppercase text-[10px] tracking-widest italic">
              Nota Técnica
            </span>
          </div>
          <p className="text-[14px] text-slate-600 leading-relaxed italic pl-4 border-l-2 border-slate-100 font-medium">
            {fotoAtual.legenda || 'Acompanhamento técnico em andamento.'}
          </p>
        </div>

        {/* Comentários */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-50 pb-2">
            <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-widest italic">
              Interações da Fase
            </h4>
            {/* Indicadores de slide */}
            <div className="flex gap-1">
              {fotos.map((_, i) => (
                <div
                  key={i}
                  className={`h-1 rounded-full transition-all duration-300 ${
                    current === i ? 'w-4 bg-blue-600' : 'w-1 bg-slate-200'
                  }`}
                />
              ))}
            </div>
          </div>

          {comentarios.length === 0 ? (
            <p className="text-[10px] text-slate-300 italic">
              Sem registros de feedback nesta fase.
            </p>
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

      {/* ── Rodapé ── */}
      <div className="p-5 px-8 border-t border-slate-50 flex items-center justify-between bg-white shrink-0">
        <button
          onClick={handleShare}
          className="text-slate-400 hover:text-blue-600 transition-all active:scale-95 flex items-center gap-2 group"
        >
          <Share2 size={22} className="group-hover:scale-110 transition-transform" />
          <span className="text-[10px] font-black uppercase tracking-widest italic">Compartilhar</span>
        </button>
        <span className="text-[9px] font-black text-slate-200 uppercase tracking-[0.2em] italic">
          #{String(projeto.id).split('-')[0]}
        </span>
      </div>
    </ModalFotoBase>
  )
}