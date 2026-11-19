// components/dashboard/FeedSwitch.tsx — interruptor "Mostrar no feed" de um trabalho concluído (prestador).
import type { EstadoNoFeed } from '@/lib/feed/feed'

interface Props {
  projetoId: string
  estado: Exclude<EstadoNoFeed, null>
  onAlternar: (projetoId: string) => void
}

export function FeedSwitch({ projetoId, estado, onAlternar }: Props) {
  const ligado = estado === 'visivel'
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3">
      <span className="min-w-0">
        <span id={`feed-rotulo-${projetoId}`} className="block text-sm font-black text-slate-800">Mostrar no feed</span>
        <span className="block text-xs font-medium text-slate-500">
          {ligado ? 'Aparece em Trabalhos concluídos.' : 'Fora do feed. Continua no seu perfil.'}
        </span>
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={ligado}
        aria-labelledby={`feed-rotulo-${projetoId}`}
        data-testid={`feed-switch-${projetoId}`}
        onClick={() => onAlternar(projetoId)}
        className={`relative inline-flex h-11 w-16 shrink-0 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-100 ${ligado ? 'bg-blue-600' : 'bg-slate-300'}`}
      >
        <span aria-hidden="true" className={`inline-block size-8 rounded-full bg-white shadow transition-transform ${ligado ? 'translate-x-7' : 'translate-x-1'}`} />
        <span className="sr-only">{ligado ? 'Ligado' : 'Desligado'}</span>
      </button>
    </div>
  )
}
