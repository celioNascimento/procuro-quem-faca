'use client'
import { useState } from 'react'
import EditarPerfilTab from '@/components/dashboard/EditarPerfilTab'
import PortfolioDashboardTab from '@/components/dashboard/PortfolioDashboardTab'

export default function PerfilPage() {
  const [abaAtiva, setAbaAtiva] = useState('perfil') // 'perfil' ou 'portfolio'

  return (
    <div className="bg-[#F8FAFC] min-h-screen">
      <main className="max-w-5xl mx-auto p-4 md:p-8">
        
        {/* Navegação de Abas Premium */}
        <div className="flex gap-4 mb-8 bg-white p-2 rounded-[2rem] border border-slate-100 shadow-sm inline-flex">
          <button 
            onClick={() => setAbaAtiva('perfil')}
            className={`px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${abaAtiva === 'perfil' ? 'bg-blue-600 text-white shadow-lg shadow-blue-100' : 'text-slate-400 hover:bg-slate-50'}`}
          >
            Dados Profissionais
          </button>
          <button 
            onClick={() => setAbaAtiva('portfolio')}
            className={`px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${abaAtiva === 'portfolio' ? 'bg-blue-600 text-white shadow-lg shadow-blue-100' : 'text-slate-400 hover:bg-slate-50'}`}
          >
            Meu Portfólio (Fotos)
          </button>
        </div>

        {/* Renderização Condicional */}
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          {abaAtiva === 'perfil' ? <EditarPerfilTab /> : <PortfolioDashboardTab />}
        </div>
        
      </main>
    </div>
  )
}