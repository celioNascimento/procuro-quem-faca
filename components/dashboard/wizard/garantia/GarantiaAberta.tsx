// components/dashboard/wizard/garantia/GarantiaAberta.tsx
//
// Estado: caso aberto (por cliente ou por aceite do cliente à oferta do
// prestador), aguardando resposta do prestador dentro do prazo.
//
// Duas camadas distintas de interação, propositalmente separadas:
//  1. Comentários (conversa livre, via useGarantiaWizard) — não muda status
//  2. "Registrar proposta de solução" (texto mínimo obrigatório + botão) —
//     é o que efetivamente chama responderCasoGarantia e move o caso para
//     'respondida'. Comentar não é o mesmo que se comprometer a resolver.

'use client'

import { useState, useEffect } from 'react'
import { AlertTriangle, Send, Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { CasoGarantia } from '@/hooks/useCasoGarantiaDoProjeto'
import { useGarantiaWizard } from '@/hooks/useGarantiaWizard'
import { responderCasoGarantia } from '@/lib/services/garantia.service'
import { GarantiaCarrossel } from './GarantiaCarrossel'
import { GarantiaComentarios } from './GarantiaComentarios'

interface Props {
  caso: CasoGarantia
  prestadorId: number
  onAtualizado: () => void
}

const MIN_CARACTERES_PROPOSTA = 20

export function GarantiaAberta({ caso, prestadorId, onAtualizado }: Props) {
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null))
  }, [])

  const { state, derived, actions } = useGarantiaWizard({
    casoId: caso.id,
    autorTipo: 'prestador',
    autorUserId: userId,
  })
  const wizard = { state, derived, actions }

  const [proposta, setProposta] = useState('')
  const [enviandoProposta, setEnviandoProposta] = useState(false)
  const [erroProposta, setErroProposta] = useState<string | null>(null)

  const propostaValida = proposta.trim().length >= MIN_CARACTERES_PROPOSTA

  const prazoFormatado = caso.prazo_resposta
    ? new Date(caso.prazo_resposta).toLocaleDateString('pt-BR')
    : null

  const handleRegistrarProposta = async () => {
    if (!propostaValida) return
    setEnviandoProposta(true)
    setErroProposta(null)
    try {
      await responderCasoGarantia(caso.id, prestadorId, proposta.trim())
      onAtualizado() // recarrega o caso no orquestrador, troca para GarantiaRespondida
    } catch (err) {
      console.error('Erro ao registrar proposta de solução:', err)
      setErroProposta('Não foi possível registrar sua proposta. Tente novamente.')
    } finally {
      setEnviandoProposta(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Prazo + descrição do problema */}
      <div className="bg-orange-50 border border-orange-200 rounded-2xl p-5">
        <div className="flex items-start gap-3">
          <AlertTriangle size={18} className="text-orange-500 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-[11px] font-black uppercase tracking-wide text-orange-700 leading-none mb-1.5">
              Cliente acionou a garantia
            </p>
            {prazoFormatado && (
              <p className="text-[10px] font-bold text-orange-600 mb-2">
                Responda até {prazoFormatado} — após esse prazo, o caso é marcado
                automaticamente como sem resposta.
              </p>
            )}
            <p className="text-[11px] font-medium text-orange-700/80 leading-snug">
              {caso.descricao_problema}
            </p>
          </div>
        </div>
      </div>

      {/* Fotos do caso (problema + resolução) e upload */}
      <GarantiaCarrossel wizard={wizard} podeEnviar autorTipo="prestador" />

      {/* Conversa livre — separada do compromisso formal abaixo */}
      <GarantiaComentarios wizard={wizard} casoId={caso.id} />

      {/* Proposta de solução — compromisso formal que muda o status */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5">
        <p className="text-[10px] font-black uppercase tracking-wide text-slate-600 mb-2">
          Registrar proposta de solução
        </p>
        <textarea
          value={proposta}
          onChange={(e) => setProposta(e.target.value)}
          placeholder="Descreva como você vai resolver o problema (ex: data para visita, o que será reparado)..."
          rows={3}
          className="w-full text-[12px] text-slate-700 placeholder:text-slate-300 outline-none border border-slate-100 rounded-xl p-3 resize-none focus:border-orange-300 transition-colors"
        />
        <div className="flex items-center justify-between mt-2">
          <span className={`text-[9px] font-bold ${propostaValida ? 'text-green-500' : 'text-slate-300'}`}>
            {proposta.trim().length}/{MIN_CARACTERES_PROPOSTA} caracteres mínimos
          </span>
        </div>
        {erroProposta && (
          <p className="text-[10px] text-red-500 font-medium mt-1">{erroProposta}</p>
        )}
        <button
          onClick={handleRegistrarProposta}
          disabled={!propostaValida || enviandoProposta}
          className="w-full mt-3 bg-orange-600 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-xl font-black uppercase text-[11px] tracking-[0.15em] italic flex items-center justify-center gap-2 py-3 hover:bg-orange-700 active:scale-[0.98] transition-all"
        >
          {enviandoProposta ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <>
              Registrar proposta <Send size={14} />
            </>
          )}
        </button>
      </div>
    </div>
  )
}
