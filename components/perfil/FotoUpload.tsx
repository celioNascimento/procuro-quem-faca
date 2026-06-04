'use client'

import { useRef } from 'react'
import { Loader2, Camera, User } from 'lucide-react'

interface FotoUploadProps {
  fotoUrl?: string | null
  uploading: boolean
  tentouEnviar?: boolean
  onChange: (file: File) => void
  /** Mostra botão de câmera estilo dashboard (mais compacto) */
  variant?: 'cadastro' | 'dashboard'
}

export function FotoUpload({
  fotoUrl,
  uploading,
  tentouEnviar = false,
  onChange,
  variant = 'cadastro',
}: FotoUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const fotoComErro = tentouEnviar && !fotoUrl

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) onChange(file)
  }

  return (
    <section className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm flex flex-col items-center gap-6 sticky top-24">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        disabled={uploading}
        className="hidden"
      />

      <div
        onClick={() => !uploading && inputRef.current?.click()}
        className={`
          relative w-40 h-40 md:w-48 md:h-48 rounded-[3.5rem] bg-slate-50
          border-4 border-white shadow-xl flex items-center justify-center
          overflow-hidden group transition-all cursor-pointer
          ${fotoComErro ? 'ring-4 ring-red-200' : 'hover:scale-[1.02]'}
        `}
      >
        {uploading ? (
          <Loader2 className="animate-spin text-blue-500" size={32} />
        ) : fotoUrl ? (
          <img src={fotoUrl} alt="Preview" className="w-full h-full object-cover transition-transform group-hover:scale-105" />
        ) : (
          variant === 'dashboard'
            ? <User size={48} className={fotoComErro ? 'text-red-200' : 'text-slate-200'} />
            : <span className="text-slate-400 font-bold text-xs text-center px-4 uppercase tracking-widest">Foto Profissional</span>
        )}

        {!uploading && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10 backdrop-blur-sm">
            <div className="flex flex-col items-center gap-1 text-white">
              <Camera size={20} />
              <span className="text-[10px] font-bold uppercase tracking-widest">Alterar</span>
            </div>
          </div>
        )}
      </div>

      {fotoComErro && (
        <p className="text-red-400 text-[11px] font-bold text-center uppercase tracking-wider animate-in fade-in">
          ⚠ Foto obrigatória
        </p>
      )}

      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest text-center mt-2">
        Sua foto na vitrine
      </p>
    </section>
  )
}