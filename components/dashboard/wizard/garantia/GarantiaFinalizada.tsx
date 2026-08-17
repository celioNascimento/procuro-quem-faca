// components/dashboard/wizard/garantia/GarantiaFinalizada.tsx
//
// Estados terminais: resolvida, sem_resposta, recusada.
// Só exibição — sem ações. Mostra o carrossel de fotos (via useGarantiaWizard,
// somente leitura) para o prestador rever o histórico do caso.

import { CheckCircle2, XCircle, ShieldOff } from 'lucide-react'
import type { CasoGarantia } from '@/hooks/useCasoGarantiaDoProjeto'
import { useGarantiaWizard } from '@/hooks/useGarantiaWizard'

interface Props {
  caso: CasoGarantia
  prestadorId: number
}

const CONFIG_STATUS = {
  resolvida: {
    icon: CheckCircle2,
    cor: 'text-green-600 bg-green-50 border-green-200',
    titulo: 'Garantia resolvida',
  },
  sem_resposta: {
    icon: ShieldOff,
    cor: 'text-red-600 bg-red-50 border-red-200',
    titulo: 'Prazo de resposta perdido',
  },
  recusada: {
    icon: XCircle,
    cor: 'text-slate-500 bg-slate-50 border-slate-200',
    titulo: 'Oferta recusada pelo cliente',
  },
} as const

export function GarantiaFinalizada({ caso, prestadorId }: Props) {
  const { state, derived } = useGarantiaWizard({
    casoId: caso.id,
    autorTipo: 'prestador',
    autorUserId: null, // somente leitura aqui, não faz upload
  })

  const config = CONFIG_STATUS[caso.status as keyof typeof CONFIG_STATUS]
  if (!config) return null
  const Icon = config.icon

  return (
    <div className="space-y-4">
      <div className={`rounded-2xl p-5 border flex items-start gap-3 ${config.cor}`}>
        <Icon size={18} className="shrink-0 mt-0.5" />
        <div>
          <p className="text-[11px] font-black uppercase tracking-wide leading-none mb-1.5">
            {config.titulo}
          </p>
          {caso.status === 'resolvida' && caso.resolucao_descricao && (
            <p className="text-[11px] font-medium leading-snug">{caso.resolucao_descricao}</p>
          )}
          {caso.status === 'sem_resposta' && (
            <p className="text-[11px] font-medium leading-snug">
              O prazo para resposta expirou. Isso afeta sua reputação no perfil público.
            </p>
          )}
        </div>
      </div>

      {!state.loading && state.fotos.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {state.fotos.map((foto) => (
            <div key={foto.id} className="aspect-square rounded-xl overflow-hidden bg-slate-100">
              <img src={foto.url_foto} className="w-full h-full object-cover" alt="" />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
