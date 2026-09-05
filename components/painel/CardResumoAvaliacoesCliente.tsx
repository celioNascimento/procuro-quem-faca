'use client'
import { useEffect, useState } from 'react'
import { Star } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAvaliacoesRecebidasCliente } from '@/hooks/useAvaliacoesRecebidasCliente'

function StarsMini({ value }: { value: number }) {
  return (
    <span className="inline-flex gap-0.5 text-white" aria-label={`${value.toFixed(1)} de 5 estrelas`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Star key={star} size={12} className={star <= Math.round(value) ? 'fill-current' : 'opacity-40'} aria-hidden="true" />
      ))}
    </span>
  )
}

export function CardResumoAvaliacoesCliente({
  onClick,
  onVisibilidadeChange,
}: {
  onClick?: () => void
  // Avisa o componente pai se este card tem ou não conteúdo para mostrar,
  // sem que o pai precise conhecer a regra interna (total > 0) ou refazer
  // a query de stats — mantém a condição do carrossel desacoplada.
  // ATENÇÃO: passe uma referência estável aqui (ex: o setter de um
  // useState, como setTemAvaliacoesRecebidas). Uma arrow function nova
  // a cada render ("() => ...") causaria loop infinito neste useEffect.
  onVisibilidadeChange?: (visivel: boolean) => void
}) {
  const [clienteUserId, setClienteUserId] = useState<string | null>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setClienteUserId(data.user?.id ?? null))
  }, [])

  const { stats, loading } = useAvaliacoesRecebidasCliente(clienteUserId)

  useEffect(() => {
    if (loading) return
    onVisibilidadeChange?.(stats.total > 0)
  }, [loading, stats.total, onVisibilidadeChange])

  // Sem avaliações reveladas ainda — card não aparece (decisão de produto:
  // evita mostrar um card vazio/zero no meio dos alertas acionáveis).
  if (loading || stats.total === 0) return null

  const percentualRecomenda = Math.round((stats.totalRecomenda / stats.total) * 100)

  return (
    <button
      onClick={onClick}
      type="button"
      className="group flex min-h-24 w-[calc(100vw-2.5rem)] shrink-0 snap-start items-center gap-3 rounded-2xl bg-emerald-600 p-4 sm:w-full sm:shrink text-left shadow-md shadow-emerald-100 transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-100 active:translate-y-0 animate-in fade-in duration-500 sm:p-5"
    >
      <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white/20 sm:size-11">
        <Star size={22} className="text-white" fill="white" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-white font-black text-sm uppercase italic tracking-tight leading-none">
          {stats.media.toFixed(1)} de nota média
        </p>
        <div className="mt-1.5 flex items-center gap-2">
          <StarsMini value={stats.media} />
          <span className="text-emerald-200 text-[11px] font-medium">
            {stats.total} {stats.total === 1 ? 'avaliação' : 'avaliações'} · {percentualRecomenda}% recomenda
          </span>
        </div>
      </div>
    </button>
  )
}
