import { X, ChevronLeft, ChevronRight } from 'lucide-react'
import { ReactNode } from 'react'
import React from 'react'

interface Navegacao {
  onPrev: (e?: React.MouseEvent) => void
  onNext: (e?: React.MouseEvent) => void
}

interface Props {
  fotoUrl: string
  ordemLabel: string
  onClose?: () => void
  navegacao?: Navegacao    // opcional — só ProjetoModal usa
  children: ReactNode
}

/**
 * Estrutura visual compartilhada por:
 * - WizardZoomModal  (prestador — edita legenda, faz upload)
 * - ModalDiscussao   (cliente   — comentários bidirecionais)
 * - ProjetoModal     (público   — visualização + navegação entre fotos)
 *
 * Sem backdrop-blur em nenhum ponto — substituído por bg sólido.
 * A prop `navegacao` é opcional: quando passada, exibe setas prev/next
 * sobrepostas à foto.
 */
export function ModalFotoBase({ fotoUrl, ordemLabel, onClose, navegacao, children }: Props) {
  return (
    <div className="fixed inset-0 z-[200] bg-slate-900/95 flex items-center justify-center p-2 md:p-8 animate-in fade-in duration-300">

      {onClose && (
        <button
          onClick={onClose}
          className="absolute top-6 right-6 text-white/50 hover:text-white transition-colors z-[210]"
        >
          <X size={32} />
        </button>
      )}

      <div className="flex flex-col md:flex-row bg-white rounded-[3rem] overflow-hidden w-full max-w-5xl h-full max-h-[90vh] shadow-2xl">

        {/* ── Painel esquerdo: foto ── */}
        <div className="flex-[1.5] bg-slate-900 flex items-center justify-center relative overflow-hidden">
          {/* Gradiente em vez de blur-3xl — mesmo efeito visual, GPU zero */}
          <div className="absolute inset-0 bg-gradient-to-br from-slate-800 to-slate-950 opacity-80" />
          <img
            src={fotoUrl}
            className="relative z-10 max-w-full max-h-full object-contain"
            alt={ordemLabel}
          />
          <div className="absolute top-6 left-6 bg-blue-600/90 px-4 py-2 rounded-full text-white text-[10px] font-black uppercase italic tracking-widest border border-blue-400/20 z-20">
            {ordemLabel}
          </div>

          {/* Setas de navegação — só quando navegacao for passado */}
          {navegacao && (
            <div className="absolute inset-x-4 top-1/2 -translate-y-1/2 flex justify-between items-center z-40">
              <button
                onClick={navegacao.onPrev}
                className="w-10 h-10 bg-white/10 hover:bg-white/90 rounded-full flex items-center justify-center text-white hover:text-slate-900 transition-all shadow-xl active:scale-90 border border-white/10"
              >
                <ChevronLeft size={20} />
              </button>
              <button
                onClick={navegacao.onNext}
                className="w-10 h-10 bg-white/10 hover:bg-white/90 rounded-full flex items-center justify-center text-white hover:text-slate-900 transition-all shadow-xl active:scale-90 border border-white/10"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          )}
        </div>

        {/* ── Painel direito: slot customizável ── */}
        <div className="flex-1 flex flex-col bg-white overflow-hidden border-l border-slate-50">
          {children}
        </div>

      </div>
    </div>
  )
}