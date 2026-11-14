'use client'
// components/busca/DicaDaLista.tsx
//
// Orientação curta na primeira visita à lista; depois de "Entendi" não aparece mais neste aparelho.
// Também explica o "Este perfil é seu?" dos cards, para a pessoa saber que os perfis vêm de dados públicos.
// O estado fica no localStorage lido com useSyncExternalStore: no servidor a dica nunca aparece,
// então não há diferença de HTML entre servidor e navegador.

import { useSyncExternalStore } from 'react'
import { Info } from 'lucide-react'

export const CHAVE_DICA_LISTA = 'pqf:dica-lista'

const ouvintes = new Set<() => void>()

function assinar(aviso: () => void) {
  ouvintes.add(aviso)
  window.addEventListener('storage', aviso)
  return () => {
    ouvintes.delete(aviso)
    window.removeEventListener('storage', aviso)
  }
}

function jaFoiDispensada(): boolean {
  try {
    return window.localStorage.getItem(CHAVE_DICA_LISTA) === '1'
  } catch {
    return false
  }
}

export function DicaDaLista() {
  // No servidor, tratamos como "já dispensada" (não renderiza). No navegador, lê o valor real.
  const dispensada = useSyncExternalStore(assinar, jaFoiDispensada, () => true)

  if (dispensada) return null

  function entendi() {
    try {
      window.localStorage.setItem(CHAVE_DICA_LISTA, '1')
    } catch {
      // Sem armazenamento (aba privada): fecha só nesta visita.
    }
    ouvintes.forEach(aviso => aviso())
  }

  return (
    <aside
      aria-label="Como usar esta lista"
      className="flex items-start gap-3 rounded-2xl border border-blue-100 bg-blue-50/60 px-4 py-3"
    >
      <Info size={18} className="mt-0.5 shrink-0 text-blue-600" aria-hidden="true" />
      <div className="flex min-w-0 flex-1 flex-col items-start gap-1">
        <p className="text-sm leading-snug text-slate-700">
          Toque num profissional para ver o perfil e chamar pelo WhatsApp. Pedir orçamento não custa nada.
          Perfis com <span className="font-semibold">“Este perfil é seu?”</span> foram montados com dados públicos de contato.
        </p>
        <button
          type="button"
          onClick={entendi}
          className="-mb-2 inline-flex min-h-11 items-center rounded-lg text-sm font-bold text-blue-600 hover:text-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
        >
          Entendi
        </button>
      </div>
    </aside>
  )
}
