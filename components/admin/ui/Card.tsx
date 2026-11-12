import type { ReactNode } from 'react'
import { cn } from './cn'

interface CardProps {
  titulo?: string
  descricao?: string
  acoes?: ReactNode
  children: ReactNode
  className?: string
}

// Superfície padrão do admin: borda slate, cantos de 12px, sem sombra.
export function Card({ titulo, descricao, acoes, children, className }: CardProps) {
  return (
    <section className={cn('rounded-xl border border-slate-200 bg-white p-5 md:p-6', className)}>
      {(titulo || acoes) && (
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="min-w-0">
            {titulo && <h2 className="text-sm font-semibold text-pqf-ink">{titulo}</h2>}
            {descricao && <p className="mt-0.5 text-xs text-pqf-muted">{descricao}</p>}
          </div>
          {acoes}
        </div>
      )}
      {children}
    </section>
  )
}
