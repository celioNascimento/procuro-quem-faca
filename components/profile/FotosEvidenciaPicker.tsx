'use client'
import { useRef } from 'react'
import { MAX_ARQUIVOS } from '../../lib/uploadEvidencias'

interface FotosEvidenciaPickerProps {
  fotos: File[]
  onChange: (fotos: File[]) => void
}

export default function FotosEvidenciaPicker({ fotos, onChange }: FotosEvidenciaPickerProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  function handleFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const novos = Array.from(e.target.files ?? [])
    const combinados = [...fotos, ...novos].slice(0, MAX_ARQUIVOS)
    onChange(combinados)
    // Limpa o input para permitir re-seleção do mesmo arquivo
    if (inputRef.current) inputRef.current.value = ''
  }

  function remover(index: number) {
    onChange(fotos.filter((_, i) => i !== index))
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
          Fotos de evidência
        </span>
        <span className="text-[9px] font-bold text-slate-300">
          {fotos.length}/{MAX_ARQUIVOS}
        </span>
      </div>

      {/* Previews */}
      {fotos.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {fotos.map((foto, i) => (
            <div key={i} className="relative group">
              <img
                src={URL.createObjectURL(foto)}
                alt={foto.name}
                className="w-16 h-16 object-cover rounded-2xl border border-slate-100"
              />
              <button
                type="button"
                onClick={() => remover(i)}
                className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full text-[10px] font-black leading-none flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                ×
              </button>
              <span className="absolute bottom-0 left-0 right-0 text-[7px] text-white font-bold bg-black/40 rounded-b-2xl px-1 truncate">
                {(foto.size / 1024).toFixed(0)}KB
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Botão de adicionar */}
      {fotos.length < MAX_ARQUIVOS && (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="w-full py-3 rounded-2xl border-2 border-dashed border-slate-200 text-[9px] font-black text-slate-400 uppercase tracking-widest hover:border-red-200 hover:text-red-400 transition-colors"
        >
          + Adicionar foto
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleFiles}
      />
    </div>
  )
}