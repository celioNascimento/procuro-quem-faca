import { ShieldCheck } from 'lucide-react'

export function RodapeSeguranca() {
  return (
    <div className="bg-slate-900 rounded-[2rem] p-6 text-white relative overflow-hidden shadow-2xl">
      <div className="absolute top-0 right-0 w-48 h-48 bg-blue-600/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
      <div className="relative z-10 flex items-center gap-4">
        <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-blue-400 shrink-0">
          <ShieldCheck size={20} />
        </div>
        <p className="text-[10px] font-medium text-slate-400 leading-relaxed">
          Projeto registrado com token único e verificado. Cada etapa é carimbada com data e hora.
        </p>
      </div>
    </div>
  )
}