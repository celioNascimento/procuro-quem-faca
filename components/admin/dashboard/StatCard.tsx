// components/admin/dashboard/StatCard.tsx
interface StatCardProps {
  label: string
  valor: number
  sub: string
  highlight?: boolean
}

export function StatCard({ label, valor, sub, highlight = false }: StatCardProps) {
  return (
    <div className={`p-4 md:p-5 rounded-2xl border transition-all ${
      highlight ? 'bg-blue-600 border-blue-500 shadow-sm shadow-blue-100' : 'bg-white border-zinc-100'
    }`}>
      <p className={`text-[9px] font-medium uppercase tracking-widest mb-2 ${highlight ? 'text-blue-200' : 'text-zinc-400'}`}>
        {label}
      </p>
      <div className="flex items-baseline gap-1.5">
        <span className={`text-2xl md:text-3xl font-bold leading-none ${highlight ? 'text-white' : 'text-zinc-900'}`}>
          {valor}
        </span>
        <span className={`text-[9px] font-medium ${highlight ? 'text-blue-200' : 'text-zinc-400'}`}>
          {sub}
        </span>
      </div>
    </div>
  )
}
