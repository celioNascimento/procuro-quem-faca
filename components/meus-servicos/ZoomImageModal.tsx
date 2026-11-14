//components/meus-servicos/ZoomImageModal.tsx
//
// Foto ampliada. Diálogo acessível: Esc e toque fora fecham, o foco vai para o botão Fechar e volta
// para a foto que foi tocada, e a página atrás não rola.

'use client'
import { useRef } from 'react'
import { X } from 'lucide-react'
import { useDialogoAcessivel } from '@/hooks/useDialogoAcessivel'

export default function ZoomImageModal({
  url, onClose, descricao = 'Foto ampliada',
}: { url: string; onClose: () => void; descricao?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  useDialogoAcessivel(ref, true, onClose)

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/95 p-4 backdrop-blur-md animate-in fade-in duration-300"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div ref={ref} role="dialog" aria-modal="true" aria-label={descricao} className="contents">
        <button
          type="button"
          onClick={onClose}
          aria-label="Fechar foto"
          className="absolute right-4 top-4 flex size-12 items-center justify-center rounded-full bg-white/15 text-white transition-colors hover:bg-white/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
        >
          <X size={24} aria-hidden="true" />
        </button>
        <img
          src={url}
          alt={descricao}
          className="max-h-[80vh] max-w-full rounded-2xl object-contain shadow-2xl ring-1 ring-white/10 animate-in zoom-in-95 duration-300"
        />
        <p className="pointer-events-none absolute bottom-10 text-sm font-medium text-white/70">
          Toque fora da foto para fechar
        </p>
      </div>
    </div>
  )
}
