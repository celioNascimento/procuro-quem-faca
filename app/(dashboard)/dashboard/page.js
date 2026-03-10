'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import EditarPerfilTab from '@/components/dashboard/EditarPerfilTab'
import PortfolioDashboardTab from '@/components/dashboard/PortfolioDashboardTab'
import { Lock } from 'lucide-react'

export default function PerfilPage() {
  const [abaAtiva, setAbaAtiva] = useState('perfil')
  const [cadastroCompleto, setCadastroCompleto] = useState(false)
  const [validando, setValidando] = useState(true)

  useEffect(() => {
    async function verificarPerfil() {
      const { data: { session } } = await supabase.auth.getSession()
      const user = session?.user
      if (user?.id) {
        const { data: prestador } = await supabase
          .from('prestadores')
          .select('whatsapp, categoria_id')
          .eq('user_id', user.id)
          .maybeSingle()

        if (prestador?.whatsapp && prestador?.categoria_id) {
          setCadastroCompleto(true)
        } else {
          setAbaAtiva('perfil')
          setCadastroCompleto(false)
        }
      }
      setValidando(false)
    }
    verificarPerfil()
  }, [])

  return (
    <div className="bg-[#F8FAFC] min-h-screen">
      {/* CORREÇÃO FINAL: pt-1 no mobile e pt-4 no desktop. 
          Isso aproxima os botões de aba ao limite máximo da logo vazada. */}
      <main className="max-w-5xl mx-auto px-5 md:px-8 pt-1 md:pt-4 pb-8">
        
        <div className="flex w-full md:w-fit bg-slate-100/60 p-1.5 rounded-[2.5rem] border border-slate-100 mb-6 md:mb-8 overflow-x-auto custom-scrollbar">
          <button 
            onClick={() => setAbaAtiva('perfil')}
            className={`flex-1 md:flex-none px-6 py-3.5 md:py-4 rounded-[2rem] text-[12px] md:text-[13px] font-semibold transition-all duration-300 whitespace-nowrap ${
              abaAtiva === 'perfil' 
                ? 'bg-white text-blue-600 shadow-sm scale-[1.01]' 
                : 'text-slate-500 hover:bg-white/50'
            }`}
          >
            Dados Profissionais
          </button>
          
          <button 
            disabled={!cadastroCompleto || validando}
            onClick={() => setAbaAtiva('portfolio')}
            className={`flex-1 md:flex-none px-6 py-3.5 md:py-4 rounded-[2rem] text-[12px] md:text-[13px] font-semibold transition-all duration-300 whitespace-nowrap flex items-center justify-center gap-2 ${
              abaAtiva === 'portfolio' 
                ? 'bg-white text-blue-600 shadow-sm scale-[1.01]' 
                : !cadastroCompleto 
                  ? 'text-slate-400 cursor-not-allowed bg-slate-50/50 opacity-70' 
                  : 'text-slate-500 hover:bg-white/50'
            }`}
          >
            {!cadastroCompleto && <Lock size={14} className="text-slate-400" />}
            Meu Portfólio (Fotos)
          </button>
        </div>

        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          {validando ? (
            <div className="h-64 flex flex-col items-center justify-center gap-4">
              <div className="w-10 h-10 border-[4px] border-slate-100 border-t-blue-600 rounded-full animate-spin" />
              <p className="text-[12px] font-medium text-slate-400">Verificando credenciais...</p>
            </div>
          ) : (
            abaAtiva === 'perfil' ? <EditarPerfilTab /> : <PortfolioDashboardTab />
          )}
        </div>
      </main>
    </div>
  )
}
