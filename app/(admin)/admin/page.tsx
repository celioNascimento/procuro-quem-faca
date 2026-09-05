'use client'

import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
  AlertCircle,
  ArrowRight,
  BarChart3,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  MapPin,
  Megaphone,
  RefreshCw,
  Search,
  ShieldAlert,
  Users,
  Zap,
} from 'lucide-react'
import { useAdminDashboard } from '@/hooks/useAdminDashboard'

export default function AdminDashboard() {
  const { stats, radar, refreshing, notificacao, pctAtivacao, carregarDashboard } = useAdminDashboard()
  const alerts = radar.filter((item) => item.acao === 'DENUNCIA_PERFIL' || item.acao === 'BUSCA_SEM_SUCESSO')

  return (
    <main className="mx-auto max-w-7xl px-4 pb-16 text-slate-900 sm:px-6 lg:px-8">
      <AnimatePresence>
        {notificacao && (
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="fixed left-4 right-4 top-5 z-50 mx-auto flex max-w-sm items-center gap-3 rounded-xl bg-rose-600 px-4 py-3 text-white shadow-lg"
          >
            <AlertCircle size={17} />
            <span className="text-sm font-semibold">{notificacao}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <header className="flex flex-col gap-5 border-b border-slate-200 py-7 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-blue-600">Visão geral</p>
          <h1 className="text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">Operação da plataforma</h1>
          <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500">Acompanhe o que precisa de atenção e tome decisões rápidas sobre a base.</p>
        </div>
        <button
          onClick={() => carregarDashboard(true)}
          className="inline-flex w-fit items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-blue-300 hover:text-blue-700"
        >
          <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
          Atualizar dados
        </button>
      </header>

      <section className="grid gap-3 py-6 sm:grid-cols-2 xl:grid-cols-4">
        <Metric label="Prestadores" value={stats.prestadores} detail={`${stats.reivindicados} reivindicados`} icon={<Users size={18} />} tone="blue" />
        <Metric label="Anúncios ativos" value={stats.anuncios} detail="publicados na plataforma" icon={<Megaphone size={18} />} tone="emerald" />
        <Metric label="Cidades" value={stats.cidades} detail="com cobertura cadastrada" icon={<MapPin size={18} />} tone="slate" />
        <Metric label="Eventos registrados" value={stats.logs} detail="interações monitoradas" icon={<BarChart3 size={18} />} tone="amber" />
      </section>

      <section className="grid gap-5 lg:grid-cols-[1.35fr_.65fr]">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-6 flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">Fila de atenção</p>
              <h2 className="mt-1 text-xl font-bold text-slate-950">O que pede ação agora</h2>
            </div>
            <span className="rounded-full bg-rose-50 px-3 py-1 text-xs font-bold text-rose-700">{alerts.length} alertas</span>
          </div>
          <div className="space-y-3">
            <ActionRow href="/admin/moderacao" icon={<ShieldAlert size={18} />} title="Revisar moderação" description="Verifique denúncias e perfis sinalizados" count={alerts.filter((item) => item.acao === 'DENUNCIA_PERFIL').length} tone="rose" />
            <ActionRow href="/admin/ativacao" icon={<Zap size={18} />} title="Ativar prestadores" description="Perfis aguardando contato ou conclusão" count={Math.max(stats.ativacao.total - stats.ativacao.ativos, 0)} tone="blue" />
            <ActionRow href="/admin/anuncios" icon={<ClipboardCheck size={18} />} title="Revisar anúncios" description="Mantenha as ofertas completas e relevantes" count={stats.anuncios} tone="emerald" />
          </div>
        </div>

        <div className="rounded-2xl bg-slate-950 p-5 text-white shadow-sm sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Ativação da base</p>
              <h2 className="mt-1 text-xl font-bold">Progresso atual</h2>
            </div>
            <CheckCircle2 className="text-emerald-400" size={22} />
          </div>
          <div className="mt-8 flex items-end gap-2">
            <span className="text-5xl font-bold tracking-tight">{pctAtivacao}%</span>
            <span className="pb-1 text-sm text-slate-400">contatados</span>
          </div>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-800">
            <motion.div className="h-full rounded-full bg-emerald-400" initial={{ width: 0 }} animate={{ width: `${pctAtivacao}%` }} transition={{ duration: .8 }} />
          </div>
          <p className="mt-3 text-sm text-slate-400">{stats.ativacao.ativos} perfis ativos de {stats.ativacao.total} na base.</p>
          <Link href="/admin/ativacao" className="mt-7 inline-flex items-center gap-2 text-sm font-semibold text-white hover:text-emerald-300">Abrir ativação <ArrowRight size={15} /></Link>
        </div>
      </section>

      <section className="mt-5 grid gap-5 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-5 flex items-center justify-between">
            <div><p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">Demanda</p><h2 className="mt-1 text-xl font-bold">Categorias mais buscadas</h2></div>
            <Search size={19} className="text-slate-300" />
          </div>
          <div className="space-y-1">
            {stats.topCategorias.length ? stats.topCategorias.map((category, index) => (
              <div key={`${category.nome}-${index}`} className="flex items-center gap-3 border-b border-slate-100 py-3 last:border-0">
                <span className="w-5 text-xs font-bold text-slate-400">{index + 1}</span><span className="flex-1 text-sm font-semibold text-slate-700">{category.nome}</span><span className="text-xs text-slate-400">{category.total} buscas</span>
              </div>
            )) : <p className="py-5 text-center text-sm text-slate-400">Ainda não há dados suficientes.</p>}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-5 flex items-center justify-between"><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">Monitoramento</p><h2 className="mt-1 text-xl font-bold">Atividade recente</h2></div><Link href="/admin/logs" className="text-xs font-bold text-blue-600 hover:text-blue-800">Ver tudo</Link></div>
          <div className="space-y-4">
            {radar.length ? radar.slice(0, 5).map((item, index) => <div key={`${item.created_at}-${index}`} className="flex items-start gap-3"><span className={`mt-1.5 h-2 w-2 rounded-full ${item.acao === 'DENUNCIA_PERFIL' ? 'bg-rose-500' : item.acao === 'BUSCA_SEM_SUCESSO' ? 'bg-amber-500' : 'bg-emerald-500'}`} /><div><p className="text-sm font-semibold text-slate-700">{activityLabel(item.acao)}</p><p className="mt-0.5 text-xs text-slate-400">{item.detalhes?.termo ? `Termo: ${item.detalhes.termo}` : formatTime(item.created_at)}</p></div></div>) : <p className="py-5 text-center text-sm text-slate-400">Nenhuma atividade recente.</p>}
          </div>
        </div>
      </section>

      <nav className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <QuickLink href="/admin/moderacao" label="Moderação" icon={<ShieldAlert size={17} />} />
        <QuickLink href="/admin/ativacao" label="Ativação" icon={<Zap size={17} />} />
        <QuickLink href="/admin/anuncios" label="Anúncios" icon={<Megaphone size={17} />} />
        <QuickLink href="/admin/geografia" label="Cobertura" icon={<MapPin size={17} />} />
      </nav>
    </main>
  )
}

function Metric({ label, value, detail, icon, tone }: { label: string; value: number; detail: string; icon: React.ReactNode; tone: 'blue' | 'emerald' | 'slate' | 'amber' }) {
  const tones = { blue: 'bg-blue-50 text-blue-700', emerald: 'bg-emerald-50 text-emerald-700', slate: 'bg-slate-100 text-slate-700', amber: 'bg-amber-50 text-amber-700' }
  return <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className={`mb-5 flex h-9 w-9 items-center justify-center rounded-lg ${tones[tone]}`}>{icon}</div><p className="text-xs font-semibold text-slate-500">{label}</p><p className="mt-1 text-3xl font-bold tracking-tight text-slate-950">{value}</p><p className="mt-1 text-xs text-slate-400">{detail}</p></div>
}

function ActionRow({ href, icon, title, description, count, tone }: { href: string; icon: React.ReactNode; title: string; description: string; count: number; tone: 'rose' | 'blue' | 'emerald' }) {
  const tones = { rose: 'bg-rose-50 text-rose-600', blue: 'bg-blue-50 text-blue-600', emerald: 'bg-emerald-50 text-emerald-600' }
  return <Link href={href} className="group flex items-center gap-3 rounded-xl border border-slate-100 p-3 transition hover:border-slate-300 hover:bg-slate-50"><span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${tones[tone]}`}>{icon}</span><span className="min-w-0 flex-1"><span className="block text-sm font-bold text-slate-800">{title}</span><span className="block truncate text-xs text-slate-400">{description}</span></span><span className="text-sm font-bold text-slate-500">{count}</span><ChevronRight size={16} className="text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-slate-600" /></Link>
}

function QuickLink({ href, label, icon }: { href: string; label: string; icon: React.ReactNode }) { return <Link href={href} className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-3 text-xs font-bold text-slate-600 shadow-sm transition hover:border-blue-300 hover:text-blue-700">{icon}{label}</Link> }
function activityLabel(action: string) { return action === 'DENUNCIA_PERFIL' ? 'Denúncia de perfil recebida' : action === 'BUSCA_SEM_SUCESSO' ? 'Busca sem resultado' : 'Clique no WhatsApp' }
function formatTime(value: string) { return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value)) }

