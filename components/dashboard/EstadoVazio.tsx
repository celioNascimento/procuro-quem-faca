import { Camera } from 'lucide-react'

interface Props {
  onNovoProjeto: () => void
}

export function EstadoVazio({ onNovoProjeto }: Props) {
  return (
    <div
      onClick={onNovoProjeto}
      className="border-2 border-dashed border-slate-200 rounded-[2.5rem] p-12 flex flex-col items-center gap-4 text-center cursor-pointer hover:border-blue-300 hover:bg-blue-50/30 transition-all group"
    >
      <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center group-hover:bg-blue-100 transition-colors">
        <Camera size={28} className="text-slate-300 group-hover:text-blue-400 transition-colors" />
      </div>
      <div>
        <p className="text-[13px] font-black text-slate-400 uppercase italic tracking-tight">Nenhum projeto ainda</p>
        <p className="text-[11px] text-slate-300 font-medium mt-1">Clique aqui para adicionar seu primeiro trabalho</p>
      </div>
    </div>
  )
}