'use client'

import { useMemo, useState } from 'react'
import { Star, TrendingUp, MessageSquare, BarChart3 } from 'lucide-react'
import { useAvaliacoes } from '@/hooks/useAvaliacoes'

function Stars({ value }: { value: number }) {
  return <span className="inline-flex gap-0.5 text-amber-500" aria-label={`${value.toFixed(1)} de 5 estrelas`}>{[1, 2, 3, 4, 5].map((star) => <Star key={star} className={`size-4 ${star <= Math.round(value) ? 'fill-current' : ''}`} aria-hidden="true" />)}</span>
}

export default function AvaliacoesDashboardTab({ prestadorId }: { prestadorId: number | null }) {
  const { avaliacoes, stats, loading } = useAvaliacoes(prestadorId ?? 0)
  const evolucao = useMemo(() => {
    const meses = Array.from({ length: 6 }, (_, index) => {
      const date = new Date()
      date.setMonth(date.getMonth() - (5 - index))
      const key = `${date.getFullYear()}-${date.getMonth()}`
      const itens = avaliacoes.filter((item) => { const d = new Date(item.created_at); return `${d.getFullYear()}-${d.getMonth()}` === key })
      return { label: date.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', ''), media: itens.length ? itens.reduce((sum, item) => sum + item.nota, 0) / itens.length : 0 }
    })
    return meses
  }, [avaliacoes])

  if (!prestadorId || loading) return <div className="flex min-h-64 items-center justify-center text-sm text-muted-foreground">Carregando sua reputação...</div>

  return <section className="flex flex-col gap-6" aria-labelledby="reputacao-titulo">
    <div><p className="text-[10px] font-black uppercase tracking-[0.22em] text-blue-600">Sua reputação</p><h2 id="reputacao-titulo" className="mt-1 text-2xl font-black tracking-tight text-slate-900">Notas que mostram o seu trabalho</h2><p className="mt-2 text-sm text-slate-500">Acompanhe como os clientes percebem cada entrega.</p></div>
    <div className="grid gap-4 sm:grid-cols-3">
      <article className="rounded-3xl border border-slate-200 bg-white p-5"><div className="flex items-center gap-2 text-slate-400"><Star className="size-4 text-amber-500" /><span className="text-xs font-bold uppercase tracking-wide">Nota média</span></div><p className="mt-3 text-4xl font-black text-slate-900">{stats.total ? stats.media.toFixed(1) : '—'}</p><Stars value={stats.media} /></article>
      <article className="rounded-3xl border border-slate-200 bg-white p-5"><div className="flex items-center gap-2 text-slate-400"><MessageSquare className="size-4" /><span className="text-xs font-bold uppercase tracking-wide">Avaliações</span></div><p className="mt-3 text-4xl font-black text-slate-900">{stats.total}</p><p className="mt-1 text-xs text-slate-500">opiniões publicadas</p></article>
      <article className="rounded-3xl border border-slate-200 bg-white p-5"><div className="flex items-center gap-2 text-slate-400"><TrendingUp className="size-4 text-emerald-600" /><span className="text-xs font-bold uppercase tracking-wide">Recomendação</span></div><p className="mt-3 text-4xl font-black text-slate-900">{stats.total ? Math.round((stats.totalIndica / stats.total) * 100) : 0}%</p><p className="mt-1 text-xs text-slate-500">dos clientes indicam</p></article>
    </div>
    <div className="grid gap-6 lg:grid-cols-[1fr_1.4fr]">
      <article className="rounded-3xl border border-slate-200 bg-white p-5"><div className="flex items-center gap-2"><BarChart3 className="size-4 text-blue-600" /><h3 className="font-black text-slate-900">Distribuição das notas</h3></div><div className="mt-5 flex flex-col gap-3">{[5,4,3,2,1].map((nota) => <div key={nota} className="flex items-center gap-3 text-xs font-bold text-slate-500"><span className="w-4">{nota}</span><div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-amber-400" style={{ width: `${stats.total ? (stats.distribuicao[nota] / stats.total) * 100 : 0}%` }} /></div><span className="w-6 text-right">{stats.distribuicao[nota] ?? 0}</span></div>)}</div></article>
      <article className="rounded-3xl border border-slate-200 bg-white p-5"><div className="flex items-center gap-2"><TrendingUp className="size-4 text-blue-600" /><h3 className="font-black text-slate-900">Evolução recente</h3></div><div className="mt-6 flex h-32 items-end justify-between gap-3">{evolucao.map((item) => <div key={item.label} className="flex flex-1 flex-col items-center gap-2"><div className="flex h-24 w-full items-end"><div className="w-full rounded-t-lg bg-blue-600" style={{ height: `${item.media ? Math.max(item.media / 5 * 100, 8) : 4}%` }} title={item.media ? `${item.media.toFixed(1)} em ${item.label}` : 'Sem avaliações'} /></div><span className="text-[10px] font-bold uppercase text-slate-400">{item.label}</span></div>)}</div></article>
    </div>
    <article className="rounded-3xl border border-slate-200 bg-white p-5"><h3 className="font-black text-slate-900">Avaliações recentes</h3><div className="mt-4 flex flex-col divide-y divide-slate-100">{avaliacoes.slice(0, 5).map((item) => <div key={item.id} className="flex flex-col gap-2 py-4 first:pt-0 sm:flex-row sm:items-start sm:justify-between"><div><Stars value={item.nota} /><p className="mt-2 text-sm leading-6 text-slate-600">{item.comentario || 'Cliente não deixou um comentário.'}</p><p className="mt-1 text-xs text-slate-400">{item.portfolio_projetos?.[0]?.titulo || 'Serviço concluído'}</p></div><time className="text-xs text-slate-400" dateTime={item.created_at}>{new Date(item.created_at).toLocaleDateString('pt-BR')}</time></div>)}{!avaliacoes.length && <p className="py-8 text-center text-sm text-slate-500">Suas primeiras avaliações aparecerão aqui após os serviços concluídos.</p>}</div></article>
  </section>
}


export function AvaliacaoClienteRapida({
  onSubmit,
  somenteLeitura = false,
  notaInicial = 0,
  motivosIniciais = [],
}: {
  onSubmit: (nota: number, motivos: string[]) => Promise<void>
  somenteLeitura?: boolean
  notaInicial?: number
  motivosIniciais?: string[]
}) {
  const [nota, setNota] = useState(notaInicial)
  const [motivos, setMotivos] = useState<string[]>(motivosIniciais)
  const opcoes = ['Comunicação', 'Pontualidade', 'Respeito', 'Pagamento combinado', 'Organização', 'Recomendaria este cliente']
  const alternar = (motivo: string) => {
    if (somenteLeitura) return
    setMotivos((atual: string[]) => atual.includes(motivo) ? atual.filter((item) => item !== motivo) : atual.length < 3 ? [...atual, motivo] : atual)
  }
  return (
    <div className="flex flex-col gap-5 rounded-3xl border border-slate-200 bg-white p-6">
      <h3 className="text-lg font-black text-slate-900">
        {somenteLeitura ? 'Sua avaliação sobre este cliente' : 'Como foi atender este cliente?'}
      </h3>
      <div className="flex gap-2">
        {[1, 2, 3, 4, 5].map((item) => (
          <button
            key={item}
            type="button"
            aria-label={`${item} estrelas`}
            disabled={somenteLeitura}
            onClick={() => !somenteLeitura && setNota(item)}
            className={`rounded-lg p-1 text-2xl text-amber-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${somenteLeitura ? 'cursor-default' : ''}`}
          >
            {item <= nota ? '★' : '☆'}
          </button>
        ))}
      </div>
      <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
        {somenteLeitura ? 'Pontos positivos selecionados' : 'Escolha até 3 pontos positivos'}
      </p>
      <div className="flex flex-wrap gap-2">
        {opcoes.map((motivo) => (
          <button
            key={motivo}
            type="button"
            aria-pressed={motivos.includes(motivo)}
            disabled={somenteLeitura}
            onClick={() => alternar(motivo)}
            className={`rounded-full border px-3 py-2 text-xs font-bold transition-colors ${motivos.includes(motivo) ? 'border-blue-600 bg-blue-600 text-white' : 'border-slate-200 text-slate-600 hover:border-blue-300'} ${somenteLeitura ? 'cursor-default opacity-80' : ''}`}
          >
            {motivo}
          </button>
        ))}
      </div>
      {!somenteLeitura && (
        <button
          type="button"
          disabled={!nota}
          onClick={() => onSubmit(nota, motivos)}
          className="min-h-11 rounded-xl bg-blue-600 px-4 py-3 text-xs font-black uppercase tracking-wide text-white disabled:cursor-not-allowed disabled:opacity-40"
        >
          Enviar avaliação
        </button>
      )}
    </div>
  )
}
