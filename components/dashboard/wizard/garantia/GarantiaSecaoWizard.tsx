// components/dashboard/wizard/garantia/GarantiaSecaoWizard.tsx
//
// Seção de garantia exibida DENTRO do UploadWizardContainer, quando o projeto
// está finalizado (isProjetoConcluido) — ao lado de WizardCompleted, não
// substituindo-o. É a "timeline abaixo" da timeline original que definimos
// no desenho do produto.
//
// Só renderiza algo se houver um caso de garantia para o projeto. Delega
// para o subcomponente certo conforme o status do caso.

'use client'

import { useCasoGarantiaDoProjeto } from '@/hooks/useCasoGarantiaDoProjeto'
import { GarantiaAguardandoAceite } from './GarantiaAguardandoAceite'
import { GarantiaAberta } from './GarantiaAberta'
import { GarantiaRespondida } from './GarantiaRespondida'
import { GarantiaFinalizada } from './GarantiaFinalizada'
import { Loader2 } from 'lucide-react'

interface Props {
  projetoId: string
  prestadorId: number
}

export function GarantiaSecaoWizard({ projetoId, prestadorId }: Props) {
  const { caso, loading, recarregar } = useCasoGarantiaDoProjeto(projetoId)

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 size={20} className="animate-spin text-slate-300" />
      </div>
    )
  }

  // Sem caso de garantia — não renderiza nada (seção só existe quando há garantia)
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
