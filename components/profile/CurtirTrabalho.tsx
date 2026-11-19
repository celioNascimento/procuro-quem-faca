// components/profile/CurtirTrabalho.tsx — coração + total no modal do trabalho (perfil público).
import { Heart } from 'lucide-react'
import { textoCurtidas } from '@/lib/feed/feed'

interface Props {
  total: number
  curtido: boolean
  onCurtir: () => void
}

export function CurtirTrabalho({ total, curtido, onCurtir }: Props) {
  return (
    <button
      type="button" onClick={onCurtir} aria-pressed={curtido} data-testid="modal-curtir"
      aria-label={curtido ? 'Descurtir este trabalho' : 'Curtir este trabalho'}
      className={`flex min-h-12 shrink-0 items-center gap-2 rounded-2xl border px-4 text-sm font-black transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 ${curtido ? 'border-red-200 bg-red-50 text-red-600' : 'border-slate-200 bg-white text-slate-700 hover:border-red-200 hover:text-red-600'}`}
    >
      <Heart size={18} aria-hidden="true" fill={curtido ? 'currentColor' : 'none'} />
      <span data-testid="modal-curtidas-texto">{total > 0 ? total : 'Curtir'}</span>
      <span className="sr-only">{textoCurtidas(total)}</span>
    </button>
  )
}
