// components/acompanhamento/garantia/GarantiaAguardandoAceiteCliente.tsx
//
// Estado: origem='prestador' — o prestador ofereceu reparo em reação a uma
// avaliação negativa que o cliente deu. Aqui é a ÚNICA tela onde o cliente
// decide: aceitar (abre o caso de verdade) ou recusar (tira o peso do
// prestador, conforme definido no desenho do produto).

'use client'

import { useState } from 'react'
import { Check, X, Loader2, HandHeart } from 'lucide-react'
import type { CasoGarantia } from '@/hooks/useCasoGarantiaDoProjeto'
import { aceitarOfertaReparo, recusarOfertaReparo } from '@/lib/services/garantia.service'

interface Props {
  caso: CasoGarantia
  onAtualizado: () => void
}

export function GarantiaAguardandoAceiteCliente({ caso, onAtualizado }: Props) {
  const [processando, setProcessando] = useState<'aceitar' | 'recusar' | null>(null)

  const handleAceitar = async () => {
    setProcessando('aceitar')
    try {
      await aceitarOfertaReparo(caso.id, caso.cliente_user_id)
      onAtualizado()
    } catch (err) {
      console.error('Erro ao aceitar oferta de reparo:', err)
    } finally {
      setProcessando(null)
    }
  }

  const handleRecusar = async () => {
    setProcessando('recusar')
    try {
      await recusarOfertaReparo(caso.id, caso.cliente_user_id)
      onAtualizado()
    } catch (err) {
      console.error('Erro ao recusar oferta de reparo:', err)
    } finally {
      setProcessando(null)
    }
  }

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5 space-y-4">
      <div className="flex items-start gap-3">
        <HandHeart size={18} className="text-blue-500 shrink-0 mt-0.5" />
        <div>
          <p className="text-[11px] font-black uppercase tracking-wide text-blue-700 leading-none mb-1.5">
            O prestador quer resolver
          </p>
          <p className="text-[11px] font-medium text-blue-700/90 leading-snug">
            {caso.descricao_problema}
          </p>
        </div>
      </div>

      <div className="flex gap-2">
        <button
          onClick={handleAceitar}
          disabled={processando !== null}
          className="flex-1 flex items-center justify-center gap-2 bg-blue-600 disabled:bg-slate-200 text-white text-[10px] font-black uppercase tracking-widest py-3 rounded-xl transition-all active:scale-95"
        >
          {processando === 'aceitar' ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
          Aceitar
        </button>
        <button
          onClick={handleRecusar}
          disabled={processando !== null}
          className="flex-1 flex items-center justify-center gap-2 bg-white border border-slate-200 disabled:bg-slate-100 text-slate-500 text-[10px] font-black uppercase tracking-widest py-3 rounded-xl transition-all active:scale-95"
        >
          {processando === 'recusar' ? <Loader2 size={14} className="animate-spin" /> : <X size={14} />}
          Recusar
        </button>
      </div>
    </div>
  )
}
