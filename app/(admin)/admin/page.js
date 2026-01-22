'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

export default function AdminDashboard() {
  // Adicionei 'anuncios' e 'prestadores' para o dashboard ficar mais completo
  const [stats, setStats] = useState({ cidades: 0, habilidades: 0, anuncios: 0, prestadores: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function carregarStats() {
      // Ajustado para os nomes reais das tabelas que usamos hoje
      const [cidades, habilidades, anuncios, prestadores] = await Promise.all([
        supabase.from('cidades').select('*', { count: 'exact', head: true }),
        supabase.from('habilidades').select('*', { count: 'exact', head: true }),
        supabase.from('anuncios').select('*', { count: 'exact', head: true }),
        supabase.from('prestadores').select('*', { count: 'exact', head: true })
      ])

      setStats({
        cidades: cidades.count || 0,
        habilidades: habilidades.count || 0,
        anuncios: anuncios.count || 0,
        prestadores: prestadores.count || 0
      })
      setLoading(false)
    }
    carregarStats()
  }, [])

  const atalhos = [
    { nome: 'Gestão de Geografia', desc: 'Estados e Cidades', href: '/admin/geografia', icon: '📍', cor: 'bg-blue-500' },
    { nome: 'Habilidades & Tags', desc: 'Profissões do sistema', href: '/admin/habilidades', icon: '🛠️', cor: 'bg-purple-500' },
    { nome: 'Anúncios VIP', desc: 'Gerenciar publicidade', href: '/admin/anuncios', icon: '💰', cor: 'bg-green-500' }, // Ajustado para /anuncio
    { nome: 'Moderação', desc: 'Aprovar Prestadores', href: '/admin/moderacao', icon: '⚖️', cor: 'bg-orange-500' },
  ]

  return (
    <div className="max-w-7xl mx-auto px-6 space-y-10">
      
      {/* BOAS VINDAS */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-5xl font-black text-slate-900 tracking-tighter uppercase leading-none">Painel de Controle</h1>
          <p className="text-slate-500 font-bold uppercase text-[10px] tracking-[0.3em] mt-3">Operação Londrina</p>
        </div>
        <div className="bg-white px-6 py-4 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
          <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest text-nowrap">Sistema Ativo</span>
        </div>
      </header>

      {/* CARDS DE ESTATÍSTICAS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard label="Cidades" valor={stats.cidades} cor="text-blue-600" />
        <StatCard label="Habilidades" valor={stats.habilidades} cor="text-purple-600" />
        <StatCard label="Anúncios" valor={stats.anuncios} cor="text-green-600" />
        <StatCard label="Prestadores" valor={stats.prestadores} cor="text-orange-600" />
      </div>

      {/* GRADE DE ATALHOS */}
      <div className="space-y-6">
        <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] text-center lg:text-left">Ferramentas de Gestão</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {atalhos.map((item) => (
            <Link key={item.nome} href={item.href} className="group bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-2xl hover:border-blue-200 transition-all">
              <div className={`${item.cor} w-14 h-14 rounded-2xl flex items-center justify-center text-2xl mb-6 shadow-lg shadow-inner group-hover:rotate-6 transition-transform`}>
                {item.icon}
              </div>
              <h3 className="font-black text-slate-900 uppercase text-xs tracking-tight">{item.nome}</h3>
              <p className="text-slate-400 text-[10px] font-bold mt-2 leading-relaxed">{item.desc}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}

function StatCard({ label, valor, cor }) {
  return (
    <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm flex flex-col items-center lg:items-start transition-all hover:scale-[1.02]">
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">{label}</p>
      <p className={`text-6xl font-black ${cor} tracking-tighter`}>{valor}</p>
    </div>
  )
}