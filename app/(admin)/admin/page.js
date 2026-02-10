'use client'
import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { motion, useTransform, useMotionValue, AnimatePresence } from 'framer-motion'

export default function AdminDashboard() {
  const [stats, setStats] = useState({ cidades: 0, anuncios: 0, prestadores: 0, logs: 0 })
  const [timeline, setTimeline] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [notificacao, setNotificacao] = useState(null)
  const [mounted, setMounted] = useState(false) // Fix para Hydration

  // Lógica de Gestos e Física
  const pullDistance = useMotionValue(0)
  const opacity = useTransform(pullDistance, [0, 90], [0, 1])
  const rotate = useTransform(pullDistance, [0, 100], [0, 450])
  const scale = useTransform(pullDistance, [0, 90], [0.7, 1.2])

  // Função de Vibração Haptic (App Feel)
  const hapticFeedback = useCallback((intensity = 10) => {
    if (typeof window !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(intensity)
    }
  }, [])

  const carregarDashboard = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true)
      hapticFeedback(20)
    }
    
    try {
      const [cidades, anuncios, prestadores, logs] = await Promise.all([
        supabase.from('cidades').select('*', { count: 'exact', head: true }),
        supabase.from('anuncios').select('*', { count: 'exact', head: true }),
        supabase.from('prestadores').select('*', { count: 'exact', head: true }),
        supabase.from('logs_atividades').select('*', { count: 'exact', head: true })
      ])

      const { data: pData } = await supabase.from('prestadores').select('nome, created_at, status').order('created_at', { ascending: false }).limit(3)
      const { data: lData } = await supabase.from('logs_atividades').select('acao, detalhes, created_at').in('acao', ['BUSCA_SEM_SUCESSO', 'DENUNCIA_PERFIL']).order('created_at', { ascending: false }).limit(3)

      const combinada = [
        ...(pData || []).map(item => ({ ...item, categoria: 'CADASTRO' })),
        ...(lData || []).map(item => ({ ...item, categoria: 'LOG', nome: item.acao }))
      ].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 5)

      setStats({ cidades: cidades.count || 0, anuncios: anuncios.count || 0, prestadores: prestadores.count || 0, logs: logs.count || 0 })
      setTimeline(combinada)
      
      if (isRefresh) hapticFeedback([30, 50, 30])
    } catch (err) { 
      console.error(err) 
    } finally {
      setLoading(false)
      setRefreshing(false)
      pullDistance.set(0)
    }
  }, [hapticFeedback, pullDistance])

  useEffect(() => {
    setMounted(true)
    carregarDashboard()
    
    const canal = supabase.channel('dash_realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'logs_atividades' }, (payload) => {
        if (payload.new.acao === 'DENUNCIA_PERFIL') {
          setNotificacao('Nova denúncia recebida!')
          hapticFeedback([100, 50, 100])
          setTimeout(() => setNotificacao(null), 4000)
        }
        carregarDashboard()
      })
      .subscribe()
      
    return () => { supabase.removeChannel(canal) }
  }, [carregarDashboard, hapticFeedback])

  const handleDrag = (e, info) => {
    const y = Math.max(0, info.offset.y)
    pullDistance.set(y)
    if (y > 85 && y < 90) hapticFeedback(5)
  }

  // Impede o render no servidor para evitar mismatch de animações/vibrate
  if (!mounted) return null

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-20 font-sans text-slate-800 px-2 sm:px-0 relative overflow-hidden select-none">
      
      {/* TOAST DE NOTIFICAÇÃO */}
      <AnimatePresence>
        {notificacao && (
          <motion.div 
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -100, opacity: 0 }}
            className="fixed top-6 left-1/2 -translate-x-1/2 z-[200] w-[90%] max-w-sm"
          >
            <div className="bg-red-600 text-white p-4 rounded-3xl shadow-2xl flex items-center gap-4 border border-red-500">
              <span className="text-xl">🚨</span>
              <p className="text-[10px] font-black uppercase tracking-widest flex-1">{notificacao}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* INDICADOR PULL-TO-REFRESH */}
      <motion.div 
        style={{ y: pullDistance, opacity, rotate, scale }}
        className="fixed top-20 left-1/2 -translate-x-1/2 z-[100] pointer-events-none lg:hidden"
      >
        <div className="bg-slate-900 w-12 h-12 rounded-full shadow-2xl flex items-center justify-center border border-white/20">
          <div className={`w-5 h-5 border-[3px] border-white/20 border-t-white rounded-full ${refreshing ? 'animate-spin' : ''}`} />
        </div>
      </motion.div>

      <motion.div
        drag="y"
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={0.5}
        onDrag={handleDrag}
        onDragEnd={() => pullDistance.get() > 85 ? carregarDashboard(true) : pullDistance.set(0)}
      >
        {/* HEADER */}
        <header className="flex items-center justify-between px-2 mb-4 sm:mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 uppercase italic tracking-tighter leading-none">Console</h1>
            <p className="text-[8px] sm:text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] mt-1 italic">Vínculo em tempo real</p>
          </div>
          <button 
            onClick={() => carregarDashboard(true)}
            className={`w-11 h-11 bg-slate-900 rounded-2xl flex items-center justify-center text-white shadow-xl transition-all active:scale-90 ${refreshing ? 'animate-pulse' : ''}`}
          >
            {refreshing ? '...' : '⚡'}
          </button>
        </header>

        {/* CARDS DE ESTATÍSTICAS */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <StatMini label="Cidades" valor={stats.cidades} cor="blue" />
          <StatMini label="Anúncios" valor={stats.anuncios} cor="emerald" />
          <StatMini label="Prestadores" valor={stats.prestadores} cor="slate" />
          <StatMini label="Auditoria" valor={stats.logs} cor="indigo" />
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
          {/* GRÁFICO SEMANAL */}
          <section className="lg:col-span-2 bg-white p-6 sm:p-8 rounded-[2rem] sm:rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col justify-between min-h-[320px] lg:h-[400px]">
            <div className="flex items-center justify-between mb-6 lg:mb-0 text-[9px] font-black text-slate-400 uppercase tracking-widest">
              <h2>Atividade Semanal</h2>
              <div className="flex gap-1.5"><div className="w-2 h-2 rounded-full bg-blue-100" /><div className="w-2 h-2 rounded-full bg-blue-600" /></div>
            </div>
            <div className="flex items-end justify-between h-40 sm:h-48 gap-2 px-1">
              {[40, 65, 45, 90, 60, 100, 80].map((h, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-2 group h-full justify-end">
                  <div style={{ height: `${h}%` }} className={`w-full max-w-[35px] rounded-t-lg transition-all ${i === 5 ? 'bg-blue-600' : 'bg-slate-50'}`} />
                  <span className="text-[7px] font-black text-slate-300 uppercase italic">{['S','T','Q','Q','S','S','D'][i]}</span>
                </div>
              ))}
            </div>
          </section>

          {/* FEED EM TEMPO REAL */}
          <section className="bg-slate-900 p-6 sm:p-8 rounded-[2rem] sm:rounded-[2.5rem] text-white flex flex-col min-h-[350px] lg:h-[400px]">
            <h2 className="text-[9px] font-black text-blue-400 uppercase tracking-widest mb-6 italic">Live Stream</h2>
            <div className="space-y-3 flex-1 overflow-y-auto scrollbar-hide">
              {timeline.map((item, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors group">
                  <div className={`w-7 h-7 rounded-lg shrink-0 flex items-center justify-center text-[9px] font-black ${item.categoria === 'CADASTRO' ? 'bg-emerald-500' : 'bg-red-500'}`}>{item.categoria === 'CADASTRO' ? '👤' : '🔍'}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[9px] font-black uppercase truncate tracking-tight group-hover:text-blue-400">{item.nome?.replace(/_/g, ' ')}</p>
                    <p className="text-slate-500 text-[8px] font-bold uppercase truncate italic">{item.categoria === 'CADASTRO' ? 'Novo Registro' : 'Erro de Busca'}</p>
                  </div>
                </div>
              ))}
            </div>
            <Link href="/admin/logs" className="w-full mt-6 py-3.5 bg-white/5 border border-white/10 rounded-xl text-[8px] font-black uppercase tracking-widest text-center active:bg-white active:text-slate-900 transition-all">Ver Histórico</Link>
          </section>
        </div>

        {/* ATALHOS RÁPIDOS */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 pt-6 pb-10">
          <AtalhoMini href="/admin/moderacao" label="Moderação" icon="⚖️" color="orange" />
          <AtalhoMini href="/admin/anuncios" label="Anúncios" icon="💎" color="emerald" />
          <AtalhoMini href="/admin/logs" label="Analytics" icon="📈" color="blue" />
          <AtalhoMini href="/admin/geografia" label="Geografia" icon="📍" color="indigo" />
        </div>
      </motion.div>
    </div>
  )
}

function StatMini({ label, valor, cor }) {
  const cores = { blue: 'text-blue-600', emerald: 'text-emerald-600', slate: 'text-slate-900', indigo: 'text-indigo-600' }
  return (
    <div className="bg-white p-4 rounded-[1.5rem] border border-slate-100 shadow-sm transition-transform active:scale-95">
      <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest mb-1 truncate">{label}</p>
      <p className={`text-xl sm:text-2xl font-black ${cores[cor]} tracking-tighter italic leading-none`}>{valor}</p>
    </div>
  )
}

function AtalhoMini({ href, label, icon, color }) {
  const cores = { orange: 'bg-orange-50 text-orange-600', emerald: 'bg-emerald-50 text-emerald-600', blue: 'bg-blue-50 text-blue-600', indigo: 'bg-indigo-50 text-indigo-600' }
  return (
    <Link href={href} className="bg-white p-3.5 rounded-xl border border-slate-50 shadow-sm flex items-center gap-2 active:scale-[0.97] transition-all">
      <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs ${cores[color]} shrink-0 shadow-inner`}>{icon}</div>
      <span className="text-[9px] font-black text-slate-900 uppercase italic truncate tracking-tighter">{label}</span>
    </Link>
  )
}