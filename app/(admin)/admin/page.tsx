'use client'

import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertCircle, TrendingUp, RefreshCw, ArrowUpRight, Scale, Smartphone, BarChart3, MapPin } from 'lucide-react'
import { useAdminDashboard } from '@/hooks/useAdminDashboard'

const ATALHOS = [
  { href: '/admin/moderacao', label: 'Moderação', Icone: Scale },
  { href: '/admin/ativacao', label: 'Ativação', Icone: Smartphone },
  { href: '/admin/logs', label: 'Analytics', Icone: BarChart3 },
  { href: '/admin/geografia', label: 'Mapa', Icone: MapPin },
]

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
            className="fixed top-6 left-4 right-4 md:left-1/2 md:-translate-x-1/2 md:w-96 z-[300]"
            role="status"
          >
            <div className="bg-red-600 text-white px-5 py-3.5 rounded-xl shadow-lg flex items-center gap-3">
              <AlertCircle size={18} aria-hidden="true" />
              <p className="text-sm font-medium">{notificacao}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <header className="flex items-start justify-between gap-4 pt-6 md:pt-10 pb-6 border-b border-slate-200">
        <div>
          <p className="text-sm text-pqf-muted">Painel operacional</p>
          <h1 className="mt-1 text-2xl md:text-3xl font-bold tracking-tight text-pqf-ink">Visão geral</h1>
        </div>
        <button
          onClick={() => carregarDashboard(true)}
          aria-label="Atualizar dados"
          className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-500 hover:text-pqf-blue hover:border-pqf-blue transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pqf-blue"
        >
          <RefreshCw size={18} className={refreshing ? 'animate-spin text-pqf-blue' : ''} aria-hidden="true" />
        </button>
      </header>

      {erro && (
        <div role="alert" className="mt-6 flex items-center justify-between gap-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <span>{erro}</span>
          <button onClick={() => carregarDashboard(true)} className="font-semibold underline">Tentar novamente</button>
        </div>
      )}

      <section className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-6">
        <StatCard label="Curadoria" valor={stats.curadoria} sub="perfis em curadoria" />
        <StatCard label="Ativos" valor={stats.reivindicados} sub="perfis reivindicados" destaque />
        <StatCard label="Orgânicos" valor={stats.registrados} sub="cadastros diretos" />
        <StatCard label="Anúncios" valor={stats.anuncios} sub="visíveis no site" />
      </section>

      <section className="mt-4">
        <Link
          href="/admin/ativacao"
          className="group block bg-pqf-blue text-white rounded-xl p-5 md:p-6 hover:bg-pqf-blue-hover transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pqf-blue focus-visible:ring-offset-2"
        >
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-medium text-blue-100">Campanha de ativação</p>
            <ArrowUpRight size={18} className="text-blue-100 group-hover:text-white transition-colors" aria-hidden="true" />
          </div>
          <div className="flex items-end justify-between gap-4 mb-4">
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl md:text-4xl font-bold leading-none">{stats.ativacao.enviados}</span>
                <span className="text-sm text-blue-100">de {stats.ativacao.total} contatados</span>
              </div>
              <p className="text-xs text-blue-100 mt-1">{stats.ativacao.ativos} perfis ativos · {pctAtivacao}% enviados</p>
            </div>
            <span className="text-sm font-semibold text-white group-hover:underline">Ver tudo</span>
          </div>
          <div className="h-1.5 bg-white/25 rounded-full overflow-hidden" aria-hidden="true">
            <motion.div
              className="h-full bg-pqf-yellow rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${pctAtivacao}%` }}
              transition={{ duration: 1, ease: 'easeOut' }}
            />
          </div>
        </Link>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 mt-4">

        <section className="lg:col-span-3 bg-white rounded-xl border border-slate-200 p-5 md:p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-pqf-ink">Categorias mais buscadas</h2>
            <TrendingUp size={18} className="text-slate-400" aria-hidden="true" />
          </div>
          <div>
            {stats.topCategorias.length === 0 && (
              <p className="text-sm text-pqf-muted py-6 text-center">Nenhuma busca registrada ainda.</p>
            )}
            {stats.topCategorias.map((c, i) => (
              <div key={i} className="flex items-center justify-between py-3 border-b border-slate-100 last:border-0">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-semibold text-pqf-muted w-5 tabular-nums">{i + 1}</span>
                  <p className="text-sm font-medium text-pqf-ink">{c.nome}</p>
                </div>
                <span className="text-xs text-pqf-muted">{c.total} buscas</span>
              </div>
            ))}
          </div>
        </section>

        <section className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-5 md:p-6 flex flex-col">
          <h2 className="text-sm font-semibold text-pqf-ink mb-4">Atividade recente</h2>
          <div className="space-y-4 flex-1 overflow-y-auto max-h-[260px]">
            {radar.length === 0 && (
              <p className="text-sm text-pqf-muted py-6 text-center">Nenhum evento recente.</p>
            )}
            {radar.map((item, i) => (
              <div key={i} className="flex items-start gap-3">
                <span
                  className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${
                    item.acao === 'CLIQUE_WHATSAPP_ORCAMENTO' ? 'bg-emerald-500' : 'bg-amber-500'
                  }`}
                  aria-hidden="true"
                />
                <div>
                  <p className="text-sm font-medium text-pqf-ink">
                    {item.acao === 'CLIQUE_WHATSAPP_ORCAMENTO' ? 'Clique no WhatsApp' : 'Busca sem resultado'}
                  </p>
                  <p className="text-xs text-pqf-muted mt-0.5">
                    {item.acao === 'BUSCA_SEM_SUCESSO'
                      ? `"${item.detalhes?.termo}"`
                      : `${item.created_at.slice(11, 16)}h`}
                  </p>
                </div>
              </div>
            ))}
          </div>
          <Link
            href="/admin/logs"
            className="block mt-4 pt-4 border-t border-slate-100 text-sm font-semibold text-pqf-blue hover:text-pqf-blue-hover text-center"
          >
            Ver log completo
          </Link>
        </section>
      </div>

      <footer className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6 pt-6 border-t border-slate-200">
        {ATALHOS.map(({ href, label, Icone }) => (
          <Link
            key={href}
            href={href}
            className="group flex items-center gap-3 p-4 rounded-xl bg-white border border-slate-200 hover:border-pqf-blue hover:bg-pqf-blue-soft transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pqf-blue"
          >
            <Icone size={18} className="text-pqf-blue shrink-0" aria-hidden="true" />
            <p className="text-sm font-medium text-pqf-ink">{label}</p>
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
  destaque?: boolean
}

function StatCard({ label, valor, sub, destaque = false }: StatCardProps) {
  return (
    <div className={`p-4 md:p-5 rounded-xl border ${
      destaque ? 'bg-pqf-blue border-pqf-blue text-white' : 'bg-white border-slate-200 text-pqf-ink'
    }`}>
      <p className={`text-xs font-medium mb-2 ${destaque ? 'text-blue-100' : 'text-pqf-muted'}`}>
        {label}
      </p>
      <p className="text-2xl md:text-3xl font-bold leading-none">{valor}</p>
      <p className={`text-xs mt-2 ${destaque ? 'text-blue-100' : 'text-pqf-muted'}`}>{sub}</p>
    </div>
  )
}
