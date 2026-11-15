// components/dashboard/wizard/garantia/GarantiaOferecerReparo.tsx
//
// O PRESTADOR oferece reparo a uma avaliação negativa. A decisão é do cliente: ele aceita ou recusa
// (o prestador não pressiona). Só aparece quando o banco aceitaria a oferta (useOfertaDeReparo).
// Quem valida de verdade é garantia_oferecer_reparo; a mensagem de erro vem de lá, em português.

'use client'

import { useState } from 'react'
import { AlertCircle, Loader2, Wrench } from 'lucide-react'
import { oferecerReparoPrestador } from '@/lib/services/garantia.service'
import { useOfertaDeReparo } from '@/hooks/useOfertaDeReparo'

const MINIMO = 20

interface Props {
  projetoId: string
  prestadorId: number
  onEnviado: () => void
}

export function GarantiaOferecerReparo({ projetoId, prestadorId, onEnviado }: Props) {
  const { avaliacaoId, carregando } = useOfertaDeReparo(projetoId, prestadorId)
  const [aberto, setAberto] = useState(false)
  const [texto, setTexto] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  if (carregando || !avaliacaoId) return null

  const valido = texto.trim().length >= MINIMO

  const enviar = async () => {
    if (!valido || enviando) return
    setEnviando(true)
    setErro(null)
    try {
      await oferecerReparoPrestador({ avaliacaoId, descricaoProblema: texto.trim() })
      onEnviado()
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Não foi possível enviar agora. Tente novamente.')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-5">
      <div className="flex items-start gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
          <Wrench size={20} aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <h3 className="text-base font-bold text-slate-900">Esta avaliação foi negativa. Quer oferecer um reparo?</h3>
          <p className="mt-1 text-sm leading-relaxed text-slate-600">
            O cliente decide se aceita. Se ele aceitar e depois confirmar que ficou resolvido, a avaliação passa a contar
            como 3 estrelas no seu ranking.
          </p>
        </div>
      </div>

      {!aberto ? (
        <button
          type="button"
          onClick={() => setAberto(true)}
          className="mt-4 inline-flex min-h-11 items-center justify-center rounded-xl border-2 border-blue-600 px-5 text-sm font-bold text-blue-700 transition-colors hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
        >
          Oferecer reparo
        </button>
      ) : (
        <div className="mt-4 space-y-3">
          <label htmlFor="oferta-reparo" className="block text-sm font-semibold text-slate-700">
            O que você propõe fazer?
          </label>
          <textarea
            id="oferta-reparo"
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            rows={4}
            maxLength={2000}
            placeholder="Ex.: Volto na quarta-feira para refazer o rejunte da parede, sem custo."
            className="w-full resize-none rounded-xl border border-slate-300 p-3 text-base text-slate-800 outline-none placeholder:text-slate-500 focus:border-blue-600"
          />
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className={`text-sm font-medium ${valido ? 'text-green-700' : 'text-slate-600'}`}>
              {texto.trim().length}/{MINIMO} caracteres no mínimo
            </span>
            <button
              type="button"
              onClick={enviar}
              disabled={!valido || enviando}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-bold text-white transition-colors hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
            >
              {enviando && <Loader2 size={16} className="animate-spin" aria-hidden="true" />}
              Enviar oferta ao cliente
            </button>
          </div>
          {erro && (
            <p role="alert" className="flex items-start gap-2 text-sm font-semibold text-red-700">
              <AlertCircle size={16} className="mt-0.5 shrink-0" aria-hidden="true" /> {erro}
            </p>
          )}
        </div>
      )}
    </div>
  )
}
