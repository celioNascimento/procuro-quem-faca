'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import EditarPerfilTab from '@/components/dashboard/EditarPerfilTab'
import PortfolioDashboardTab from '@/components/dashboard/PortfolioDashboardTab'
import { Lock } from 'lucide-react'

export default function PerfilPage() {
  const [abaAtiva, setAbaAtiva] = useState('perfil') // 'perfil' ou 'portfolio'
  const [cadastroCompleto, setCadastroCompleto] = useState(false)
  const [validando, setValidando] = useState(true)

  useEffect(() => {
    async function verificarPerfil() {
      // Usamos getSession para garantir a recuperação imediata do ID do usuário
      const { data: { session } } = await supabase.auth.getSession()
      const user = session?.user

      if (user?.id) {
        // CORREÇÃO CIRÚRGICA: Filtramos por 'user_id' para evitar o erro 400
        // maybeSingle() evita erros caso o perfil ainda não exista no banco
        const { data: prestador } = await supabase
          .from('prestadores')
          .select('whatsapp, categoria_id')
          .eq('user_id', user.id)
          .maybeSingle()

        if (prestador?.whatsapp && prestador?.categoria_id) {
          setCadastroCompleto(true)
        } else {
          setAbaAtiva('perfil') // Força a aba perfil se incompleto
          setCadastroCompleto(false)
        }
      }
      setValidando(false)
    }
    verificarPerfil()
  }, [])

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
            disabled={!cadastroCompleto || validando}
            onClick={() => setAbaAtiva('portfolio')}
            className={`px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${
              abaAtiva === 'portfolio' 
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-100' 
                : !cadastroCompleto 
                  ? 'text-slate-200 cursor-not-allowed bg-slate-50/50' 
                  : 'text-slate-400 hover:bg-slate-50'
            }`}
          >
            {!cadastroCompleto && <Lock size={12} className="text-slate-300" />}
            Meu Portfólio (Fotos)
          </button>
        </div>

        {/* Renderização Condicional */}
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          {validando ? (
            <div className="h-64 flex items-center justify-center">
              <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            abaAtiva === 'perfil' ? <EditarPerfilTab /> : <PortfolioDashboardTab />
          )}
        </div>
        
      </main>
    </div>
  )
}