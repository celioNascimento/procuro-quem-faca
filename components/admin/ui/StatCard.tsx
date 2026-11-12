import Link from 'next/link'
import { cn } from './cn'

type Tom = 'neutro' | 'marca' | 'alerta'

const TONS: Record<Tom, { caixa: string; rotulo: string; valor: string }> = {
  neutro: { caixa: 'border-slate-200 bg-white', rotulo: 'text-pqf-muted', valor: 'text-pqf-ink' },
  marca: { caixa: 'border-pqf-blue bg-pqf-blue', rotulo: 'text-blue-100', valor: 'text-white' },
  alerta: { caixa: 'border-red-200 bg-red-50', rotulo: 'text-red-700', valor: 'text-red-700' },
}

interface StatCardProps {
  label: string
  valor: number | string
  hint?: string
  tom?: Tom
  href?: string
}

export function StatCard({ label, valor, hint, tom = 'neutro', href }: StatCardProps) {
  const t = TONS[tom]
  const conteudo = (
    <>
      <p className={cn('text-xs font-medium', t.rotulo)}>{label}</p>
      <p className={cn('mt-2 text-2xl font-bold leading-none md:text-3xl', t.valor)}>{valor}</p>
      {hint && <p className={cn('mt-2 text-xs', t.rotulo)}>{hint}</p>}
    </>
  )
  const classes = cn(
    'block rounded-xl border p-4 md:p-5',
    t.caixa,
    href && 'transition-colors hover:border-pqf-blue focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pqf-blue',
  )
  return href ? <Link href={href} className={classes}>{conteudo}</Link> : <div className={classes}>{conteudo}</div>
}
