import type { ReactNode } from 'react'

interface PageHeaderProps {
  titulo: string
  descricao?: string
  acoes?: ReactNode
}

// Cabeçalho único de todas as telas do admin: título e ações na mesma linha (no celular também),
// descrição curta embaixo. Se as ações forem largas demais para caber ao lado, descem para a linha de baixo.
export function PageHeader({ titulo, descricao, acoes }: PageHeaderProps) {
  return (
    <header className="border-b border-slate-200 pb-6 pt-6 md:pt-10">
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
        <h1 className="min-w-0 flex-1 basis-40 text-2xl font-bold tracking-tight text-pqf-ink md:text-3xl">{titulo}</h1>
        {acoes && <div className="flex shrink-0 flex-wrap items-center gap-2">{acoes}</div>}
      </div>
      {descricao && <p className="mt-1 text-sm text-pqf-muted">{descricao}</p>}
    </header>
  )
}
