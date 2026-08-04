// components/ui/ModalConfirmacao.tsx

'use client'

interface ModalConfirmacaoProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message: string
}

export default function ModalConfirmacao({ isOpen, onClose, onConfirm, title, message }: ModalConfirmacaoProps) {
  if (!isOpen) return null
  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white rounded-[3rem] p-10 max-w-sm w-full shadow-2xl animate-in zoom-in-95">
        <h3 className="text-xl font-black text-slate-900 uppercase italic mb-4">{title}</h3>
        <p className="text-slate-500 text-sm font-medium mb-8 leading-relaxed">{message}</p>
        <div className="flex flex-col gap-3">
          <button onClick={onConfirm} className="w-full py-4 bg-red-500 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-red-600 transition-colors">Sim, apagar tudo</button>
          <button onClick={onClose} className="w-full py-4 bg-slate-100 text-slate-400 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-200 transition-colors">Cancelar</button>
        </div>
      </div>
    </div>
  )
}