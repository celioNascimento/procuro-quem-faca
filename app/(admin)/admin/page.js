'use client'
import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Activity, TrendingUp, Zap, AlertCircle, ArrowUpRight, CheckCircle2, LayoutDashboard, Database } from 'lucide-react'

export default function AdminDashboard() {
  const [stats, setStats] = useState({ 
    cidades: 0, anuncios: 0, prestadores: 0, logs: 0,
    curadoria: 0, registrados: 0, reivindicados: 0, topCategorias: []
  })
  const [radar, setRadar] = useState([])
  const [refreshing, setRefreshing] = useState(false)
  const [notificacao, setNotificacao] = useState(null)

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

      const { data: pDataAll } = await supabase.from('prestadores').select('origem_tipo, user_id')
      
      const curadoriaCount = pDataAll?.filter(p => p.origem_tipo === 'curadoria_publica' && !p.user_id).length || 0
      const registradosCount = pDataAll?.filter(p => p.origem_tipo === 'registro_direto').length || 0
      const reivindicadosCount = pDataAll?.filter(p => p.user_id && p.origem_tipo === 'curadoria_publica').length || 0

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

      const { data: lRecent } = await supabase.from('logs_atividades')
        .select('acao, detalhes, created_at')
        .in('acao', ['CLIQUE_WHATSAPP', 'BUSCA_SEM_SUCESSO', 'DENUNCIA_PERFIL'])
        .order('created_at', { ascending: false }).limit(8)

      setStats({ 
        cidades: cidades.count || 0, anuncios: anuncios.count || 0, prestadores: prestadores.count || 0, logs: logs.count || 0,
        curadoria: curadoriaCount, registrados: registradosCount, reivindicados: reivindicadosCount, topCategorias: ranking
      })
      setRadar(lRecent || [])
    } catch (err) { console.error(err) } finally {
      setRefreshing(false);
    }
  }, [hapticFeedback])

  useEffect(() => {
    carregarDashboard()
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

  return (
    <div className="max-w-7xl mx-auto space-y-6 md:space-y-10 pb-24 font-sans text-slate-900 px-4 md:px-8 relative bg-[#FDFDFD]">
      
      <AnimatePresence>
        {notificacao && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="fixed top-8 left-4 right-4 md:left-1/2 md:-translate-x-1/2 z-[300]">
            <div className="bg-red-600 text-white px-6 py-4 rounded-3xl shadow-2xl flex items-center gap-3 border border-red-500 backdrop-blur-xl">
              <AlertCircle size={20} />
              <p className="text-[12px] font-black uppercase tracking-[0.2em]">{notificacao}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <header className="flex items-center justify-between pt-8 md:pt-12 border-b border-slate-100 pb-8 md:pb-10">
        <div>
          <div className="flex items-center gap-2 mb-1">
             <Database size={14} className="text-blue-600" />
             <p className="text-[10px] font-black text-blue-600 uppercase tracking-[0.3em]">Operação Londrina</p>
          </div>
          <h1 className="text-3xl md:text-4xl font-light tracking-tighter text-zinc-900 flex items-center gap-3">
            Usina de <span className="text-blue-600 font-black italic text-4xl md:text-5xl">Impacto</span>
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
          </h1>
        </div>
        <button onClick={() => carregarDashboard(true)} className={`p-3 md:p-4 rounded-full bg-zinc-50 border border-zinc-100 hover:shadow-lg transition-all ${refreshing ? 'animate-spin' : ''}`}>
          <Zap size={20} className={refreshing ? 'text-blue-600' : 'text-zinc-400'} />
        </button>
      </header>

      {/* MÉTRICAS DE IMPACTO - RESPONSIVO */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6">
        <StatCard label="Frios" valor={stats.curadoria} sub="Curadoria" color="zinc" />
        <StatCard label="Vivos" valor={stats.reivindicados} sub="Reivindicados" color="blue" icon={<CheckCircle2 size={14}/>} />
        <StatCard label="Orgânicos" valor={stats.registrados} sub="Diretos" color="zinc" />
        <StatCard label="Ads" valor={stats.anuncios} sub="Visíveis" color="zinc" />
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-6 gap-6 md:gap-8">
        {/* HEATMAP DE DEMANDA */}
        <section className="lg:col-span-4 bg-zinc-50/50 rounded-[2.5rem] md:rounded-[3rem] p-6 md:p-10 border border-zinc-100 shadow-inner">
          <div className="flex items-center justify-between mb-8 md:mb-10">
            <h2 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Demandas Reprimidas</h2>
            <TrendingUp size={16} className="text-blue-600" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
            {stats.topCategorias.map((c, i) => (
              <motion.div key={i} whileTap={{ scale: 0.98 }} className="bg-white p-5 md:p-6 rounded-[1.8rem] md:rounded-[2rem] border border-zinc-100 shadow-sm flex items-center justify-between group">
                <div>
                  <p className="text-xs font-black text-zinc-800 uppercase italic tracking-tight group-hover:text-blue-600 transition-colors">{c.nome}</p>
                  <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase">{c.total} Buscas Ativas</p>
                </div>
                <div className="h-9 w-9 bg-blue-50 rounded-full flex items-center justify-center">
                  <ArrowUpRight size={14} className="text-blue-600" />
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* RADAR DE CONVERSÃO */}
        <section className="lg:col-span-2 bg-[#0F172A] rounded-[2.5rem] md:rounded-[3.5rem] p-8 md:p-10 shadow-2xl relative overflow-hidden">
          <div className="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:20px_20px]"></div>
          <h2 className="text-[10px] font-black text-blue-400 uppercase tracking-[0.3em] mb-8 md:mb-10 italic relative z-10">Pulso de Conversão</h2>
          
          <div className="space-y-6 md:space-y-8 relative z-10 overflow-y-auto max-h-[300px] scrollbar-hide">
            {radar.map((item, i) => (
              <div key={i} className="flex items-start gap-4 border-l border-white/10 pl-4">
                <div className={`mt-1.5 w-2 h-2 rounded-full ${item.acao === 'CLIQUE_WHATSAPP' ? 'bg-emerald-500 shadow-[0_0_12px_#10b981]' : 'bg-orange-500 shadow-[0_0_12px_#f97316]'}`} />
                <div>
                  <p className="text-[11px] font-bold text-zinc-100 uppercase tracking-tight">
                    {item.acao === 'CLIQUE_WHATSAPP' ? 'Sucesso WhatsApp' : 'Lead Perdido'}
                  </p>
                  <p className="text-[9px] font-medium text-zinc-500 mt-1 uppercase">
                    {item.acao === 'BUSCA_SEM_SUCESSO' ? `Termo: "${item.detalhes?.termo}"` : `${item.created_at.slice(11, 16)}h`}
                  </p>
                </div>
              </div>
            ))}
          </div>
          <Link href="/admin/logs" className="block mt-8 text-center text-[9px] font-black uppercase text-zinc-500 hover:text-white transition-all tracking-widest border-t border-white/5 pt-8">Log de Auditoria</Link>
        </section>
      </div>

      {/* QUICK ACTIONS - GRID 2X2 MOBILE */}
      <footer className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 pt-10 border-t border-slate-100">
        <MinimalLink href="/admin/moderacao" label="Moderação" icon="⚖️" />
        <MinimalLink href="/admin/anuncios" label="Anúncios" icon="💎" />
        <MinimalLink href="/admin/logs" label="Analytics" icon="📈" />
        <MinimalLink href="/admin/geografia" label="Mapa" icon="📍" />
      </footer>
    </div>
  )
}

function StatCard({ label, valor, sub, color, icon }) {
  return (
    <div className={`p-5 md:p-8 rounded-[1.8rem] md:rounded-[2.5rem] transition-all duration-500 border ${color === 'blue' ? 'bg-blue-600 text-white border-blue-500 shadow-xl shadow-blue-100' : 'bg-white border-slate-100 shadow-sm'}`}>
      <div className="flex justify-between items-start mb-2 md:mb-4">
        <p className={`text-[8px] md:text-[9px] font-black uppercase tracking-widest ${color === 'blue' ? 'text-blue-100' : 'text-slate-400'}`}>{label}</p>
        {icon && <div className={color === 'blue' ? 'text-white' : 'opacity-50'}>{icon}</div>}
      </div>
      <div className="flex items-baseline gap-1 md:gap-2">
        <span className={`text-3xl md:text-5xl font-black tracking-tighter ${color === 'blue' ? 'text-white' : 'text-zinc-900'}`}>{valor}</span>
        <span className={`text-[8px] md:text-[10px] font-bold uppercase ${color === 'blue' ? 'text-blue-200' : 'text-slate-300'}`}>{sub}</span>
      </div>
    </div>
  )
}

function MinimalLink({ href, label, icon }) {
  return (
    <Link href={href} className="group p-5 md:p-8 rounded-[1.8rem] md:rounded-[2.5rem] bg-zinc-50 border border-zinc-100 hover:bg-white hover:shadow-xl transition-all duration-500 text-center md:text-left">
      <div className="text-xl md:text-2xl mb-2 md:mb-3 group-hover:scale-110 transition-transform">{icon}</div>
      <p className="text-[9px] md:text-[10px] font-black text-zinc-800 uppercase italic tracking-tight group-hover:text-blue-600 transition-colors">{label}</p>
    </Link>
  )
}