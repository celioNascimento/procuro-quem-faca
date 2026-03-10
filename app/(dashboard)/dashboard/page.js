'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import EditarPerfilTab from '@/components/dashboard/EditarPerfilTab'
import PortfolioDashboardTab from '@/components/dashboard/PortfolioDashboardTab'
import { Lock, UserCircle2, Images } from 'lucide-react'

export default function PerfilPage() {
  const [abaAtiva, setAbaAtiva] = useState('perfil')
  const [cadastroCompleto, setCadastroCompleto] = useState(false)
  const [validando, setValidando] = useState(true)

  useEffect(() => {
    async function verificarPerfil() {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        const userId = session?.user?.id
        if (!userId) { setValidando(false); return }

        const { data: prestador } = await supabase
          .from('prestadores')
          .select('nome, whatsapp, categoria_id, status')
          .eq('user_id', userId)
          .maybeSingle()

        const completo = !!(
          prestador?.nome?.trim() &&
          prestador?.whatsapp &&
          prestador?.categoria_id &&
          prestador?.status === 'ativo'
        )
        setCadastroCompleto(completo)
        if (!completo) setAbaAtiva('perfil')
      } catch {
        setCadastroCompleto(false)
      } finally {
        setValidando(false)
      }
    }
    verificarPerfil()
  }, [])

  const abas = [
    { id: 'perfil',    label: 'Dados Profissionais', icon: <UserCircle2 size={14} />, bloqueado: false },
    { id: 'portfolio', label: 'Meu Portfólio',       icon: <Images size={14} />,      bloqueado: !cadastroCompleto },
  ]

  return (
    <div className="bg-[#F8FAFC] min-h-screen">
      <main className="max-w-5xl mx-auto pb-8">

        {/* ── Seletor de abas — com ícones e visual mais rico ── */}
        <div className="px-5 md:px-8 pt-6 pb-4 border-b border-slate-100 bg-white sticky top-16 md:top-20 z-40">
          <div className="flex gap-1 w-full md:w-fit">
            {abas.map(aba => (
              <button
                key={aba.id}
                disabled={aba.bloqueado || validando}
                onClick={() => setAbaAtiva(aba.id)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-[11px] font-black uppercase tracking-widest transition-all duration-200 whitespace-nowrap ${
                  abaAtiva === aba.id
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-100'
                    : aba.bloqueado
                      ? 'text-slate-300 cursor-not-allowed opacity-60'
                      : 'text-slate-500 hover:bg-slate-100'
                }`}
              >
                {aba.bloqueado && !validando ? <Lock size={11} /> : aba.icon}
                {aba.label}
                {aba.bloqueado && !validando && (
                  <span className="text-[8px] font-black bg-slate-100 text-slate-400 px-1.5 py-0.5 rounded-full uppercase tracking-wider">
                    Complete o perfil
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* ── Conteúdo ── */}
        <div className="animate-in fade-in duration-300 pt-6">
          {validando ? (
            <div className="h-64 flex flex-col items-center justify-center gap-4">
              <div className="w-10 h-10 border-[3px] border-slate-100 border-t-blue-600 rounded-full animate-spin" />
              <p className="text-[11px] font-bold text-slate-300 uppercase tracking-widest">Verificando...</p>
            </div>
          ) : (
            abaAtiva === 'perfil' ? <EditarPerfilTab /> : <PortfolioDashboardTab />
          )}
        </div>
      </main>
    </div>
  )
}