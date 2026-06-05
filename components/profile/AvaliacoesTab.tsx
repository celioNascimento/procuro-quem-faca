'use client'
import { useAvaliacoes } from '@/hooks/useAvaliacoes'
import AvaliacaoCard from './AvaliacaoCard'
import AvaliacoesResumo from './AvaliacoesResumo'

interface AvaliacoesTabProps {
  prestadorId: number
}

function AvaliacoesTabSkeleton() {
  return (
    <div className="space-y-4">
      <div className="animate-pulse h-28 bg-slate-50 rounded-[2.5rem]" />
      {[1, 2, 3].map((i) => (
        <div key={i} className="animate-pulse h-40 bg-slate-50 rounded-[2.5rem]" />
      ))}
    </div>
  )
}

function AvaliacoesVazias() {
  return (
    <div className="text-center py-16 text-slate-400">
      <p className="text-4xl mb-3">⭐</p>
      <p className="text-sm font-semibold">Nenhuma avaliação ainda</p>
      <p className="text-xs mt-1">As avaliações aparecerão aqui após os serviços concluídos.</p>
    </div>
  )
}

export default function AvaliacoesTab({ prestadorId }: AvaliacoesTabProps) {
  const { avaliacoes, stats, loading, error } = useAvaliacoes(prestadorId)

  if (loading) return <AvaliacoesTabSkeleton />

  if (error) {
    return (
      <div className="text-center py-12 text-red-400">
        <p className="text-sm font-semibold">{error}</p>
      </div>
    )
  }

  if (avaliacoes.length === 0) return <AvaliacoesVazias />

  return (
    <div className="space-y-8">
      <AvaliacoesResumo stats={stats} />

      <div className="grid gap-4">
        {avaliacoes.map((av) => (
          <AvaliacaoCard key={av.id} avaliacao={av} />
        ))}
      </div>
    </div>
  )
}