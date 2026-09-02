'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { Camera } from 'lucide-react'
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
