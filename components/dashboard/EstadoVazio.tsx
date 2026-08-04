//components/dashboard/EstadoVazio.tsx

import { Camera } from 'lucide-react'

interface Props {
  onNovoProjeto: () => void
}

export function EstadoVazio({ onNovoProjeto }: Props) {
  return (
    <button
      type="button"
      onClick={onNovoProjeto}
      className="group flex min-h-64 w-full flex-col items-center justify-center gap-5 rounded-[2rem] border-2 border-dashed border-slate-200 bg-white p-8 text-center transition-colors hover:border-blue-300 hover:bg-blue-50/40 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-100 sm:p-12"
    >
      <span className="flex size-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 transition-colors group-hover:bg-blue-100 group-hover:text-blue-600">
        <Camera size={28} aria-hidden="true" />
      </span>
      <span className="flex max-w-sm flex-col gap-1.5">
        <span className="text-base font-black tracking-tight text-slate-700">Seu portfólio começa aqui</span>
        <span className="text-sm font-medium leading-relaxed text-slate-400">Adicione fotos de um trabalho para mostrar sua experiência aos clientes.</span>
      </span>
      <span className="text-[10px] font-black uppercase tracking-[0.18em] text-blue-600">Adicionar primeiro projeto</span>
    </button>
  )
}
