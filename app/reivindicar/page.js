'use client'
import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Header from '@/components/Header'

function ReivindicarConteudo() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const prestadorId = searchParams.get('id')
  const prestadorNome = searchParams.get('nome')

  const [loading, setLoading] = useState(false)
  const [user, setUser] = useState(null)

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setUser(session?.user || null)
    }
    checkSession()
  }, [])

  const handleReivindicar = async () => {
    setLoading(true)
    
    // Feedback Tátil
    if (navigator.vibrate) navigator.vibrate([30, 50, 30])

    // LÓGICA CORRIGIDA: 
    // Não alteramos nada no banco aqui. 
    // Apenas direcionamos para o cadastro que agora lida com Email/Senha e Vínculo.
    router.push(`/cadastro?reivindicar=${prestadorId}`)
  }

  return (
    <div className="max-w-xl mx-auto px-6 py-10 text-center animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-[2rem] flex items-center justify-center mx-auto mb-8 text-3xl shadow-inner border border-blue-100/50">
        🤝
      </div>
      
      <h1 className="text-3xl font-black text-slate-900 uppercase italic tracking-tighter leading-none mb-4">
        Assumir Perfil<span className="text-blue-600">.</span>
      </h1>
      
      <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] mb-10 leading-relaxed">
        Você está assumindo a gestão de: <br/>
        <span className="text-blue-600 text-sm">{prestadorNome}</span>
      </p>

      <div className="bg-white border border-slate-100 p-8 rounded-[2.5rem] shadow-sm mb-10 text-left space-y-5">
        <h4 className="font-black text-[10px] text-slate-400 uppercase tracking-widest italic border-b border-slate-50 pb-2">Vantagens de Membro</h4>
        <ul className="space-y-4">
          <li className="flex items-center gap-4 text-[11px] font-black text-slate-600 uppercase italic">
            <div className="w-6 h-6 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600 shrink-0 font-black">✓</div>
            Edição total de fotos e biografia
          </li>
          <li className="flex items-center gap-4 text-[11px] font-black text-slate-600 uppercase italic">
            <div className="w-6 h-6 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600 shrink-0 font-black">✓</div>
            Prioridade no ranking de buscas
          </li>
        </ul>
      </div>

      <button
        onClick={handleReivindicar}
        disabled={loading}
        className="w-full py-6 bg-blue-600 text-white rounded-[2rem] font-black uppercase text-[11px] tracking-[0.2em] shadow-xl shadow-blue-100 hover:bg-blue-700 transition-all active:scale-95 disabled:opacity-50 italic"
      >
        {loading ? 'Preparando...' : 'Iniciar Reivindicação'}
      </button>

      <p className="mt-8 text-[9px] font-black text-slate-400 uppercase italic tracking-widest leading-relaxed">
        * Você poderá criar seu acesso e revisar <br/> os dados na próxima etapa.
      </p>
    </div>
  )
}

export default function PaginaReivindicar() {
  return (
    <main className="min-h-screen bg-[#FDFDFD] font-sans pt-32">
      <Header href="/" />
      <Suspense fallback={<div className="text-center p-20 font-black text-slate-300 animate-pulse uppercase tracking-widest italic text-[10px]">Sincronizando dados...</div>}>
        <ReivindicarConteudo />
      </Suspense>
    </main>
  )
}