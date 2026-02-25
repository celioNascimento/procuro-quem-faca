'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Users, MousePointer2, PieChart, TrendingUp } from 'lucide-react'

export default function AdminStatsTab() {
  const [stats, setStats] = useState({
    curadoria: 0,
    registrados: 0,
    topCategorias: [],
    topPrestadores: []
  })

  useEffect(() => {
    async function carregarDados() {
      // 1. Contagem de Origem
      const { data: pData } = await supabase
        .from('prestadores')
        .select('origem_tipo')

      const curadoria = pData?.filter(p => p.origem_tipo === 'curadoria_publica').length || 0
      const registrados = pData?.filter(p => p.origem_tipo === 'registro_direto').length || 0

      // 2. Top Prestadores por Cliques (campo cliques_whatsapp)
      const { data: topP } = await supabase
        .from('prestadores')
        .select('nome, cliques_whatsapp')
        .order('cliques_whatsapp', { ascending: false })
        .limit(5)

      setStats(prev => ({ ...prev, curadoria, registrados, topPrestadores: topP || [] }))
    }
    carregarDados()
  }, [])

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* CARD 01: ORIGEM DOS DADOS */}
      <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl"><Users size={20}/></div>
          <h3 className="font-bold text-slate-800">Origem da Base</h3>
        </div>
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-[13px] text-slate-500 font-medium">Curadoria Pública</span>
            <span className="text-lg font-black text-blue-600">{stats.curadoria}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-[13px] text-slate-500 font-medium">Perfis Requeridos</span>
            <span className="text-lg font-black text-green-600">{stats.registrados}</span>
          </div>
        </div>
      </div>

      {/* CARD 02: TOP PRESTADORES (CLIQUES) */}
      <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-orange-50 text-orange-600 rounded-2xl"><TrendingUp size={20}/></div>
          <h3 className="font-bold text-slate-800">Top Conversão (WhatsApp)</h3>
        </div>
        <div className="space-y-3">
          {stats.topPrestadores.map((p, i) => (
            <div key={i} className="flex justify-between text-[12px] border-b border-slate-50 pb-2">
              <span className="font-semibold text-slate-700">{p.nome}</span>
              <span className="text-slate-400">{p.cliques_whatsapp} cliques</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}