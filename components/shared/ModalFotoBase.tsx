import { X } from 'lucide-react'
import { ReactNode } from 'react'

interface Props {
  fotoUrl: string
  ordemLabel: string        // ex: "Registro 01" ou "Fase Início"
  onClose?: () => void      // undefined = sem botão de fechar no overlay
  children: ReactNode       // coluna direita — cada modal passa o seu
}

/**
 * Estrutura visual compartilhada pelos dois modais de foto:
 * - WizardZoomModal  (prestador — edita legenda, faz upload)
 * - ModalDiscussao   (cliente   — leitura, comentários bidirecionais)
 *
 * Responsabilidades deste componente:
 * - Overlay escuro sem backdrop-blur (performance)
 * - Painel esquerdo com a foto
 * - Badge de fase no canto superior esquerdo
 * - Botão X no canto superior direito do overlay (desktop)
 * - Slot `children` para a coluna direita customizável
 *
 * Cada modal filho cuida apenas da sua lógica de negócio.
 */
export function ModalFotoBase({ fotoUrl, ordemLabel, onClose, children }: Props) {
  return (
    <div className="fixed inset-0 z-[200] bg-slate-900/95 flex items-center justify-center p-2 md:p-8 animate-in fade-in duration-300">

      {/* Botão fechar flutuante — só aparece se onClose for passado */}
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
          {/* Fundo gradiente em vez de blur-3xl — mesmo efeito, GPU zero */}
          <div className="absolute inset-0 bg-gradient-to-br from-slate-800 to-slate-950 opacity-80" />
          <img
            src={fotoUrl}
            className="relative z-10 max-w-full max-h-full object-contain"
            alt={ordemLabel}
          />
          <div className="absolute top-6 left-6 bg-blue-600/90 px-4 py-2 rounded-full text-white text-[10px] font-black uppercase italic tracking-widest border border-blue-400/20 z-20">
            {ordemLabel}
          </div>
        </div>

        {/* ── Painel direito: slot customizável ── */}
        <div className="flex-1 flex flex-col bg-white overflow-hidden border-l border-slate-50">
          {children}
        </div>

      </div>
    </div>
  )
}