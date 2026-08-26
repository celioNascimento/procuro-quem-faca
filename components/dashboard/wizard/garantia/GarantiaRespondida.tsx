// components/dashboard/wizard/garantia/GarantiaRespondida.tsx
//
// Estado: prestador já registrou a proposta de solução formal.
// Agora o caso aguarda o CLIENTE confirmar a resolução (dando nota nova,
// via confirmarResolucaoGarantia). O prestador só acompanha aqui — pode
// continuar a conversa e anexar mais fotos de resolução, mas não há ação
// de "fechar" o caso do lado dele.

'use client'

import { useState, useEffect } from 'react'
import { Clock, CheckCircle2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { CasoGarantia } from '@/hooks/useCasoGarantiaDoProjeto'
import { useGarantiaWizard } from '@/hooks/useGarantiaWizard'
import { GarantiaCarrossel } from './GarantiaCarrossel'
import { GarantiaComentarios } from './GarantiaComentarios'

interface Props {
  caso: CasoGarantia
  prestadorId: number
}

export function GarantiaRespondida({ caso, prestadorId }: Props) {
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null))
  }, [])

  const wizard = useGarantiaWizard({
    casoId: caso.id,
    autorTipo: 'prestador',
    autorUserId: userId,
  })

  return (
    <div className="space-y-4">
      <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5 flex items-start gap-3">
        <Clock size={18} className="text-blue-500 shrink-0 mt-0.5" />
        <div>
          <p className="text-[11px] font-black uppercase tracking-wide text-blue-700 leading-none mb-1.5">
            Aguardando confirmação do cliente
          </p>
          <p className="text-[11px] font-medium text-blue-700/80 leading-snug">
            Sua proposta foi registrada. O caso fecha quando o cliente confirmar que
            o problema foi resolvido.
          </p>
        </div>
      </div>

      {caso.resposta_prestador_garantia && (
        <div className="bg-white border border-slate-100 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 size={12} className="text-green-500" />
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">
              Sua proposta registrada
            </p>
          </div>
          <p className="text-[12px] font-medium text-slate-700 leading-snug">
            {caso.resposta_prestador_garantia}
          </p>
        </div>
      )}

      <GarantiaCarrossel wizard={wizard} podeEnviar autorTipo="prestador" />
      <GarantiaComentarios wizard={wizard} casoId={caso.id} />
    </div>
  )
}
