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
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-3 bg-slate-950/95 p-4 pt-20" role="dialog" aria-modal="true" aria-label="Visualização da foto" onClick={() => setFotoSelecionada(null)}>
          <div className="fixed inset-0 z-[9999] pointer-events-none">
            <button type="button" onClick={() => setFotoSelecionada(null)} className="pointer-events-auto fixed right-4 top-4 flex h-14 items-center gap-2 rounded-full bg-white px-5 text-base font-black text-slate-950 shadow-2xl ring-4 ring-blue-500/40" aria-label="Fechar visualização"><X size={22} aria-hidden="true" /> FECHAR</button>
            <p className="sr-only">Foto ampliada. Use o botão FECHAR no canto superior direito para voltar ao perfil.</p>
          </div>
          <span className="sr-only">Para sair, toque no botão Fechar no alto da tela, toque fora da foto ou pressione Escape.</span>
          <button type="button" onClick={(event) => { event.stopPropagation(); setFotoSelecionada((fotoSelecionada - 1 + fotos.length) % fotos.length) }} className="absolute left-3 top-1/2 z-20 flex size-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/15 text-white" aria-label="Foto anterior"><ChevronLeft /></button>
          <div className="relative h-[calc(100vh-9rem)] w-full max-w-4xl" onClick={(event) => event.stopPropagation()}><Image src={fotos[fotoSelecionada]} alt={`${sessao.titulo} — foto ampliada`} fill className="object-contain" sizes="100vw" /></div>
          <button type="button" onClick={(event) => { event.stopPropagation(); setFotoSelecionada((fotoSelecionada + 1) % fotos.length) }} className="absolute right-3 top-1/2 z-20 flex size-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/15 text-white" aria-label="Próxima foto"><ChevronRight /></button>
        </div>
      )}
    </section>
  )
}
