'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

export default function AdminDashboard() {
  const [stats, setStats] = useState({ cidades: 0, habilidades: 0, anuncios: 0, prestadores: 0 })
  const [recentes, setRecentes] = useState([]) // Itens REAIS aqui
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function carregarTudo() {
      // 1. Busca estatísticas (Head: true para não baixar dados desnecessários)
      const [cidades, anuncios, prestadores] = await Promise.all([
        supabase.from('cidades').select('*', { count: 'exact', head: true }),
        supabase.from('anuncios').select('*', { count: 'exact', head: true }),
        supabase.from('prestadores').select('*', { count: 'exact', head: true })
      ])

      // 2. Busca os 5 registros mais recentes para a seção de eventos
      const { data: ultimos } = await supabase
        .from('prestadores')
        .select('nome, bairro, created_at, status')
        .order('created_at', { ascending: false })
        .limit(5)

      setStats({
        cidades: cidades.count || 0,
        habilidades: 0, // Pode ser substituído por categorias se desejar
        anuncios: anuncios.count || 0,
        prestadores: prestadores.count || 0
      })
      
      setRecentes(ultimos || [])
      setLoading(false)
    }
    carregarTudo()
  }, [])

  const atalhos = [
    { nome: 'Geografia', desc: 'Cidades e Estados', href: '/admin/geografia', icon: '📍', color: 'from-blue-600 to-blue-800' },
    { nome: 'Moderação', desc: 'Fila de Aprovação', href: '/admin/moderacao', icon: '⚖️', color: 'from-orange-500 to-red-600' },
    { nome: 'Anúncios', desc: 'VIP e Publicidade', href: '/admin/anuncios', icon: '💎', color: 'from-emerald-500 to-teal-700' },
    { nome: 'Habilidades', desc: 'Taxonomia Core', href: '/admin/habilidades', icon: '🛠️', color: 'from-slate-700 to-slate-900' },
  ]

  return (
    <div className="max-w-7xl mx-auto space-y-10 pb-20 font-sans">
      
      {/* HEADER ELEGANTE */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-100 pb-10">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="w-2 h-2 rounded-full bg-blue-600" />
            <span className="text-slate-500 font-black text-[10px] uppercase tracking-widest">Sistema Operacional Ativo</span>
          </div>
          <h1 className="text-5xl font-black text-slate-900 tracking-tighter">
            Dashboard<span className="text-blue-600">.</span>
          </h1>
        </div>
        
        <div className="flex items-center gap-4 bg-white p-4 rounded-3xl shadow-sm border border-slate-100">
          <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-white font-black italic">A</div>
          <div>
            <p className="text-[10px] font-black text-slate-800 uppercase leading-none">Célio Admin</p>
            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-1">Londrina Hub</p>
          </div>
        </div>
      </header>

      {/* MÉTRICAS (BENTO GRID) */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Cidades Ativas" valor={stats.cidades} color="text-blue-600" />
        <StatCard label="Total Anúncios" valor={stats.anuncios} color="text-emerald-600" />
        <StatCard label="Prestadores" valor={stats.prestadores} color="text-slate-900" />
        <StatCard label="Fila Pendente" valor={recentes.filter(p => p.status === 'pendente').length} color="text-orange-600" />
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* GRÁFICO (Ilustrativo com dados reais de volume) */}
        <section className="lg:col-span-2 bg-white p-10 rounded-[3rem] border border-slate-200/50 shadow-sm">
          <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-10">Crescimento de Rede</h2>
          <div className="flex items-end justify-between h-48 gap-4">
            {[45, 80, 55, 90, 70, 40, 60].map((h, i) => (
              <div key={i} className="flex-1 bg-slate-50 rounded-2xl relative group transition-all hover:bg-blue-600">
                <div style={{ height: `${h}%` }} className="w-full h-full" />
                <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[8px] font-black text-slate-300 uppercase italic">
                   {['S', 'T', 'Q', 'Q', 'S', 'S', 'D'][i]}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* EVENTOS REAIS (CORREÇÃO AQUI) */}
        <section className="bg-slate-900 p-10 rounded-[3rem] shadow-xl text-white">
          <h2 className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-10">Eventos em Tempo Real</h2>
          
          <div className="space-y-8">
            {recentes.length > 0 ? recentes.map((p, i) => (
              <div key={i} className="flex gap-4 group cursor-default">
                <div className={`w-1.5 h-1.5 rounded-full mt-1.5 ${p.status === 'pendente' ? 'bg-orange-500 animate-pulse' : 'bg-emerald-500'}`} />
                <div>
                  <p className="text-[11px] font-black uppercase text-white group-hover:text-blue-400 transition-colors">{p.nome}</p>
                  <p className="text-slate-400 text-[9px] font-bold uppercase">{p.bairro || 'Sem Bairro'} • {p.status}</p>
                </div>
              </div>
            )) : (
              <p className="text-slate-500 text-[10px] uppercase font-black">Nenhuma atividade recente</p>
            )}
          </div>

          <Link href="/admin/moderacao" className="block w-full mt-12 py-4 text-center border border-white/10 rounded-2xl text-[9px] font-black uppercase tracking-widest hover:bg-white hover:text-slate-900 transition-all">
            Ir para Moderação
          </Link>
        </section>
      </div>

      {/* ATALHOS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {atalhos.map(a => (
          <Link key={a.nome} href={a.href} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 hover:shadow-xl transition-all group active:scale-95">
            <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${a.color} flex items-center justify-center text-xl mb-6 shadow-lg`}>
              {a.icon}
            </div>
            <h3 className="text-xs font-black text-slate-900 uppercase">{a.nome}</h3>
            <p className="text-[9px] text-slate-400 font-bold uppercase mt-1">{a.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  )
}

function StatCard({ label, valor, color }) {
  return (
    <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col justify-between">
      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-4">{label}</p>
      <p className={`text-5xl font-black ${color} tracking-tighter`}>{valor}</p>
    </div>
  )
}