//components/perfil/FotoUpload.tsx

'use client'

import { useRef } from 'react'
import { Loader2, Camera, User } from 'lucide-react'

interface FotoUploadProps {
  fotoUrl?: string | null
  uploading: boolean
  tentouEnviar?: boolean
  onChange: (file: File) => void
  /** 'dashboard' não fica "grudado" sozinho (a coluna que o contém já cuida disso). */
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
    // Permite escolher de novo o mesmo arquivo.
    e.target.value = ''
  }

  const abrirSeletor = () => { if (!uploading) inputRef.current?.click() }

  return (
    <section
      aria-label="Foto do perfil"
      className={`flex flex-col items-center gap-4 rounded-3xl border bg-white p-5 shadow-sm sm:p-6 ${fotoComErro ? 'border-red-300' : 'border-slate-200'} ${variant === 'cadastro' ? 'sticky top-24' : ''}`}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        disabled={uploading}
        className="hidden"
        aria-label="Escolher foto do perfil"
      />

      <button
        type="button"
        onClick={abrirSeletor}
        disabled={uploading}
        aria-label={fotoUrl ? 'Trocar a foto do perfil' : 'Escolher a foto do perfil'}
        className={`group relative flex aspect-[4/3] w-full max-w-sm items-center justify-center overflow-hidden rounded-2xl border bg-slate-50 transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-100 ${fotoComErro ? 'border-red-300 ring-4 ring-red-100' : 'border-slate-200 hover:border-blue-300'}`}
      >
        {uploading ? (
          <Loader2 className="animate-spin text-blue-500" size={32} aria-hidden="true" />
        ) : fotoUrl ? (
          <img src={fotoUrl} alt="Foto atual do seu perfil" className="size-full object-contain p-3" />
        ) : (
          <span className="flex flex-col items-center gap-2 px-4 text-center">
            <User size={44} className={fotoComErro ? 'text-red-300' : 'text-slate-300'} aria-hidden="true" />
            {variant === 'cadastro' && <span className="text-sm font-bold text-slate-400">Foto profissional</span>}
          </span>
        )}
      </button>

      <button
        type="button"
        onClick={abrirSeletor}
        disabled={uploading}
        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-100 disabled:opacity-60"
      >
        <Camera size={16} aria-hidden="true" />
        {fotoUrl ? 'Trocar foto' : 'Escolher foto'}
      </button>

      {fotoComErro ? (
        <p role="alert" className="text-center text-sm font-bold text-red-600">A foto do perfil é obrigatória.</p>
      ) : (
        <p className="text-center text-xs leading-relaxed text-slate-500">
          Essa é a sua foto na vitrine. Prefira uma imagem nítida do seu rosto ou da sua marca.
        </p>
      )}
    </section>
  )
}
