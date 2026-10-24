// app/(admin)/admin/ativacao/page.tsx
//
// Página da campanha de ativação de prestadores. Toda leitura/escrita no
// Supabase foi extraída para lib/services/adminAtivacao.service.ts +
// hooks/useAdminAtivacao.ts — esta página só monta a UI e repassa callbacks.

'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search } from 'lucide-react'
import { useAdminAtivacao } from '@/hooks/useAdminAtivacao'
import { CardPrestadorAtivacao } from '@/components/admin/ativacao/CardPrestadorAtivacao'
import { STATUS, FILTROS, montarMsgAtivacao } from '@/lib/config/ativacao'

export default function PaginaAtivacao() {
  const { prestadores, loading, salvando, stats, atualizarStatus, salvarObs } = useAdminAtivacao()

  const [filtro, setFiltro] = useState<(typeof FILTROS)[number]>('todos')
  const [busca, setBusca] = useState('')
  const [expandido, setExpandido] = useState<number | null>(null)
  const [copiado, setCopiado] = useState<number | null>(null)

  const abrirWA = (p: { whatsapp: string | null; nome: string; slug: string }) => {
    const wpp = p.whatsapp?.replace(/\D/g, '')
    window.open(`https://wa.me/55${wpp}?text=${encodeURIComponent(montarMsgAtivacao(p))}`, '_blank')
  }

  const copiarLink = async (p: { id: number; whatsapp: string | null; nome: string; slug: string }) => {
    const wpp = p.whatsapp?.replace(/\D/g, '')
    const link = `https://wa.me/55${wpp}?text=${encodeURIComponent(montarMsgAtivacao(p))}`
    await navigator.clipboard.writeText(link)
    setCopiado(p.id)
    setTimeout(() => setCopiado(null), 2000)
  }

  const lista = prestadores.filter((p) => {
    const passaBusca = p.nome.toLowerCase().includes(busca.toLowerCase()) || p.slug?.toLowerCase().includes(busca.toLowerCase())
    const passaFiltro = filtro === 'todos' || p.ativacao_status === filtro
    return passaBusca && passaFiltro
  })

  const total = prestadores.length
  const enviados = Object.entries(stats).filter(([k]) => k !== 'nao_enviado').reduce((a, [, v]) => a + v, 0)
  const completos = (stats.perfil_completo || 0) + (stats.avaliacao_recebida || 0)
  const pct = total ? Math.round((enviados / total) * 100) : 0

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-5 h-5 border-2 border-zinc-800 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="max-w-xl mx-auto pb-24">

      {/* ── Cabeçalho ── */}
      <div className="pt-4 pb-6">
        <p className="text-[10px] font-medium text-zinc-400 uppercase tracking-[0.2em] mb-1">Campanha · {total} prestadores</p>
        <h1 className="text-[1.75rem] font-bold tracking-tight text-zinc-900 leading-none">Ativação</h1>
      </div>

      {/* ── Métricas ── */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        {[
          { label: 'Total', val: total, color: 'text-zinc-900' },
          { label: 'Contatados', val: enviados, color: 'text-blue-600' },
          { label: 'Ativos', val: completos, color: 'text-emerald-600' },
        ].map(({ label, val, color }) => (
          <div key={label} className="bg-white rounded-2xl p-4 border border-zinc-100">
            <p className={`text-2xl font-bold ${color} leading-none mb-1`}>{val}</p>
            <p className="text-[10px] text-zinc-400 font-medium uppercase tracking-wider">{label}</p>
          </div>
        ))}
      </div>

      {/* ── Progresso + legenda ── */}
      <div className="bg-white rounded-2xl p-4 border border-zinc-100 mb-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-[11px] text-zinc-400">Enviados</span>
          <span className="text-[11px] font-semibold text-zinc-700">{pct}%</span>
        </div>
        <div className="h-1 bg-zinc-100 rounded-full overflow-hidden mb-3">
          <motion.div
            className="h-full bg-zinc-900 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 1, ease: 'easeOut' }}
          />
        </div>
        <div className="flex flex-wrap gap-x-3 gap-y-1.5">
          {Object.entries(STATUS).map(([key, s]) => {
            const qtd = stats[key] || 0
            if (!qtd) return null
            return (
              <button
                key={key}
                onClick={() => setFiltro(filtro === key ? 'todos' : (key as (typeof FILTROS)[number]))}
                className={`flex items-center gap-1.5 transition-opacity ${filtro !== 'todos' && filtro !== key ? 'opacity-25' : ''}`}
              >
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: s.dot }} />
                <span className="text-[10px] text-zinc-500">{s.label}</span>
                <span className="text-[10px] font-semibold text-zinc-800">{qtd}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Busca ── */}
      <div className="relative mb-3">
        <Search size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
        <input
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar prestador..."
          className="w-full pl-9 pr-4 py-2.5 bg-white border border-zinc-200 rounded-xl text-sm text-zinc-800 placeholder:text-zinc-400 focus:outline-none focus:border-zinc-400 transition-colors"
        />
      </div>

      {/* ── Pills de filtro ── */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 mb-4 scrollbar-hide -mx-4 px-4">
        {FILTROS.map((f) => {
          const s = STATUS[f]
          const qtd = f === 'todos' ? total : (stats[f] || 0)
          const on = filtro === f
          return (
            <button
              key={f}
              onClick={() => setFiltro(f)}
              className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-semibold transition-all border ${
                on ? 'bg-zinc-900 text-white border-zinc-900' : 'bg-white text-zinc-500 border-zinc-200'
              }`}
            >
              {f !== 'todos' && (
                <span
                  className="w-1.5 h-1.5 rounded-full shrink-0"
                  style={{ background: on ? 'rgba(255,255,255,0.6)' : s.dot }}
                />
              )}
              {f === 'todos' ? 'Todos' : s.label} · {qtd}
            </button>
          )
        })}
      </div>

      {/* ── Contagem ── */}
      <p className="text-[10px] text-zinc-400 font-medium uppercase tracking-wider mb-2 px-0.5">
        {lista.length} resultado{lista.length !== 1 ? 's' : ''}
      </p>

      {/* ── Lista ── */}
      <div className="space-y-1.5">
        <AnimatePresence>
          {lista.map((p) => (
            <CardPrestadorAtivacao
              key={p.id}
              p={p}
              expandido={expandido === p.id}
              salvando={salvando === p.id}
              copiado={copiado === p.id}
              onExpand={() => setExpandido(expandido === p.id ? null : p.id)}
              onStatus={(s) => atualizarStatus(p.id, s)}
              onCopiar={() => copiarLink(p)}
              onAbrir={() => abrirWA(p)}
              onObs={(obs) => salvarObs(p.id, obs)}
            />
          ))}
        </AnimatePresence>
      </div>
    </div>
  )
}
