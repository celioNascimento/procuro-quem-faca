import type { ReactNode } from 'react'

interface PageHeaderProps {
  titulo: string
  descricao?: string
  acoes?: ReactNode
}

// Cabeçalho único de todas as telas do admin: título, descrição curta e ações à direita.
export function PageHeader({ titulo, descricao, acoes }: PageHeaderProps) {
  return (
    <header className="flex flex-col gap-4 border-b border-slate-200 pb-6 pt-6 md:flex-row md:items-start md:justify-between md:pt-10">
      <div className="min-w-0">
        <h1 className="text-2xl font-bold tracking-tight text-pqf-ink md:text-3xl">{titulo}</h1>
        {descricao && <p className="mt-1 text-sm text-pqf-muted">{descricao}</p>}
      </div>
      {acoes && <div className="flex shrink-0 flex-wrap items-center gap-2">{acoes}</div>}
    </header>
  )
}
