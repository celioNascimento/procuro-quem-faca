interface EmptyStateProps {
  titulo: string
  descricao?: string
}

export function EmptyState({ titulo, descricao }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center gap-1 rounded-xl border border-dashed border-slate-300 bg-white px-6 py-10 text-center">
      <p className="text-sm font-semibold text-pqf-ink">{titulo}</p>
      {descricao && <p className="text-sm text-pqf-muted">{descricao}</p>}
    </div>
  )
}
