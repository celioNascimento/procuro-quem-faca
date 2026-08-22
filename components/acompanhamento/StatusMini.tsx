// components/acompanhamento/StatusMini.tsx

import { Activity, LayoutGrid, ShieldAlert } from 'lucide-react'

type Props = {
  labelEtapaAtual: string
  totalFotos: number
  temGarantiaAtiva?: boolean
  statusGarantia?: string // status do caso de garantia quando ativo
}

// Label legível para o status do caso de garantia
const LABEL_GARANTIA: Record<string, string> = {
  aguardando_aceite_cliente: 'Aguard. aceite',
  aberta:                    'Em análise',
  respondida:                'Resp. recebida',
}

export function StatusMini({
  labelEtapaAtual,
  totalFotos,
  temGarantiaAtiva = false,
  statusGarantia,
}: Props) {
  const labelProgresso = temGarantiaAtiva
    ? (statusGarantia ? (LABEL_GARANTIA[statusGarantia] ?? 'Em garantia') : 'Em garantia')
    : labelEtapaAtual

  const iconProgresso = temGarantiaAtiva
    ? <ShieldAlert size={16} />
    : <Activity size={16} />

  const corProgresso = temGarantiaAtiva
    ? 'bg-orange-50 text-orange-500'
    : 'bg-blue-50 text-blue-600'

  return (
    <div className="grid grid-cols-2 gap-3">
      {/* Progresso / Garantia */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 flex items-center gap-3 shadow-sm">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${corProgresso}`}>
          {iconProgresso}
        </div>
        <div className="min-w-0">
          <p className="text-[9px] font-black uppercase text-slate-400 tracking-wider">
            {temGarantiaAtiva ? 'Garantia' : 'Progresso'}
          </p>
          <p className="text-[11px] font-black text-slate-800 uppercase truncate">
            {labelProgresso}
          </p>
        </div>
      </div>

      {/* Registros — mantido igual */}
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
