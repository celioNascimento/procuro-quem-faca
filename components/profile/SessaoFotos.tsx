'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { Camera, ChevronLeft, ChevronRight, X } from 'lucide-react'

export interface SessaoFotosData {
  titulo: string
  fotos: string[]
}

interface SessaoFotosProps {
  sessao?: SessaoFotosData | null
}

export function SessaoFotos({ sessao }: SessaoFotosProps) {
  const [fotoSelecionada, setFotoSelecionada] = useState<number | null>(null)

  useEffect(() => {
    if (fotoSelecionada === null) return
    const fecharComEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setFotoSelecionada(null)
    }
    document.addEventListener('keydown', fecharComEscape)
    return () => document.removeEventListener('keydown', fecharComEscape)
  }, [fotoSelecionada])

  if (!sessao?.titulo || sessao.fotos.length === 0) return null

  const fotos = sessao.fotos.slice(0, 5)

  return (
    <section className="overflow-hidden rounded-[2rem] border border-slate-100 bg-white p-5 shadow-sm sm:p-7" aria-labelledby="sessao-fotos-titulo">
      <div className="flex items-start gap-3">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
          <Camera size={21} aria-hidden="true" />
        </span>
        <div>
          <h2 id="sessao-fotos-titulo" className="text-xl font-black tracking-tight text-slate-900 sm:text-2xl">{sessao.titulo}</h2>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {fotos.map((foto, index) => (
          <button key={`${foto}-${index}`} type="button" onClick={() => setFotoSelecionada(index)} className={`relative overflow-hidden rounded-2xl bg-slate-100 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-100 ${index === 0 ? 'col-span-2 row-span-2 aspect-square sm:col-span-2' : 'aspect-square'}`} aria-label={`Ampliar foto ${index + 1}`}>
            <Image src={foto} alt={`${sessao.titulo} — foto ${index + 1}`} fill className="object-cover transition-transform duration-300 hover:scale-105" sizes="(max-width: 640px) 50vw, 33vw" />
          </button>
        ))}
      </div>

      {fotoSelecionada !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 p-4" role="dialog" aria-modal="true" aria-label="Visualização da foto" onClick={() => setFotoSelecionada(null)}>
          <span className="sr-only">Pressione Escape para fechar a visualização</span>
          <button type="button" onClick={() => setFotoSelecionada(null)} className="absolute right-4 top-4 z-10 flex h-11 items-center gap-2 rounded-full bg-white px-4 text-sm font-bold text-slate-900 shadow-lg" aria-label="Fechar visualização"><X size={18} aria-hidden="true" /> Fechar</button>
          <button type="button" onClick={(event) => { event.stopPropagation(); setFotoSelecionada((fotoSelecionada - 1 + fotos.length) % fotos.length) }} className="absolute left-3 flex size-11 items-center justify-center rounded-full bg-white/10 text-white" aria-label="Foto anterior"><ChevronLeft /></button>
          <div className="relative h-[75vh] w-full max-w-4xl" onClick={(event) => event.stopPropagation()}><Image src={fotos[fotoSelecionada]} alt={`${sessao.titulo} — foto ampliada`} fill className="object-contain" sizes="100vw" /></div>
          <button type="button" onClick={(event) => { event.stopPropagation(); setFotoSelecionada((fotoSelecionada + 1) % fotos.length) }} className="absolute right-3 flex size-11 items-center justify-center rounded-full bg-white/10 text-white" aria-label="Próxima foto"><ChevronRight /></button>
        </div>
      )}
    </section>
  )
}
