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
    <section className="overflow-hidden rounded-[2rem] border border-slate-100 bg-white p-5 shadow-sm sm:p-7" aria-labelledby="sessao-fotos-titulo">
      <h2 id="sessao-fotos-titulo" className="text-[10px] font-black uppercase tracking-widest text-blue-600">
        {sessao.titulo}
      </h2>

      <div className="relative mt-5">
        <button type="button" onClick={() => setFotoAtual((fotoAtual - 1 + fotos.length) % fotos.length)} className="absolute left-2 top-1/2 z-10 flex size-10 -translate-y-1/2 items-center justify-center rounded-full bg-slate-900/75 text-white shadow-lg transition hover:bg-slate-900 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-200" aria-label="Foto anterior">
          <ChevronLeft size={22} aria-hidden="true" />
        </button>
        <button type="button" onClick={() => setFotoSelecionada(fotoAtual)} className="relative block aspect-[16/9] w-full overflow-hidden rounded-2xl bg-slate-100 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-200" aria-label={`Ampliar foto ${fotoAtual + 1}`}>
          <Image src={fotos[fotoAtual]} alt={`${sessao.titulo} — foto ${fotoAtual + 1}`} fill className="object-cover transition-transform duration-300 hover:scale-105" sizes="(max-width: 640px) 100vw, 720px" />
        </button>
        <button type="button" onClick={() => setFotoAtual((fotoAtual + 1) % fotos.length)} className="absolute right-2 top-1/2 z-10 flex size-10 -translate-y-1/2 items-center justify-center rounded-full bg-slate-900/75 text-white shadow-lg transition hover:bg-slate-900 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-200" aria-label="Próxima foto">
          <ChevronRight size={22} aria-hidden="true" />
        </button>
        <p className="mt-3 text-center text-xs font-semibold text-slate-400">{fotoAtual + 1} de {fotos.length}</p>
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
