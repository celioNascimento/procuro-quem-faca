import type { ReactNode } from 'react'
import { cn } from './cn'

type Tom = 'neutro' | 'marca' | 'sucesso' | 'alerta' | 'perigo'

const TONS: Record<Tom, string> = {
  neutro: 'bg-slate-100 text-slate-700',
  marca: 'bg-pqf-blue-soft text-pqf-blue',
  sucesso: 'bg-emerald-50 text-emerald-700',
  alerta: 'bg-pqf-yellow/20 text-amber-800',
  perigo: 'bg-red-50 text-red-700',
}

export function Badge({ tom = 'neutro', children }: { tom?: Tom; children: ReactNode }) {
  return (
    <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold', TONS[tom])}>
      {children}
    </span>
  )
}
