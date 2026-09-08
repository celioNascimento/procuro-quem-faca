'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { ModalFotoBase } from '@/components/shared/ModalFotoBase'

export interface SessaoFotosData {
  titulo: string
  fotos: string[]
}

interface SessaoFotosProps {
  sessao?: SessaoFotosData | null
}

export function SessaoFotos({ sessao }: SessaoFotosProps) {
  const [fotoSelecionada, setFotoSelecionada] = useState<number | null>(null)
  const [fotoAtual, setFotoAtual] = useState(0)

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
    <section className="overflow-hidden rounded-[2rem] border border-slate-200/80 bg-white p-4 shadow-[0_18px_45px_-30px_rgba(15,23,42,0.45)] sm:p-6" aria-labelledby="sessao-fotos-titulo">
      <div className="flex items-end justify-between gap-4">
        <h2 id="sessao-fotos-titulo" className="max-w-[75%] text-[11px] font-black uppercase tracking-[0.18em] text-slate-800 sm:text-xs">
          {sessao.titulo}
        </h2>
        <span className="shrink-0 text-[11px] font-bold tabular-nums text-slate-400">{String(fotoAtual + 1).padStart(2, '0')} / {String(fotos.length).padStart(2, '0')}</span>
      </div>

      <div className="relative mt-4 overflow-hidden rounded-[1.35rem] bg-slate-100">
        <button type="button" onClick={() => setFotoAtual((fotoAtual - 1 + fotos.length) % fotos.length)} className="absolute left-3 top-1/2 z-10 flex size-9 -translate-y-1/2 items-center justify-center rounded-full border border-white/60 bg-white/85 text-slate-700 shadow-md backdrop-blur transition hover:bg-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-200" aria-label="Foto anterior">
          <ChevronLeft size={18} aria-hidden="true" />
        </button>
        <button type="button" onClick={() => setFotoSelecionada(fotoAtual)} className="relative block aspect-[4/3] w-full overflow-hidden focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-inset focus-visible:ring-blue-200" aria-label={`Ampliar foto ${fotoAtual + 1}`}>
          <Image src={fotos[fotoAtual]} alt={`${sessao.titulo} — foto ${fotoAtual + 1}`} fill className="object-contain p-2 transition-transform duration-300 hover:scale-[1.02] sm:p-4" sizes="(max-width: 640px) calc(100vw - 48px), 680px" />
        </button>
        <button type="button" onClick={() => setFotoAtual((fotoAtual + 1) % fotos.length)} className="absolute right-3 top-1/2 z-10 flex size-9 -translate-y-1/2 items-center justify-center rounded-full border border-white/60 bg-white/85 text-slate-700 shadow-md backdrop-blur transition hover:bg-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-200" aria-label="Próxima foto">
          <ChevronRight size={18} aria-hidden="true" />
        </button>
      </div>

      <div className="mt-4 flex gap-2 overflow-x-auto pb-1" aria-label="Selecionar foto">
        {fotos.map((foto, index) => (
          <button key={`${foto}-${index}`} type="button" onClick={() => setFotoAtual(index)} className={`relative h-14 w-16 shrink-0 overflow-hidden rounded-lg border-2 transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-200 ${fotoAtual === index ? 'border-blue-600 shadow-sm' : 'border-transparent opacity-60 hover:opacity-100'}`} aria-label={`Selecionar foto ${index + 1}`} aria-current={fotoAtual === index ? 'true' : undefined}>
            <Image src={foto} alt="" fill className="object-cover" sizes="64px" />
          </button>
        ))}
      </div>

      {fotoSelecionada !== null && (
        <ModalFotoBase
          fotoUrl={fotos[fotoSelecionada]}
          ordemLabel={`Foto ${fotoSelecionada + 1} de ${fotos.length}`}
          onClose={() => setFotoSelecionada(null)}
          imageOnly
          navegacao={fotos.length > 1 ? {
            onPrev: () => setFotoSelecionada((fotoSelecionada - 1 + fotos.length) % fotos.length),
            onNext: () => setFotoSelecionada((fotoSelecionada + 1) % fotos.length),
          } : undefined}
        />
      )}
    </section>
  )
}
