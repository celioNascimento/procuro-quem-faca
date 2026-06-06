'use client'
import { X } from 'lucide-react'

export default function ZoomImageModal({
  url, onClose
}: { url: string; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-[100] bg-slate-900/95 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300"
      onClick={onClose}
    >
      <button className="absolute top-6 right-6 text-white/70 bg-white/10 p-3 rounded-full hover:bg-white/20 transition-all">
        <X size={24} />
      </button>
      <img
        src={url}
        className="max-w-full max-h-[80vh] object-contain rounded-2xl shadow-2xl animate-in zoom-in-95 duration-300 ring-1 ring-white/10"
        alt="Zoom"
      />
      <p className="absolute bottom-12 text-white/40 text-[10px] font-bold uppercase tracking-[0.3em]">
        Toque para fechar
      </p>
    </div>
  )
}