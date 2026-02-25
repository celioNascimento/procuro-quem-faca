'use client'
import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { motion, useTransform, useMotionValue, AnimatePresence } from 'framer-motion'
import { Users, Search, TrendingUp, Zap, ShieldCheck, AlertCircle, ArrowUpRight } from 'lucide-react'

export default function AdminDashboard() {
  const [stats, setStats] = useState({ 
    cidades: 0, anuncios: 0, prestadores: 0, logs: 0,
    curadoria: 0, registrados: 0, topCategorias: []
  })
  const [radar, setRadar] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [notificacao, setNotificacao] = useState(null)
  const [mounted, setMounted] = useState(false)

  const pullDistance = useMotionValue(0)
  const opacity = useTransform(pullDistance, [0, 90], [0, 1])

  const hapticFeedback = useCallback((intensity = 10) => {
    if (typeof window !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(intensity)
    }
  }, [])

  const carregarDashboard = useCallback(async (isRefresh = false) => {
    if (isRefresh) { setRefreshing(true); hapticFeedback(15); }
    try {
      const [cidades, anuncios, prestadores, logs] = await Promise.all([
        supabase.from('cidades').select('*', { count: 'exact', head: true }),
        supabase.from('anuncios').select('*', { count: 'exact', head: true }),
        supabase.from('prestadores').select('*', { count: 'exact', head: true }),
        supabase.from('logs_atividades').select('*', { count: 'exact', head: true })
      ])

      // Inteligência de Base
      const { data: pDataAll } = await supabase.from('prestadores').select('origem_tipo')
      const curadoriaCount = pDataAll?.filter(p => p.origem_tipo === 'curadoria_publica').length || 0
      const registradosCount = pDataAll?.filter(p => p.origem_tipo === 'registro_direto').length || 0

      // Demanda por Categoria (Analytics)
      const { data: logCats } = await supabase.from('logs_atividades').select('entidade_id').eq('acao', 'FILTRO_CATEGORIA')
      const { data: catNames } = await supabase.from('categorias').select('id, nome')
      
      const counts = logCats?.reduce((acc, log) => {
        acc[log.entidade_id] = (acc[log.entidade_id] || 0) + 1
        return acc
      }, {})

      const ranking = Object.entries(counts || {})
        .map(([id, total]) => ({
          nome: catNames?.find(c => c.id === id)?.nome || 'Outros',
          total
        })).sort((a, b) => b.total - a.total).slice(0, 4)

      // Radar de Conversão (Eventos Críticos)
      const { data: lRecent } = await supabase.from('logs_atividades')
        .select('acao, detalhes, created_at')
        .in('acao', ['CLIQUE_WHATSAPP', 'BUSCA_SEM_SUCESSO', 'DENUNCIA_PERFIL'])
        .order('created_at', { ascending: false }).limit(6)

      setStats({ 
        cidades: cidades.count || 0, anuncios: anuncios.count || 0, prestadores: prestadores.count || 0, logs: logs.count || 0,
        curadoria: curadoriaCount, registrados: registradosCount, topCategorias: ranking
      })
      setRadar(lRecent || [])
    } catch (err) { console.error(err) } finally {
      setLoading(false); setRefreshing(false); pullDistance.set(0);
    }
  }, [hapticFeedback, pullDistance])

  useEffect(() => {
    setMounted(true); carregarDashboard();
    const canal = supabase.channel('realtime_console')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'logs_atividades' }, (payload) => {
        if (payload.new.acao === 'DENUNCIA_PERFIL') {
          setNotificacao('Alerta de Segurança'); hapticFeedback([50, 30, 50]);
          setTimeout(() => setNotificacao(null), 4000)
        }
        carregarDashboard()
      }).subscribe()
    return () => { supabase.removeChannel(canal) }
  }, [carregarDashboard, hapticFeedback])

  if (!mounted) return null

  return (
    <div className="max-w-6xl mx-auto space-y-10 pb-24 font-sans text-slate-900 px-4 md:px-8 relative bg-[#FDFDFD]">
      
      <AnimatePresence>
        {notificacao && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="fixed top-8 left-1/2 -translate-x-1/2 z-[300]">
            <div className="bg-red-600 text-white px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border border-red-500 backdrop-blur-xl">
              <AlertCircle size={18} />
              <p className="text-[11px] font-black uppercase tracking-[0.2em]">{notificacao}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.header className="flex items-end justify-between pt-10 border-b border-slate-100 pb-8">
        <div>
          <h1 className="text-4xl font-light tracking-tighter text-zinc-900">
            Console <span className="text-blue-600 font-black italic">Elegance</span>
          </h1>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">Londrina Engine v.2.0</p>
        </div>
        <button onClick={() => carregarDashboard(true)} className={`${refreshing ? 'animate-spin' : ''}`}>
          <Zap size={22} className="text-zinc-300 hover:text-blue-600 transition-colors" />
        </button>
      </motion.header>

      {/* MÉTRICAS DE ESTRUTURA */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-10">
        <div className="space-y-8">
          <StatBlock label="Curadoria Londrina" valor={stats.curadoria} sub="Interno" color="zinc" />
          <StatBlock label="Tração Orgânica" valor={stats.registrados} sub="Requeridos" color="blue" />
        </div>

        <div className="md:col-span-2 bg-zinc-50/50 rounded-[3rem] p-8 border border-zinc-100">
          <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-8">Demanda de Mercado (Gaps)</h2>
          <div className="grid grid-cols-2 gap-4">
            {stats.topCategorias.map((c, i) => (
              <div key={i} className="bg-white p-5 rounded-3xl border border-zinc-100 shadow-sm">
                <p className="text-[9px] font-bold text-blue-600 uppercase mb-1">{c.total} Buscas</p>
                <p className="text-sm font-black text-zinc-800 uppercase italic tracking-tight">{c.nome}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* RADAR DE CONVERSÃO E GAP */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-10">
        <section className="lg:col-span-3">
           <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-8 italic">Fluxo de Tráfego</h2>
           <div className="flex items-end justify-between h-48 gap-4 px-2">
            {[30, 50, 40, 85, 55, 100, 75].map((h, i) => (
              <div key={i} className="flex-1 group relative">
                <motion.div initial={{ height: 0 }} animate={{ height: `${h}%` }} className={`w-full rounded-2xl ${i === 5 ? 'bg-blue-600 shadow-lg shadow-blue-100' : 'bg-zinc-100'}`} />
                <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[8px] font-bold text-slate-300 uppercase italic">{['S','T','Q','Q','S','S','D'][i]}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="lg:col-span-2 bg-zinc-900 rounded-[3rem] p-8 shadow-2xl flex flex-col min-h-[400px]">
          <h2 className="text-[10px] font-black text-blue-400 uppercase tracking-[0.3em] mb-8 italic">Radar de Conversão</h2>
          <div className="space-y-6 flex-1 overflow-y-auto scrollbar-hide">
            {radar.map((item, i) => (
              <div key={i} className="flex items-start gap-4">
                <div className={`mt-1.5 w-1.5 h-1.5 rounded-full ${item.acao === 'CLIQUE_WHATSAPP' ? 'bg-emerald-500 shadow-[0_0_8px_#10b981]' : item.acao === 'DENUNCIA_PERFIL' ? 'bg-red-500' : 'bg-orange-400'}`} />
                <div className="flex-1">
                  <p className="text-[10px] font-bold text-zinc-100 uppercase tracking-tight">
                    {item.acao === 'CLIQUE_WHATSAPP' ? 'Clique WhatsApp' : item.acao === 'BUSCA_SEM_SUCESSO' ? 'Gap de Oferta' : 'Denúncia'}
                  </p>
                  <p className="text-[8px] font-bold text-zinc-500 uppercase mt-0.5 truncate">
                    {item.acao === 'BUSCA_SEM_SUCESSO' ? `Termo: "${item.detalhes?.termo}"` : `Log ID: ...${item.created_at.slice(-4)}`}
                  </p>
                </div>
              </div>
            ))}
          </div>
          <Link href="/admin/logs" className="block mt-8 text-center text-[9px] font-black uppercase text-zinc-500 hover:text-white transition-colors border-t border-white/5 pt-6">Histórico Completo</Link>
        </section>
      </div>

      {/* FOOTER STATS & ATALHOS */}
      <section className="flex flex-wrap gap-12 py-10 border-t border-slate-100">
        <StatLine label="Cidades" valor={stats.cidades} />
        <StatLine label="Anúncios" valor={stats.anuncios} />
        <StatLine label="Base Total" valor={stats.prestadores} />
        <StatLine label="Eventos" valor={stats.logs} />
      </section>

      <footer className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MinimalLink href="/admin/moderacao" label="Moderação" icon="⚖️" />
        <MinimalLink href="/admin/anuncios" label="Ads Manager" icon="💎" />
        <MinimalLink href="/admin/logs" label="Analytics" icon="📈" />
        <MinimalLink href="/admin/geografia" label="Geografia" icon="📍" />
      </footer>
    </div>
  )
}

function StatBlock({ label, valor, sub, color }) {
  return (
    <div>
      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">{label}</p>
      <div className="flex items-baseline gap-2">
        <span className={`text-4xl font-black tracking-tighter ${color === 'blue' ? 'text-blue-600' : 'text-zinc-800'}`}>{valor}</span>
        <span className="text-[10px] font-bold text-slate-300 uppercase">{sub}</span>
      </div>
    </div>
  )
}

function StatLine({ label, valor }) {
  return (
    <div>
      <p className="text-[9px] font-bold text-slate-300 uppercase mb-1">{label}</p>
      <p className="text-xl font-black text-zinc-800 tracking-tighter">{valor}</p>
    </div>
  )
}

function MinimalLink({ href, label, icon }) {
  return (
    <Link href={href} className="group p-6 rounded-3xl bg-zinc-50 border border-zinc-100 hover:bg-white hover:shadow-xl transition-all">
      <div className="text-xl mb-2">{icon}</div>
      <p className="text-[10px] font-black text-zinc-800 uppercase italic tracking-tight group-hover:text-blue-600 transition-colors">{label}</p>
    </Link>
  )
}