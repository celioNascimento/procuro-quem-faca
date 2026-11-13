// components/dashboard/VitrineDeFotos.tsx
//
// Galeria simples do profissional: até 5 fotos, sem cliente e sem etapas. Aparece na primeira tela
// do painel para quem ainda não tem trabalhos (e para quem vende produtos em vez de serviços).
// Não substitui os "Trabalhos": só eles passam pelo aceite e pela avaliação do cliente.
'use client'

import { useRef } from 'react'
import Image from 'next/image'
import { ImagePlus, Trash2 } from 'lucide-react'
import { useVitrine } from '@/hooks/useVitrine'
import { fotosRestantes, MAX_FOTOS_VITRINE, MAX_TITULO_VITRINE, TITULO_PADRAO_VITRINE, type Vitrine } from '@/lib/vitrine/vitrine'

interface Props {
  prestadorId: number
  inicial: Vitrine
}

export function VitrineDeFotos({ prestadorId, inicial }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const { titulo, setTitulo, fotos, enviando, mensagem, adicionar, remover, salvarTitulo } = useVitrine(prestadorId, inicial)
  const restantes = fotosRestantes(fotos)

  return (
    <section
      className="flex flex-col gap-4 rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
      aria-labelledby="vitrine-de-fotos-titulo"
    >
      <div className="flex flex-col gap-1">
        <h2 id="vitrine-de-fotos-titulo" className="text-lg font-black tracking-tight text-slate-900">Vitrine de fotos</h2>
        <p className="text-sm leading-relaxed text-slate-600">
          Mostre seus produtos, seu espaço ou o seu trabalho. Não precisa de cliente. Aparece no seu perfil público.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {fotos.map((foto, indice) => (
          <div key={`${foto}-${indice}`} className="relative aspect-square overflow-hidden rounded-2xl bg-slate-100">
            <Image src={foto} alt={`Foto ${indice + 1} da vitrine`} fill className="object-cover" sizes="160px" />
            <button
              type="button"
              onClick={() => remover(indice)}
              disabled={enviando}
              aria-label={`Remover a foto ${indice + 1}`}
              className="absolute right-2 top-2 flex size-9 items-center justify-center rounded-full bg-slate-950/70 text-white transition-colors hover:bg-red-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white disabled:opacity-50"
            >
              <Trash2 size={16} aria-hidden="true" />
            </button>
          </div>
        ))}
        {restantes > 0 && (
          <button
            type="button"
            disabled={enviando}
            onClick={() => inputRef.current?.click()}
            className="flex aspect-square flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-blue-200 bg-blue-50/50 p-2 text-center text-blue-700 transition-colors hover:border-blue-400 hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-100 disabled:opacity-60"
          >
            <ImagePlus size={24} aria-hidden="true" />
            <span className="text-sm font-bold leading-tight">{enviando ? 'Enviando…' : fotos.length === 0 ? 'Adicionar a primeira foto' : 'Adicionar foto'}</span>
          </button>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        hidden
        onChange={(evento) => {
          const arquivos = Array.from(evento.target.files ?? [])
          evento.target.value = ''
          void adicionar(arquivos)
        }}
      />

      {fotos.length > 0 && (
        <label className="flex flex-col gap-1.5 text-sm font-bold text-slate-700">
          Nome da vitrine (opcional)
          <input
            value={titulo}
            onChange={(evento) => setTitulo(evento.target.value)}
            onBlur={() => void salvarTitulo()}
            maxLength={MAX_TITULO_VITRINE}
            placeholder={`Ex.: ${TITULO_PADRAO_VITRINE}`}
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-base font-medium text-slate-800 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
          />
        </label>
      )}

      <p
        role="status"
        aria-live="polite"
        className={`text-sm font-medium ${mensagem?.tipo === 'erro' ? 'text-red-700' : mensagem ? 'text-emerald-700' : 'text-slate-500'}`}
      >
        {mensagem?.texto ?? `${fotos.length} de ${MAX_FOTOS_VITRINE} fotos. Cada foto é salva na hora.`}
      </p>
    </section>
  )
}
