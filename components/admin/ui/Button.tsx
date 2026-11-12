import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { cn } from './cn'

type Variante = 'primario' | 'secundario' | 'fantasma'

const VARIANTES: Record<Variante, string> = {
  primario: 'bg-pqf-blue text-white hover:bg-pqf-blue-hover',
  secundario: 'border border-slate-200 bg-white text-pqf-ink hover:border-pqf-blue hover:text-pqf-blue',
  fantasma: 'text-pqf-blue hover:bg-pqf-blue-soft',
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variante?: Variante
  icone?: ReactNode
}

export function Button({ variante = 'secundario', icone, className, children, ...props }: ButtonProps) {
  return (
    <button
      type="button"
      {...props}
      className={cn(
        'inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pqf-blue focus-visible:ring-offset-2',
        'disabled:cursor-not-allowed disabled:opacity-50',
        VARIANTES[variante],
        className,
      )}
    >
      {icone}
      {children}
    </button>
  )
}
