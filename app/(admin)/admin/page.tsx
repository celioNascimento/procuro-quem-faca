//app/(admin)/admin/page.tsx

'use client'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertCircle, TrendingUp, Zap, ArrowUpRight } from 'lucide-react'
import { useAdminDashboard } from '@/hooks/useAdminDashboard'

export default function AdminDashboard() {
  const { stats, radar, refreshing, notificacao, erro, pctAtivacao, carregarDashboard } = useAdminDashboard()

  return (
    <div className="max-w-5xl mx-auto pb-24 px-4 md:px-6">

      <AnimatePresence>
        {notificacao && (
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="fixed top-6 left-4 right-4 md:left-1/2 md:-translate-x-1/2 md:w-80 z-[300]"
          >
            <div className="bg-red-600 text-white px-5 py-3.5 rounded-2xl shadow-xl flex items-center gap-3">
              <AlertCircle size={16} />
              <p className="text-[11px] font-semibold uppercase tracking-widest">{notificacao}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <header className="flex items-center justify-between pt-6 md:pt-10 pb-6 md:pb-8 border-b border-zinc-100">
        <div>
          <div className="flex items-center gap-1.5 mb-1">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
            </span>
            <p className="text-[10px] font-medium text-zinc-400 uppercase tracking-[0.2em]">Painel operacional</p>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-zinc-900 leading-none">
            Admin
          </h1>
        </div>
        <button
          onClick={() => carregarDashboard(true)}
          className={`p-2.5 rounded-xl bg-zinc-50 border border-zinc-200 hover:border-zinc-300 transition-all ${refreshing ? 'animate-spin' : ''}`}
        >
          <Zap size={16} className={refreshing ? 'text-blue-600' : 'text-zinc-400'} />
        </button>
      </header>

      {erro && (
        <div role="alert" className="mt-6 flex items-center justify-between gap-4 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-xs text-red-700">
          <span>{erro}</span>
          <button onClick={() => carregarDashboard(true)} className="font-bold underline">Tentar novamente</button>
        </div>
      )}

      <section className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3 pt-6">
        <StatCard label="Curadoria" valor={stats.curadoria} sub="perfis frios" />
        <StatCard label="Ativos" valor={stats.reivindicados} sub="reivindicados" highlight />
        <StatCard label="Orgânicos" valor={stats.registrados} sub="diretos" />
        <StatCard label="Anúncios" valor={stats.anuncios} sub="visíveis" />
      </section>

      <section className="mt-4">
        <Link href="/admin/ativacao" className="group block bg-zinc-900 text-white rounded-2xl p-5 md:p-6 hover:bg-zinc-800 transition-colors">
          <div className="flex items-center justify-between mb-4">
            <p className="text-[10px] font-medium text-zinc-500 uppercase tracking-widest">Campanha de ativação</p>
            <ArrowUpRight size={14} className="text-zinc-600 group-hover:text-zinc-400 transition-colors" />
          </div>
          <div className="flex items-end justify-between mb-4">
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl md:text-4xl font-bold text-white leading-none">{stats.ativacao.enviados}</span>
                <span className="text-sm text-zinc-500">/ {stats.ativacao.total} contatados</span>
              </div>
              <p className="text-[10px] text-zinc-600 mt-1">{stats.ativacao.ativos} perfis ativos · {pctAtivacao}% enviados</p>
            </div>
            <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider group-hover:text-zinc-300 transition-colors">
              Ver tudo →
            </span>
          </div>
          <div className="h-1 bg-zinc-800 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-white rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${pctAtivacao}%` }}
              transition={{ duration: 1, ease: 'easeOut' }}
            />
          </div>
        </Link>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 mt-4">

        <section className="lg:col-span-3 bg-white rounded-2xl border border-zinc-100 p-5 md:p-6">
          <div className="flex items-center justify-between mb-5">
            <p className="text-[10px] font-medium text-zinc-400 uppercase tracking-widest">Categorias mais buscadas</p>
            <TrendingUp size={14} className="text-zinc-300" />
          </div>
          <div className="space-y-2">
            {stats.topCategorias.length === 0 && (
              <p className="text-[11px] text-zinc-300 py-4 text-center">Sem dados ainda</p>
            )}
            {stats.topCategorias.map((c, i) => (
              <div key={i} className="flex items-center justify-between py-2.5 border-b border-zinc-50 last:border-0">
                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-bold text-zinc-300 w-4 tabular-nums">{i + 1}</span>
                  <p className="text-[13px] font-semibold text-zinc-800">{c.nome}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-zinc-400">{c.total} buscas</span>
                  <ArrowUpRight size={12} className="text-zinc-300" />
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="lg:col-span-2 bg-zinc-950 rounded-2xl p-5 md:p-6 relative overflow-hidden">
          <div className="absolute inset-0 opacity-5 pointer-events-none bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:16px_16px]" />
          <p className="text-[10px] font-medium text-zinc-600 uppercase tracking-widest mb-5 relative z-10">Pulso ao vivo</p>
          <div className="space-y-4 relative z-10 overflow-y-auto max-h-[260px] scrollbar-hide">
            {radar.length === 0 && (
              <p className="text-[11px] text-zinc-700 py-4 text-center">Aguardando eventos...</p>
            )}
            {radar.map((item, i) => (
              <div key={i} className="flex items-start gap-3">
                <span className={`mt-1 w-1.5 h-1.5 rounded-full shrink-0 ${
                  item.acao === 'CLIQUE_WHATSAPP' ? 'bg-emerald-500' : 'bg-orange-500'
                }`} />
                <div>
                  <p className="text-[11px] font-semibold text-zinc-300">
                    {item.acao === 'CLIQUE_WHATSAPP' ? 'WhatsApp clicado' : 'Busca sem resultado'}
                  </p>
                  <p className="text-[9px] text-zinc-600 mt-0.5">
                    {item.acao === 'BUSCA_SEM_SUCESSO'
                      ? `"${item.detalhes?.termo}"`
                      : item.created_at.slice(11, 16) + 'h'}
                  </p>
                </div>
              </div>
            ))}
          </div>
          <Link
            href="/admin/logs"
            className="block mt-5 pt-4 border-t border-white/5 text-[9px] font-medium text-zinc-700 hover:text-zinc-400 transition-colors uppercase tracking-widest text-center"
          >
            Ver log completo
          </Link>
        </section>
      </div>

      <footer className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-4 pt-4 border-t border-zinc-100">
        {[
          { href: '/admin/moderacao', label: 'Moderação', icon: '⚖️' },
          { href: '/admin/ativacao', label: 'Ativação', icon: '📲' },
          { href: '/admin/logs', label: 'Analytics', icon: '📈' },
          { href: '/admin/geografia', label: 'Mapa', icon: '📍' },
        ].map(({ href, label, icon }) => (
          <Link
            key={href}
            href={href}
            className="group flex items-center gap-3 p-4 rounded-xl bg-zinc-50 border border-zinc-100 hover:bg-white hover:border-zinc-200 hover:shadow-sm transition-all"
          >
            <span className="text-lg">{icon}</span>
            <p className="text-[11px] font-semibold text-zinc-600 group-hover:text-zinc-900 transition-colors">{label}</p>
          </Link>
        ))}
      </footer>
    </div>
  )
}

interface StatCardProps {
  label: string
  valor: number
  sub: string
  highlight?: boolean
}

function StatCard({ label, valor, sub, highlight = false }: StatCardProps) {
  return (
    <div className={`p-4 md:p-5 rounded-2xl border transition-all ${
      highlight ? 'bg-blue-600 border-blue-500 shadow-sm shadow-blue-100' : 'bg-white border-zinc-100'
    }`}>
      <p className={`text-[9px] font-medium uppercase tracking-widest mb-2 ${highlight ? 'text-blue-200' : 'text-zinc-400'}`}>
        {label}
      </p>
      <div className="flex items-baseline gap-1.5">
        <span className={`text-2xl md:text-3xl font-bold leading-none ${highlight ? 'text-white' : 'text-zinc-900'}`}>
          {valor}
        </span>
        <span className={`text-[9px] font-medium ${highlight ? 'text-blue-200' : 'text-zinc-400'}`}>
          {sub}
        </span>
      </div>
    </div>
  )
}
