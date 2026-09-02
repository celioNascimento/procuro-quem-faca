'use client'

import { useRef } from 'react'
import Image from 'next/image'
import { ImagePlus, Trash2 } from 'lucide-react'

interface Props {
  titulo: string
  fotos: string[]
  uploading?: boolean
  onTituloChange: (value: string) => void
  onAdicionar: (files: File[]) => void
  onRemover: (index: number) => void
}

export function SessaoFotosEditor({ titulo, fotos, uploading, onTituloChange, onAdicionar, onRemover }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const restantes = 5 - fotos.length

  return (
    <section className="flex flex-col gap-5 rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm sm:p-6" aria-labelledby="sessao-fotos-editor-titulo">
      <div className="flex flex-col gap-1.5">
        <p className="text-[10px] font-black uppercase tracking-widest text-blue-600">Sua vitrine</p>
        <h3 id="sessao-fotos-editor-titulo" className="text-lg font-black text-slate-900">Crie uma sessão de fotos</h3>
        <p className="text-sm font-medium leading-relaxed text-slate-500">Mostre seu espaço, ferramentas ou resultados. Escolha o nome que combina com o seu trabalho.</p>
      </div>
      <label className="flex flex-col gap-2 text-xs font-black text-slate-600">
        Nome da sessão
        <input value={titulo} onChange={(event) => onTituloChange(event.target.value)} maxLength={60} placeholder="Ex.: Conheça meu espaço" className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-800 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50" />
      </label>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {fotos.map((foto, index) => (
          <div key={`${foto}-${index}`} className="group relative aspect-square overflow-hidden rounded-2xl bg-slate-100">
            <Image src={foto} alt={`Foto ${index + 1} da sessão`} fill className="object-cover" sizes="160px" />
            <button type="button" onClick={() => onRemover(index)} className="absolute right-2 top-2 flex size-8 items-center justify-center rounded-full bg-slate-950/70 text-white opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100" aria-label={`Remover foto ${index + 1}`}><Trash2 size={15} /></button>
          </div>
        ))}
        {restantes > 0 && <button type="button" disabled={uploading} onClick={() => inputRef.current?.click()} className="flex aspect-square flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-blue-200 bg-blue-50/50 text-blue-600 transition hover:border-blue-400 hover:bg-blue-50 disabled:opacity-60"><ImagePlus size={24} /><span className="text-[10px] font-black uppercase tracking-wide">Adicionar</span></button>}
      </div>
      <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" multiple hidden onChange={(event) => { onAdicionar(Array.from(event.target.files ?? []).slice(0, restantes)); event.currentTarget.value = '' }} />
      <p className="text-[11px] font-medium text-slate-400">{uploading ? 'Enviando fotos…' : `${fotos.length} de 5 fotos adicionadas`}</p>
    </section>
  )
}

export default SessaoFotosEditor
