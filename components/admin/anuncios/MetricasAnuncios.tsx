// components/admin/anuncios/MetricasAnuncios.tsx
'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { TrendingUp, MousePointerClick, Eye, BarChart2, Calendar, AlertCircle } from 'lucide-react'

const supabase = createClient()

const labelClass = 'text-[10px] font-medium text-zinc-400 uppercase tracking-widest'

type MetricaDiaria = {
  data_referencia: string
  impressoes: number
  cliques: number
}

type AnuncioComMetricas = {
  id: string
  titulo: string
  posicao: string
  status: boolean
  data_expiracao: string | null
  anunciante_nome: string
  total_impressoes: number
  total_cliques: number
  ctr: number
  metricas_diarias: MetricaDiaria[]
}

const POSICOES_LABELS: Record<string, string> = {
  topo_busca: 'Topo da Busca',
  entre_cards: 'Entre os Cards',
  topo_perfil: 'Topo do Perfil',
  dashboard_prestador: 'Painel do Prestador',
  dashboard_cliente: 'Painel do Cliente',
}

type FiltroMetrica = 'ativos' | 'todos'

function Sparkline({ dados, cor }: { dados: number[]; cor: string }) {
  if (dados.length < 2) {
    return <div className="h-8 w-20 flex items-center text-[10px] text-zinc-300">—</div>
  }
  const max = Math.max(...dados, 1)
  const w = 80
  const h = 32
  const pontos = dados
    .map((v, i) => `${(i / (dados.length - 1)) * w},${h - (v / max) * h}`)
    .join(' ')

  return (
    <svg width={w} height={h} className="overflow-visible">
      <polyline points={pontos} fill="none" stroke={cor} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      {dados.map((v, i) => (
        <circle key={i} cx={(i / (dados.length - 1)) * w} cy={h - (v / max) * h} r="2" fill={cor} />
      ))}
    </svg>
  )
}

function AnuncioMetricaCard({ anuncio }: { anuncio: AnuncioComMetricas }) {
  const agora = new Date()
  const isExpirado = anuncio.data_expiracao && new Date(anuncio.data_expiracao) < agora
  const isAtivo = anuncio.status && !isExpirado

  return (
    <div className={`rounded-2xl border bg-white p-4 md:p-5 ${!isAtivo ? 'border-zinc-100 opacity-60' : 'border-zinc-100'}`}>
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="min-w-0">
          <p className="text-[13px] font-bold text-zinc-900 truncate">{anuncio.anunciante_nome}</p>
          <p className="text-[10px] text-zinc-400 uppercase tracking-wide mt-0.5">
            {POSICOES_LABELS[anuncio.posicao] ?? anuncio.posicao}
          </p>
        </div>
        <span className={`shrink-0 rounded-full px-2.5 py-1 text-[9px] font-bold uppercase tracking-widest ${
          isAtivo ? 'bg-emerald-50 text-emerald-600' :
          isExpirado ? 'bg-red-50 text-red-500' :
          'bg-zinc-100 text-zinc-400'
        }`}>
          {isAtivo ? 'Ativo' : isExpirado ? 'Expirado' : 'Rascunho'}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="rounded-xl bg-zinc-50 p-3">
          <div className="flex items-center gap-1 mb-1">
            <Eye size={11} className="text-zinc-400" />
            <p className={labelClass}>Impressões</p>
          </div>
          <p className="text-xl font-bold text-zinc-900 leading-none">{anuncio.total_impressoes.toLocaleString('pt-BR')}</p>
        </div>
        <div className="rounded-xl bg-zinc-50 p-3">
          <div className="flex items-center gap-1 mb-1">
            <MousePointerClick size={11} className="text-zinc-400" />
            <p className={labelClass}>Cliques</p>
          </div>
          <p className="text-xl font-bold text-zinc-900 leading-none">{anuncio.total_cliques.toLocaleString('pt-BR')}</p>
        </div>
        <div className="rounded-xl bg-zinc-50 p-3">
          <div className="flex items-center gap-1 mb-1">
            <TrendingUp size={11} className="text-zinc-400" />
            <p className={labelClass}>CTR</p>
          </div>
          <p className="text-xl font-bold text-zinc-900 leading-none">{anuncio.ctr.toFixed(1)}%</p>
        </div>
      </div>

      {anuncio.metricas_diarias.length > 1 ? (
        <div className="flex items-end justify-between gap-4 pt-3 border-t border-zinc-50">
          <div>
            <p className={`${labelClass} mb-1.5`}>Impressões / período</p>
            <Sparkline dados={anuncio.metricas_diarias.map(m => m.impressoes)} cor="#6366f1" />
          </div>
          <div>
            <p className={`${labelClass} mb-1.5`}>Cliques / período</p>
            <Sparkline dados={anuncio.metricas_diarias.map(m => m.cliques)} cor="#10b981" />
          </div>
          <div className="text-right">
            <p className={`${labelClass} mb-1`}>Último registro</p>
            <p className="text-[11px] font-semibold text-zinc-600">
              {new Date(anuncio.metricas_diarias.at(-1)!.data_referencia)
                .toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
            </p>
          </div>
        </div>
      ) : (
        <div className="pt-3 border-t border-zinc-50">
          <p className="text-[11px] text-zinc-300">Sem dados ainda — aguardando primeira exibição</p>
        </div>
      )}
    </div>
  )
}

export function MetricasAnuncios() {
  const [anuncios, setAnuncios] = useState<AnuncioComMetricas[]>([])
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState<string | null>(null)
  const [periodo, setPeriodo] = useState<7 | 14 | 30>(7)
  const [filtro, setFiltro] = useState<FiltroMetrica>('ativos')
  const [debugInfo, setDebugInfo] = useState<string | null>(null)

  useEffect(() => {
    async function carregar() {
      setLoading(true)
      setErro(null)
      setDebugInfo(null)
      try {
        const dataInicio = new Date()
        dataInicio.setDate(dataInicio.getDate() - periodo)
        const dataInicioStr = dataInicio.toISOString().slice(0, 10)

        const [resAnuncios, resMetricas] = await Promise.all([
          supabase
            .from('anuncios')
            .select('id, titulo, posicao, status, data_expiracao, anunciantes(razao_social)')
            .order('created_at', { ascending: false }),
          supabase
            .from('anuncios_metricas_diarias')
            .select('anuncio_id, data_referencia, impressoes, cliques')
            .gte('data_referencia', dataInicioStr)
            .order('data_referencia', { ascending: true }),
        ])

        // Log de diagnóstico — remover após confirmar funcionamento
        console.log('[MetricasAnuncios] anuncios:', resAnuncios.data?.length, '| error:', resAnuncios.error)
        console.log('[MetricasAnuncios] metricas:', resMetricas.data?.length, '| error:', resMetricas.error)
        console.log('[MetricasAnuncios] sample metrica:', resMetricas.data?.[0])

        // Exibe diagnóstico na UI para facilitar debug sem DevTools
        setDebugInfo(
          `Anúncios: ${resAnuncios.data?.length ?? 0} | ` +
          `Métricas: ${resMetricas.data?.length ?? 0} | ` +
          `Erro anúncios: ${resAnuncios.error?.message ?? 'nenhum'} | ` +
          `Erro métricas: ${resMetricas.error?.message ?? 'nenhum'}`
        )

        if (resAnuncios.error) throw resAnuncios.error
        if (resMetricas.error) throw resMetricas.error

        const metricasPorAnuncio = new Map<string, MetricaDiaria[]>()
        for (const m of resMetricas.data ?? []) {
          const lista = metricasPorAnuncio.get(m.anuncio_id) ?? []
          lista.push({ data_referencia: m.data_referencia, impressoes: m.impressoes, cliques: m.cliques })
          metricasPorAnuncio.set(m.anuncio_id, lista)
        }

        const resultado: AnuncioComMetricas[] = (resAnuncios.data ?? []).map((a: any) => {
          const diarias = metricasPorAnuncio.get(a.id) ?? []
          const total_impressoes = diarias.reduce((s, m) => s + m.impressoes, 0)
          const total_cliques = diarias.reduce((s, m) => s + m.cliques, 0)
          const ctr = total_impressoes > 0 ? (total_cliques / total_impressoes) * 100 : 0
          return {
            id: a.id,
            titulo: a.titulo,
            posicao: a.posicao,
            status: a.status,
            data_expiracao: a.data_expiracao,
            anunciante_nome: a.anunciantes?.razao_social ?? a.titulo,
            total_impressoes,
            total_cliques,
            ctr,
            metricas_diarias: diarias,
          }
        })

        resultado.sort((a, b) => {
          const aTotal = a.total_cliques + a.total_impressoes
          const bTotal = b.total_cliques + b.total_impressoes
          if (bTotal !== aTotal) return bTotal - aTotal
          return b.total_cliques - a.total_cliques
        })

        setAnuncios(resultado)
      } catch (e: any) {
        setErro(e.message ?? 'Erro ao carregar métricas')
      } finally {
        setLoading(false)
      }
    }

    carregar()
  }, [periodo])

  const agora = new Date()

  const anunciosFiltrados = anuncios.filter(a => {
    if (filtro === 'ativos') {
      const isExpirado = a.data_expiracao && new Date(a.data_expiracao) < agora
      return a.status && !isExpirado
    }
    return true
  })

  const totalImpressoes = anunciosFiltrados.reduce((s, a) => s + a.total_impressoes, 0)
  const totalCliques = anunciosFiltrados.reduce((s, a) => s + a.total_cliques, 0)
  const ctrGeral = totalImpressoes > 0 ? (totalCliques / totalImpressoes) * 100 : 0
  const melhorAnuncio = anunciosFiltrados[0]

  return (
    <div>
      {/* Controles */}
      <div className="flex items-center justify-between pt-6 pb-4 gap-4 flex-wrap">
        <div className="flex gap-1.5">
          <button
            onClick={() => setFiltro('ativos')}
            className={`rounded-xl px-3 py-1.5 text-[11px] font-bold transition-colors ${
              filtro === 'ativos' ? 'bg-zinc-900 text-white' : 'bg-zinc-100 text-zinc-500 hover:bg-zinc-200'
            }`}
          >
            Ativos
          </button>
          <button
            onClick={() => setFiltro('todos')}
            className={`rounded-xl px-3 py-1.5 text-[11px] font-bold transition-colors ${
              filtro === 'todos' ? 'bg-zinc-900 text-white' : 'bg-zinc-100 text-zinc-500 hover:bg-zinc-200'
            }`}
          >
            Todos
          </button>
        </div>
        <div className="flex items-center gap-2">
          <Calendar size={13} className="text-zinc-400" />
          <div className="flex gap-1.5">
            {([7, 14, 30] as const).map(p => (
              <button
                key={p}
                onClick={() => setPeriodo(p)}
                className={`rounded-xl px-3 py-1.5 text-[11px] font-bold transition-colors ${
                  periodo === p ? 'bg-zinc-900 text-white' : 'bg-zinc-100 text-zinc-500 hover:bg-zinc-200'
                }`}
              >
                {p}d
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Info de diagnóstico — visível na UI temporariamente */}
      {debugInfo && (
        <div className="mb-4 rounded-xl bg-zinc-50 border border-zinc-100 px-3.5 py-2.5 text-[11px] font-mono text-zinc-500">
          {debugInfo}
        </div>
      )}

      {/* Resumo geral */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3 mb-6">
        <div className="p-4 md:p-5 rounded-2xl border border-zinc-100 bg-white">
          <div className="flex items-center gap-1.5 mb-2">
            <Eye size={11} className="text-zinc-400" />
            <p className={labelClass}>Impressões</p>
          </div>
          <span className="text-2xl md:text-3xl font-bold text-zinc-900 leading-none">
            {loading ? '—' : totalImpressoes.toLocaleString('pt-BR')}
          </span>
        </div>
        <div className="p-4 md:p-5 rounded-2xl border border-zinc-100 bg-white">
          <div className="flex items-center gap-1.5 mb-2">
            <MousePointerClick size={11} className="text-zinc-400" />
            <p className={labelClass}>Cliques</p>
          </div>
          <span className="text-2xl md:text-3xl font-bold text-zinc-900 leading-none">
            {loading ? '—' : totalCliques.toLocaleString('pt-BR')}
          </span>
        </div>
        <div className="p-4 md:p-5 rounded-2xl border border-zinc-100 bg-white">
          <div className="flex items-center gap-1.5 mb-2">
            <TrendingUp size={11} className="text-zinc-400" />
            <p className={labelClass}>CTR geral</p>
          </div>
          <span className="text-2xl md:text-3xl font-bold text-zinc-900 leading-none">
            {loading ? '—' : `${ctrGeral.toFixed(1)}%`}
          </span>
        </div>
        <div className="p-4 md:p-5 rounded-2xl border border-zinc-100 bg-white">
          <div className="flex items-center gap-1.5 mb-2">
            <BarChart2 size={11} className="text-zinc-400" />
            <p className={labelClass}>Mais cliques</p>
          </div>
          <span className="text-[13px] font-bold text-zinc-900 leading-tight line-clamp-2">
            {loading ? '—' : melhorAnuncio?.anunciante_nome ?? '—'}
          </span>
        </div>
      </div>

      {erro && (
        <div className="mb-4 flex items-center gap-2 rounded-xl bg-red-50 px-3.5 py-2.5 text-[12px] font-medium text-red-600">
          <AlertCircle size={14} /> {erro}
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <div key={i} className="h-44 rounded-2xl bg-zinc-50 animate-pulse" />)}
        </div>
      ) : anunciosFiltrados.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-200 bg-white p-10 text-center">
          <p className="text-[13px] font-semibold text-zinc-500">Nenhum anúncio ativo no momento</p>
          <p className="mt-1 text-[11px] text-zinc-300">Mude para "Todos" para ver expirados e rascunhos</p>
        </div>
      ) : (
        <div className="space-y-3">
          {anunciosFiltrados.map(a => <AnuncioMetricaCard key={a.id} anuncio={a} />)}
        </div>
      )}
    </div>
  )
}
