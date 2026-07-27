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
    <div
      onClick={() => onClick(projeto)}
      className="group bg-white rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-lg hover:border-blue-100 transition-all duration-300 cursor-pointer overflow-hidden flex"
    >
      {/* Thumbnail */}
      <div className="w-24 h-24 md:w-28 md:h-28 shrink-0 bg-slate-50 relative self-stretch">
        {capa ? (
          <img
            src={capa}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            alt={projeto.titulo}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ImageOff size={20} className="text-slate-200" />
          </div>
        )}

        {/* Contador de fotos */}
        {fotos.length > 0 && (
          <div className="absolute bottom-1.5 right-1.5 bg-black/50 text-white text-[8px] font-black px-1.5 py-0.5 rounded-full backdrop-blur-sm">
            {fotos.length}
          </div>
        )}
      </div>

      {/* Conteúdo */}
      <div className="flex-1 min-w-0 p-4 flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className={`inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${cls}`}>
              {icon}{label}
            </span>
          </div>
          <h4 className="font-black text-slate-800 text-[14px] leading-tight truncate group-hover:text-blue-600 transition-colors">
            {projeto.titulo}
          </h4>
        </div>

        <div className="flex items-center justify-between mt-2">
          <span className="text-[10px] text-slate-300 font-medium">
            {fotos.length} {fotos.length === 1 ? 'foto' : 'fotos'}
          </span>
          <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0 duration-200">
            Editar →
          </span>
        </div>
      </div>
    </div>
  )
}