//components/auth/ForcaSenhaBar.tsx

'use client'

interface ForcaSenhaBarProps {
  senha: string
}

export function ForcaSenhaBar({ senha }: ForcaSenhaBarProps) {
  if (!senha) return null

  const forca = senha.length < 6 ? 0 : senha.length < 10 ? 1 : /[A-Z]/.test(senha) && /[0-9]/.test(senha) ? 3 : 2
  const labels = ['', 'Fraca', 'Boa', 'Forte']
  const cores  = ['', 'bg-amber-400', 'bg-blue-400', 'bg-green-500']
  const textos = ['', 'text-amber-500', 'text-blue-500', 'text-green-600']

  return (
    <div className="flex items-center gap-2 px-1 mt-1">
      <div className="flex gap-1 flex-1">
        {[1, 2, 3].map(n => (
          <div
            key={n}
            className={`h-1 flex-1 rounded-full transition-all duration-300 ${forca >= n ? cores[forca] : 'bg-slate-100'}`}
          />
        ))}
      </div>
      {forca > 0 && (
        <span className={`text-[9px] font-black uppercase tracking-wide ${textos[forca]}`}>
          {labels[forca]}
        </span>
      )}
    </div>
  )
}