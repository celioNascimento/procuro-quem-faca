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
    <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-[2.5rem] p-6 md:p-8 text-white relative overflow-hidden">
      {/* Decoração geométrica */}
      <div className="absolute -top-6 -right-6 w-32 h-32 bg-white/5 rounded-full" />
      <div className="absolute -bottom-10 -left-4 w-40 h-40 bg-white/5 rounded-full" />

      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <p className="text-blue-200 text-[9px] font-black uppercase tracking-[0.3em] mb-1">
            Portfólio
          </p>
          <h2 className="text-2xl md:text-3xl font-black uppercase italic tracking-tight leading-none">
            {totalProjetos === 0
              ? 'Nenhum Projeto'
              : `${totalProjetos} ${totalProjetos === 1 ? 'Projeto' : 'Projetos'}`}
          </h2>

          {totalProjetos > 0 && (
            <div className="flex items-center gap-4 mt-3">
              {totalConcluidos > 0 && (
                <span className="flex items-center gap-1.5 text-[10px] font-bold text-blue-100">
                  <CheckCircle2 size={12} className="text-green-300" />
                  {totalConcluidos} concluído{totalConcluidos > 1 ? 's' : ''}
                </span>
              )}
              {totalAtivos > 0 && (
                <span className="flex items-center gap-1.5 text-[10px] font-bold text-blue-100">
                  <span className="w-2 h-2 rounded-full bg-blue-300 animate-pulse" />
                  {totalAtivos} ativo{totalAtivos > 1 ? 's' : ''}
                </span>
              )}
            </div>
          )}
        </div>

        <button
          onClick={onNovoProjeto}
          className="flex items-center justify-center gap-2 bg-white text-blue-600 px-6 py-3.5 rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-blue-50 active:scale-95 transition-all shadow-lg shadow-blue-800/20 shrink-0 w-full md:w-auto"
        >
          <Plus size={16} strokeWidth={3} />
          Adicionar Trabalho
        </button>
      </div>
    </div>
  )
}