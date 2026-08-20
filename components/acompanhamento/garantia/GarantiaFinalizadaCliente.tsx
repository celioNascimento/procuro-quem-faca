// components/acompanhamento/garantia/GarantiaFinalizadaCliente.tsx
//
// Estados terminais do lado do cliente. Só exibição — sem ações.
// Mesma lógica visual do GarantiaFinalizada do prestador, adaptada às
// mensagens que fazem sentido para quem abriu/recebeu o caso.

import { CheckCircle2, XCircle, ShieldOff } from 'lucide-react'
import type { CasoGarantia } from '@/hooks/useCasoGarantiaDoProjeto'
import { useGarantiaWizard } from '@/hooks/useGarantiaWizard'
import { FotoGarantia } from '@/components/dashboard/wizard/garantia/FotoGarantia'

interface Props {
  caso: CasoGarantia
  clienteUserId: string
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
    titulo: 'O prestador não respondeu a tempo',
  },
  recusada: {
    icon: XCircle,
    cor: 'text-slate-500 bg-slate-50 border-slate-200',
    titulo: 'Você recusou a oferta de reparo',
  },
} as const

export function GarantiaFinalizadaCliente({ caso, clienteUserId }: Props) {
  const { state } = useGarantiaWizard({
    casoId: caso.id,
    autorTipo: 'cliente',
    autorUserId: clienteUserId,
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
              O caso foi encerrado automaticamente. Isso ficou registrado no perfil público
              do prestador.
            </p>
          )}
        </div>
      </div>

      {!state.loading && state.fotos.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {state.fotos.map((foto) => (
            <div key={foto.id} className="aspect-square rounded-xl overflow-hidden bg-slate-100">
              <FotoGarantia path={foto.url_foto} publica={foto.publica} className="w-full h-full object-cover" alt="" />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
