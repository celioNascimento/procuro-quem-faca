// components/dashboard/wizard/garantia/GarantiaComentarios.tsx
//
// Conversa livre do caso de garantia — separada da "resposta formal"
// (que fica em GarantiaAberta, via responderCasoGarantia). Comentar aqui
// NUNCA muda o status do caso nem conta como resposta dentro do prazo.
// Reaproveitado tanto pelo prestador (dashboard) quanto pelo cliente
// (dentro de /acompanhamento com ?garantia=1).

'use client'

import { Send, MessageSquare } from 'lucide-react'
import type { useGarantiaWizard } from '@/hooks/useGarantiaWizard'

interface Props {
  wizard: ReturnType<typeof useGarantiaWizard>
  casoId: string
}

export function GarantiaComentarios({ wizard }: Props) {
  const { state, derived, actions } = wizard

  return (
    <div className="bg-slate-50 rounded-2xl p-4 space-y-3">
      <div className="flex items-center gap-2 px-1">
        <MessageSquare size={12} className="text-slate-400" />
        <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">
          Conversa
        </p>
      </div>

      {derived.comentariosGerais.length > 0 && (
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {derived.comentariosGerais.map((c) => (
            <div
              key={c.id}
              className={`text-[11px] rounded-xl px-3 py-2 max-w-[85%] ${
                c.autor_tipo === 'prestador'
                  ? 'bg-blue-600 text-white ml-auto'
                  : 'bg-white text-slate-700 border border-slate-100'
              }`}
            >
              {c.texto}
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center gap-2">
        <input
          type="text"
          value={state.novoComentario}
          onChange={(e) => actions.setNovoComentario(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && state.novoComentario.trim()) {
              actions.handleEnviarComentario(null)
            }
          }}
          placeholder="Escrever mensagem..."
          className="flex-1 text-[11px] bg-white border border-slate-200 rounded-full px-4 py-2.5 outline-none focus:border-blue-300"
        />
        <button
          onClick={() => actions.handleEnviarComentario(null)}
          disabled={!state.novoComentario.trim() || state.enviandoComentario}
          className="w-9 h-9 rounded-full bg-blue-600 disabled:bg-slate-200 flex items-center justify-center text-white shrink-0 transition-all active:scale-95"
        >
          <Send size={14} />
        </button>
      </div>
    </div>
  )
}
