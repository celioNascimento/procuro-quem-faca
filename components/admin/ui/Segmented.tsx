'use client'

import { cn } from './cn'

interface Opcao<T extends string> {
  valor: T
  rotulo: string
  contagem?: number
}

interface SegmentedProps<T extends string> {
  label: string
  opcoes: Opcao<T>[]
  valor: T
  onChange: (valor: T) => void
}

// Filtro de visão (Todos, Pendentes, Concluídos...). Usa aria-pressed para leitores de tela.
export function Segmented<T extends string>({ label, opcoes, valor, onChange }: SegmentedProps<T>) {
  return (
    <div role="group" aria-label={label} className="flex flex-wrap gap-2">
      {opcoes.map((o) => {
        const ativo = o.valor === valor
        return (
          <button
            key={o.valor}
            type="button"
            aria-pressed={ativo}
            onClick={() => onChange(o.valor)}
            className={cn(
              'inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pqf-blue',
              ativo ? 'bg-pqf-blue text-white' : 'bg-white text-slate-600 border border-slate-200 hover:border-pqf-blue hover:text-pqf-blue',
            )}
          >
            {o.rotulo}
            {o.contagem !== undefined && (
              <span className={cn('text-xs tabular-nums', ativo ? 'text-blue-100' : 'text-pqf-muted')}>{o.contagem}</span>
            )}
          </button>
        )
      })}
    </div>
  )
}
