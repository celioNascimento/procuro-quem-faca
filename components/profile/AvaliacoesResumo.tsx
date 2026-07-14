//components/profile/AvaliacoesResumo.tsx

'use client'
import RatingStars from '@/components/ui/RatingStars'
import type { AvaliacoesStats } from '@/types/avaliacao'

interface AvaliacoesResumoProps {
  stats: AvaliacoesStats
}

export default function AvaliacoesResumo({ stats }: AvaliacoesResumoProps) {
  if (stats.total === 0) return null

  return (
    <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm">
      <div className="flex items-center gap-6">
        {/* Média em destaque */}
        <div className="text-center">
          <p className="text-5xl font-black text-slate-800 leading-none">{stats.media}</p>
          <RatingStars nota={Math.round(stats.media)} />
          <p className="text-[9px] font-bold text-slate-400 uppercase mt-1">
            {stats.total} avaliação{stats.total !== 1 ? 'ões' : ''}
          </p>
        </div>

        {/* Distribuição por nota */}
        <div className="flex-1 space-y-1">
          {[5, 4, 3, 2, 1].map((nota) => {
            const qtd = stats.distribuicao[nota] ?? 0
            const pct = stats.total > 0 ? (qtd / stats.total) * 100 : 0
            return (
              <div key={nota} className="flex items-center gap-2">
                <span className="text-[9px] font-bold text-slate-400 w-2">{nota}</span>
                <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-yellow-400 rounded-full transition-all"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="text-[9px] text-slate-300 w-3">{qtd}</span>
              </div>
            )
          })}
        </div>

        {/* Indica */}
        {stats.totalIndica > 0 && (
          <div className="text-center">
            <p className="text-2xl font-black text-emerald-500">
              {Math.round((stats.totalIndica / stats.total) * 100)}%
            </p>
            <p className="text-[9px] font-bold text-slate-400 uppercase">indicam</p>
          </div>
        )}
      </div>
    </div>
  )
}