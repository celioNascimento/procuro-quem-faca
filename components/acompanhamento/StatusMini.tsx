//components/acompanhamento/StatusMini.tsx

import { Activity, LayoutGrid } from 'lucide-react'

type Props = {
  labelEtapaAtual: string
  totalFotos: number
}

export function StatusMini({ labelEtapaAtual, totalFotos }: Props) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="bg-white p-4 rounded-2xl border border-slate-100 flex items-center gap-3 shadow-sm">
        <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
          <Activity size={16} />
        </div>
        <div className="min-w-0">
          <p className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Progresso</p>
          <p className="text-[11px] font-black text-slate-800 uppercase truncate">{labelEtapaAtual}</p>
        </div>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-slate-100 flex items-center gap-3 shadow-sm">
        <div className="w-9 h-9 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 shrink-0">
          <LayoutGrid size={16} />
        </div>
        <div className="min-w-0">
          <p className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Registros</p>
          <p className="text-[11px] font-black text-slate-800 uppercase">{totalFotos} de 3</p>
        </div>
      </div>
    </div>
  )
}