'use client'
import RatingStars from '@/components/ui/RatingStars'
import type { Avaliacao } from '@/types/avaliacao'

interface AvaliacaoCardProps {
  avaliacao: Avaliacao
}

function formatarData(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

export default function AvaliacaoCard({ avaliacao: av }: AvaliacaoCardProps) {
  return (
    <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm transition-all hover:shadow-md">
      {/* Cabeçalho: nota + data */}
      <div className="flex justify-between items-start mb-4">
        <div>
          <RatingStars nota={av.nota} />
          {av.portfolio_projetos && (
            <span className="text-[8px] font-black text-blue-500 uppercase tracking-tighter mt-1 block italic">
              Referente ao serviço: {av.portfolio_projetos.titulo}
            </span>
          )}
        </div>
        <div className="flex flex-col items-end gap-1">
          <span className="text-[9px] font-bold text-slate-300 uppercase italic">
            {formatarData(av.created_at)}
          </span>
          {av.indica && (
            <span className="text-[8px] font-black text-emerald-500 uppercase tracking-tighter italic">
              ✓ Indica
            </span>
          )}
        </div>
      </div>

      {/* Comentário */}
      {av.comentario && (
        <p className="text-slate-600 text-sm italic font-medium">
          &quot;{av.comentario}&quot;
        </p>
      )}

      {/* Resposta do prestador */}
      {av.resposta_prestador && (
        <div className="mt-4 pl-4 border-l-2 border-blue-100">
          <p className="text-[9px] font-black text-blue-400 uppercase tracking-tighter mb-1">
            Resposta do prestador
          </p>
          <p className="text-slate-500 text-sm">{av.resposta_prestador}</p>
        </div>
      )}
    </div>
  )
}