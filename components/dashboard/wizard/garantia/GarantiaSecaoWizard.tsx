// components/dashboard/wizard/garantia/GarantiaSecaoWizard.tsx
//
// Recebe caso/loading/recarregar via props (lifting feito no
// UploadWizardContainer) — evita query duplicada já que o container
// precisa do caso para derivar temGarantiaAtiva e ajustar o badge de status.

'use client'

import { GarantiaAguardandoAceite } from './GarantiaAguardandoAceite'
import { GarantiaAberta }           from './GarantiaAberta'
import { GarantiaRespondida }       from './GarantiaRespondida'
import { GarantiaFinalizada }       from './GarantiaFinalizada'
import { Loader2 }                  from 'lucide-react'
import type { CasoGarantia }       from '@/hooks/useCasoGarantiaDoProjeto'

interface Props {
  prestadorId: number
  caso: CasoGarantia | null
  loadingCaso: boolean
  recarregar: () => void
}

export function GarantiaSecaoWizard({ prestadorId, caso, loadingCaso, recarregar }: Props) {
  if (loadingCaso) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 size={20} className="animate-spin text-slate-300" />
      </div>
    )
  }

  if (!caso) return null

  return (
    <div className="mt-4 pt-4 border-t-2 border-dashed border-orange-100">
      <div className="flex items-center gap-2 mb-4 px-1">
        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-orange-500">
          Garantia
        </span>
        <span className="text-[9px] font-medium text-slate-400">
          Continuação deste projeto
        </span>
      </div>

      {caso.status === 'aguardando_aceite_cliente' && (
        <GarantiaAguardandoAceite caso={caso} />
      )}

      {caso.status === 'aberta' && (
        <GarantiaAberta caso={caso} prestadorId={prestadorId} onAtualizado={recarregar} />
      )}

      {caso.status === 'respondida' && (
        <GarantiaRespondida caso={caso} prestadorId={prestadorId} />
      )}

      {['resolvida', 'sem_resposta', 'recusada'].includes(caso.status) && (
        <GarantiaFinalizada caso={caso} prestadorId={prestadorId} />
      )}
    </div>
  )
}
