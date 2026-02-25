'use client'
import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { motion, useTransform, useMotionValue, AnimatePresence } from 'framer-motion'
import { Users, Search, TrendingUp, BarChart3 } from 'lucide-react'

export default function AdminDashboard() {
  const [stats, setStats] = useState({ 
    cidades: 0, 
    anuncios: 0, 
    prestadores: 0, 
    logs: 0,
    curadoria: 0,
    registrados: 0,
    topCategorias: []
  })
  const [timeline, setTimeline] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [notificacao, setNotificacao] = useState(null)
  const [mounted, setMounted] = useState(false)

  const pullDistance = useMotionValue(0)
  const opacity = useTransform(pullDistance, [0, 90], [0, 1])
  const rotate = useTransform(pullDistance, [0, 100], [0, 450])
  const scale = useTransform(pullDistance, [0, 90], [0.7, 1.2])

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
      // 1. Queries de Contagem Básica
      const [cidades, anuncios, prestadores, logs] = await Promise.all([
        supabase.from('cidades').select('*', { count: 'exact', head: true }),
        supabase.from('anuncios').select('*', { count: 'exact', head: true }),
        supabase.from('prestadores').select('*', { count: 'exact', head: true }),
        supabase.from('logs_atividades').select('*', { count: 'exact', head: true })
      ])

      // 2. Inteligência de Base (Curadoria vs Registro)
      const { data: pDataAll } = await supabase.from('prestadores').select('origem_tipo')
      const curadoriaCount = pDataAll?.filter(p => p.origem_tipo === 'curadoria_publica').length || 0
      const registradosCount = pDataAll?.filter(p => p.origem_tipo === 'registro_direto').length || 0

      // 3. Ranking de Categorias via Logs
      const { data: logCats } = await supabase.from('logs_atividades').select('entidade_id').eq('acao', 'FILTRO_CATEGORIA')
      const { data: categoriasNames } = await supabase.from('categorias').select('id, nome')
      
      const contagem = logCats?.reduce((acc, log) => {
        acc[log.entidade_id] = (acc[log.entidade_id] || 0) + 1
        return acc
      }, {})

      const ranking = Object.entries(contagem || {})
        .map(([id, total]) => ({
          nome: categoriasNames?.find(c => c.id === id)?.nome || 'Outros',
          total
        }))
        .sort((a, b) => b.total - a.total).slice(0, 4)

      // 4. Timeline (Últimas Atividades)
      const { data: pRecent } = await supabase.from('prestadores').select('nome, created_at, status').order('created_at', { ascending: false }).limit(3)
      const { data: lRecent } = await supabase.from('logs_atividades').select('acao, detalhes, created_at').in('acao', ['BUSCA_SEM_SUCESSO', 'DENUNCIA_PERFIL']).order('created_at', { ascending: false }).limit(3)

      const combinada = [
        ...(pRecent || []).map(item => ({ ...item, categoria: 'CADASTRO' })),
        ...(lRecent || []).map(item => ({ ...item, categoria: 'LOG', nome: item.acao }))
      ].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 5)

      setStats({ 
        cidades: cidades.count || 0, 
        anuncios: anuncios.count || 0, 
        prestadores: prestadores.count || 0, 
        logs: logs.count || 0,
        curadoria: curadoriaCount,
        registrados: registradosCount,
        topCategorias: ranking
      })
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
  }, [carregarDashboard])

  if (!mounted) return null

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-20 font-sans text-slate-800 px-2 sm:px-0 select-none">
      
      {/* HEADER */}
      <header className="flex items-center justify-between px-2 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 uppercase italic tracking-tighter leading-none">Console</h1>
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] mt-1 italic">Gestão e Inteligência de Londrina</p>
        </div>
        <button onClick={() => carregarDashboard(true)} className="w-11 h-11 bg-slate-900 rounded-2xl flex items-center justify-center text-white shadow-xl active:scale-90 transition-all">
          {refreshing ? '...' : '⚡'}
        </button>
      </header>

      {/* METRICAS DE STATUS DE BASE */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm flex items-center justify-between overflow-hidden relative">
          <div className="z-10">
             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Origem da Base</p>
             <div className="flex gap-6">
                <div>
                   <p className="text-2xl font-black text-slate-800 leading-none">{stats.curadoria}</p>
                   <p className="text-[8px] font-bold text-slate-400 uppercase">Curadoria</p>
                </div>
                <div>
                   <p className="text-2xl font-black text-blue-600 leading-none">{stats.registrados}</p>
                   <p className="text-[8px] font-bold text-blue-600 uppercase">Requeridos</p>
                </div>
             </div>
          </div>
          <Users size={60} className="text-slate-50 absolute -right-2 -bottom-2" />
        </div>

        <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm">
           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Categorias em Alta</p>
           <div className="flex flex-wrap gap-2">
              {stats.topCategorias.map((c, i) => (
                <div key={i} className="bg-blue-50 border border-blue-100 px-3 py-1.5 rounded-full flex items-center gap-2">
                   <span className="text-[10px] font-black text-blue-700 uppercase italic">{c.nome}</span>
                   <span className="text-[8px] font-black text-blue-400">{c.total}x</span>
                </div>
              ))}
           </div>
        </div>
      </section>

      {/* ESTATÍSTICAS RÁPIDAS */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatMini label="Cidades Ativas" valor={stats.cidades} cor="blue" />
        <StatMini label="Anúncios" valor={stats.anuncios} cor="emerald" />
        <StatMini label="Total Prestadores" valor={stats.prestadores} cor="slate" />
        <StatMini label="Logs Gerados" valor={stats.logs} cor="indigo" />
      </section>

      {/* LAYOUT PRINCIPAL: GRAFICO + FEED */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        {/* GRÁFICO (SIMULADO) */}
        <section className="lg:col-span-2 bg-white p-6 sm:p-8 rounded-[2rem] sm:rounded-[2.5rem] border border-slate-100 shadow-sm min-h-[320px] flex flex-col justify-between">
            <h2 className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Acessos por Dia (Londrina)</h2>
            <div className="flex items-end justify-between h-40 gap-2 px-1">
              {[40, 65, 45, 90, 60, 100, 80].map((h, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                  <motion.div initial={{ height: 0 }} animate={{ height: `${h}%` }} className={`w-full max-w-[35px] rounded-t-lg transition-all ${i === 5 ? 'bg-blue-600' : 'bg-slate-100'}`} />
                  <span className="text-[7px] font-black text-slate-300 uppercase italic">{['S','T','Q','Q','S','S','D'][i]}</span>
                </div>
              ))}
            </div>
        </section>

        {/* FEED REALTIME */}
        <section className="bg-slate-900 p-6 sm:p-8 rounded-[2rem] sm:rounded-[2.5rem] text-white flex flex-col h-[400px]">
          <h2 className="text-[9px] font-black text-blue-400 uppercase tracking-widest mb-6 italic">Live Stream</h2>
          <div className="space-y-3 flex-1 overflow-y-auto scrollbar-hide">
            {timeline.map((item, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5 group">
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-[9px] ${item.categoria === 'CADASTRO' ? 'bg-emerald-500' : 'bg-red-500'}`}>{item.categoria === 'CADASTRO' ? '👤' : '🚨'}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-[9px] font-black uppercase truncate tracking-tight">{item.nome?.replace(/_/g, ' ')}</p>
                  <p className="text-slate-500 text-[8px] font-bold uppercase italic">{item.categoria === 'CADASTRO' ? 'Novo Cadastro' : 'Alerta Auditoria'}</p>
                </div>
              </div>
            ))}
          </div>
          <Link href="/admin/logs" className="w-full mt-6 py-3 bg-white/5 border border-white/10 rounded-xl text-[8px] font-black uppercase text-center active:bg-white active:text-slate-900 transition-all">Monitoramento Completo</Link>
        </section>
      </div>

      {/* ATALHOS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 pt-6">
        <AtalhoMini href="/admin/moderacao" label="Moderação" icon="⚖️" color="orange" />
        <AtalhoMini href="/admin/anuncios" label="Anúncios" icon="💎" color="emerald" />
        <AtalhoMini href="/admin/logs" label="Analytics" icon="📈" color="blue" />
        <AtalhoMini href="/admin/geografia" label="Geografia" icon="📍" color="indigo" />
      </div>
    </div>
  )
}

// Subcomponentes mantidos (StatMini e AtalhoMini) conforme sua estrutura original.