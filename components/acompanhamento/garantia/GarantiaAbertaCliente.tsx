// components/acompanhamento/garantia/GarantiaAbertaCliente.tsx
//
// Estado: caso aberto, aguardando o prestador responder dentro do prazo.
// Cliente só acompanha aqui — pode continuar a conversa e ver as fotos que
// já anexou (ou anexar mais, se lembrar de algo), mas não há ação de
// "fechar" o caso do lado dele nesta etapa.
//
// Sem texto condicional por tipo aqui — a mensagem já é genérica o
// suficiente ("aguardando resposta do prestador") para servir tanto
// garantia quanto reclamação sem soar deslocada.

'use client'

import { Clock } from 'lucide-react'
import type { CasoGarantia } from '@/hooks/useCasoGarantiaDoProjeto'
import { useGarantiaWizard } from '@/hooks/useGarantiaWizard'
import { GarantiaCarrossel } from '@/components/dashboard/wizard/garantia/GarantiaCarrossel'
import { GarantiaComentarios } from '@/components/dashboard/wizard/garantia/GarantiaComentarios'

interface Props {
  caso: CasoGarantia
  clienteUserId: string
}

export function GarantiaAbertaCliente({ caso, clienteUserId }: Props) {
  const wizard = useGarantiaWizard({
    casoId: caso.id,
    autorTipo: 'cliente',
    autorUserId: clienteUserId,
  })

  const diasRestantes = caso.prazo_resposta
    ? Math.ceil((new Date(caso.prazo_resposta).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null

  return (
    <div className="space-y-4">
      <div className="bg-orange-50 border border-orange-200 rounded-2xl p-5 flex items-start gap-3">
        <Clock size={18} className="text-orange-500 shrink-0 mt-0.5" />
        <div>
          <p className="text-[11px] font-black uppercase tracking-wide text-orange-700 leading-none mb-1.5">
            Aguardando resposta do prestador
          </p>
          {diasRestantes !== null && (
            <p className="text-[10px] font-medium text-orange-700/80">
              {diasRestantes > 0
                ? `O prestador tem ${diasRestantes} dia${diasRestantes > 1 ? 's' : ''} úteis para responder.`
                : 'Prazo de resposta vencendo hoje.'}
            </p>
          )}
        </div>
      </div>

      <GarantiaCarrossel wizard={wizard} podeEnviar autorTipo="cliente" />
      <GarantiaComentarios wizard={wizard} casoId={caso.id} />
    </div>
  )
}
