//components/dashboard/ProjetoCard.tsx 

import { ImageOff, CheckCircle2, Clock, AlertCircle, Pencil } from 'lucide-react'
import { Projeto } from '@/hooks/usePortfolioDashboard'

interface Props {
  projeto: Projeto
  onClick: (projeto: Projeto) => void
}

// ── Config visual por status ───────────────────────────────────────────────────
function getStatusConfig(proj: Projeto) {
  const jaAvaliado = proj.avaliacoes?.length > 0
  const s = proj.status

  if (s === 'em_registro') return {
    label: 'Rascunho',
    icon: <Pencil size={9} />,
    cls: 'bg-slate-100 text-slate-500 border-slate-200',
  }
  if (s === 'pendente') return {
    label: 'Aguard. cliente',
    icon: <Clock size={9} />,
    cls: 'bg-amber-50 text-amber-600 border-amber-200',
  }
  if (s === 'em_execucao') return {
    label: 'Em progresso',
    icon: <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />,
    cls: 'bg-blue-50 text-blue-600 border-blue-200',
  }
  if (s === 'finalizado' && jaAvaliado) return {
    label: 'Concluído',
    icon: <CheckCircle2 size={9} />,
    cls: 'bg-green-50 text-green-600 border-green-200',
  }
  if (s === 'finalizado' && !jaAvaliado) return {
    label: 'Aguard. avaliação',
    icon: <AlertCircle size={9} />,
    cls: 'bg-amber-50 text-amber-600 border-amber-200',
  }
  return {
    label: s,
    icon: null,
    cls: 'bg-slate-100 text-slate-500 border-slate-200',
  }
}

export function ProjetoCard({ projeto, onClick }: Props) {
  const fotos = projeto.portfolio_fotos ?? []
  // Usa a foto de maior ordem como capa (foto "depois" quando existir)
  const capa  = [...fotos].sort((a, b) => b.ordem - a.ordem)[0]?.url_foto
  const { label, icon, cls } = getStatusConfig(projeto)

  return (
    <button
      type="button"
      onClick={() => onClick(projeto)}
      className="group flex w-full overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white text-left shadow-sm transition-all hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-100 active:translate-y-0"
      aria-label={`Editar projeto ${projeto.titulo}`}
    >
      <span className="relative w-24 shrink-0 self-stretch bg-slate-100 sm:w-32">
        {capa ? (
          <img
            src={capa}
            className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
            alt=""
          />
        ) : (
          <span className="flex size-full min-h-32 items-center justify-center text-slate-300">
            <ImageOff size={22} aria-hidden="true" />
          </span>
        )}

        {fotos.length > 0 && (
          <span className="absolute bottom-2 right-2 rounded-full bg-slate-900/70 px-2 py-0.5 text-[9px] font-black text-white backdrop-blur-sm">
            {fotos.length}
          </span>
        )}
      </span>

      <span className="flex min-w-0 flex-1 flex-col justify-between gap-4 p-4 sm:p-5">
        <span className="flex flex-col gap-2">
          <span className={`inline-flex w-fit items-center gap-1 rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${cls}`}>
            {icon}{label}
          </span>
          <span className="truncate text-sm font-black leading-tight text-slate-800 transition-colors group-hover:text-blue-600 sm:text-base">
            {projeto.titulo}
          </span>
        </span>

        <span className="flex items-center justify-between gap-3">
          <span className="text-[10px] font-medium text-slate-400">
            {fotos.length} {fotos.length === 1 ? 'foto' : 'fotos'}
          </span>
          <span className="text-[10px] font-black uppercase tracking-widest text-blue-600">
            Editar
          </span>
        </span>
      </span>
    </button>
  )
}
