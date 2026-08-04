//components/dashboard/DashboardHeader.tsx

import { Plus, CheckCircle2 } from 'lucide-react'

interface Props {
  totalProjetos: number
  totalConcluidos: number
  totalAtivos: number
  onNovoProjeto: () => void
}

export function DashboardHeader({ totalProjetos, totalConcluidos, totalAtivos, onNovoProjeto }: Props) {
  return (
    <section className="rounded-[2rem] bg-blue-600 p-5 text-white shadow-lg shadow-blue-100 sm:p-7" aria-labelledby="portfolio-summary-title">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-blue-100">Seu portfólio</p>
            <h2 id="portfolio-summary-title" className="text-balance text-2xl font-black tracking-tight sm:text-3xl">
              {totalProjetos === 0
                ? 'Mostre o seu melhor trabalho'
                : `${totalProjetos} ${totalProjetos === 1 ? 'projeto publicado' : 'projetos publicados'}`}
            </h2>
          </div>

          {totalProjetos > 0 && (
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs font-bold text-blue-100">
              {totalConcluidos > 0 && (
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 size={14} aria-hidden="true" />
                  {totalConcluidos} concluído{totalConcluidos > 1 ? 's' : ''}
                </span>
              )}
              {totalAtivos > 0 && (
                <span className="flex items-center gap-1.5">
                  <span className="size-2 rounded-full bg-white" aria-hidden="true" />
                  {totalAtivos} ativo{totalAtivos > 1 ? 's' : ''}
                </span>
              )}
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={onNovoProjeto}
          className="flex min-h-12 w-full shrink-0 items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 text-[11px] font-black uppercase tracking-widest text-blue-600 shadow-sm transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-blue-600 active:translate-y-0 sm:w-auto"
        >
          <Plus size={17} strokeWidth={3} aria-hidden="true" />
          Adicionar trabalho
        </button>
      </div>
    </section>
  )
}
