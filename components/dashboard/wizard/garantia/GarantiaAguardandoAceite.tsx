// components/dashboard/wizard/garantia/GarantiaAguardandoAceite.tsx
//
// Estado: origem='prestador', prestador já ofereceu reparo em reação a uma
// avaliação negativa, mas o cliente ainda não aceitou. Prestador só acompanha
// — não há ação disponível aqui (evita ele "pressionar" pelo próprio app,
// a decisão é inteiramente do cliente).

import { Clock } from 'lucide-react'
import type { CasoGarantia } from '@/hooks/useCasoGarantiaDoProjeto'

interface Props {
  caso: CasoGarantia
}

export function GarantiaAguardandoAceite({ caso }: Props) {
  return (
    <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 flex items-start gap-3">
      <Clock size={18} className="text-amber-500 shrink-0 mt-0.5" />
      <div>
        <p className="text-[11px] font-black uppercase tracking-wide text-amber-700 leading-none mb-1.5">
          Aguardando resposta do cliente
        </p>
        <p className="text-[11px] font-medium text-amber-700/80 leading-snug">
          Você ofereceu reparo para esta avaliação. Assim que o cliente aceitar,
          o caso é aberto aqui e você poderá responder.
        </p>
        <p className="text-[10px] text-amber-600/70 mt-2 italic">
          "{caso.descricao_problema}"
        </p>
      </div>
    </div>
  )
}
