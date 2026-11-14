// components/dashboard/wizard/EnvioAoCliente.tsx
//
// Bloco de envio ao cliente (aceite no começo, pedido de avaliação no fim): botão do WhatsApp, cópia
// da mensagem para mandar por outro aplicativo e a prévia do que o cliente recebe.
'use client'

import { useState } from 'react'
import { Check, Copy, MessageCircle } from 'lucide-react'

interface Props {
  titulo: string
  explicacao: string
  rotuloEnviar: string
  previa: string
  onEnviar: () => Promise<boolean>
  onCopiar: () => Promise<boolean>
  desabilitado?: boolean
  motivoDesabilitado?: string
  /** Já foi enviado antes: mostra a confirmação e o botão passa a "reenviar". */
  jaEnviado?: boolean
}

export function EnvioAoCliente({
  titulo, explicacao, rotuloEnviar, previa, onEnviar, onCopiar, desabilitado = false, motivoDesabilitado, jaEnviado = false,
}: Props) {
  const [ocupado, setOcupado] = useState(false)
  const [copiado, setCopiado] = useState(false)

  const enviar = async () => {
    setOcupado(true)
    try { await onEnviar() } finally { setOcupado(false) }
  }

  const copiar = async () => {
    setOcupado(true)
    try {
      const ok = await onCopiar()
      if (ok) {
        setCopiado(true)
        setTimeout(() => setCopiado(false), 2500)
      }
    } finally { setOcupado(false) }
  }

  return (
    <section className="flex flex-col gap-4 rounded-[1.75rem] border border-emerald-200 bg-emerald-50/60 p-4 sm:p-5" aria-label={titulo}>
      <div>
        <h3 className="text-base font-black text-slate-900">{titulo}</h3>
        <p className="mt-0.5 text-sm text-slate-700">{explicacao}</p>
        {jaEnviado && <p className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-xs font-bold text-emerald-700"><Check size={14} aria-hidden="true" /> Já enviado. Você pode enviar de novo se precisar.</p>}
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <button
          type="button"
          onClick={enviar}
          disabled={desabilitado || ocupado}
          className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-base font-bold text-white transition-colors hover:bg-emerald-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-200 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500"
        >
          <MessageCircle size={18} aria-hidden="true" />
          {ocupado ? 'Preparando…' : jaEnviado ? 'Enviar de novo pelo WhatsApp' : rotuloEnviar}
        </button>
        <button
          type="button"
          onClick={copiar}
          disabled={desabilitado || ocupado}
          className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-3 text-base font-bold text-slate-700 transition-colors hover:border-emerald-400 hover:text-emerald-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-200 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {copiado ? <Check size={18} aria-hidden="true" /> : <Copy size={18} aria-hidden="true" />}
          {copiado ? 'Mensagem copiada' : 'Copiar mensagem'}
        </button>
      </div>

      {desabilitado && motivoDesabilitado && <p role="alert" className="text-sm font-semibold text-amber-800">{motivoDesabilitado}</p>}

      <details className="rounded-2xl bg-white p-3 text-sm text-slate-700">
        <summary className="cursor-pointer font-bold text-slate-800">Ver a mensagem que o cliente recebe</summary>
        <p className="mt-2 whitespace-pre-line leading-relaxed">{previa}</p>
      </details>
    </section>
  )
}
