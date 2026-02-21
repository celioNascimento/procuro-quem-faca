'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function PaginaEscolha() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 0);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const checarStatusExistente = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      const [{ data: profile }, { data: prestador }] = await Promise.all([
        supabase.from('profiles').select('role').eq('id', user.id).maybeSingle(),
        supabase.from('prestadores').select('categoria_id').eq('user_id', user.id).maybeSingle()
      ])

      if (profile?.role === 'prestador' && !prestador?.categoria_id) {
        router.push('/cadastro')
      } else if (profile?.role === 'cliente' || (profile?.role === 'prestador' && prestador?.categoria_id)) {
        router.push('/dashboard') 
      } else {
        setLoading(false)
      }
    }
    checarStatusExistente()
  }, [router])

  const selecionarRole = async (role) => {
    if (loading) return
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()

      await supabase.from('logs_atividades').insert({
        acao: 'ROLE_SELECTION_COMPLETED',
        entidade_tipo: 'autenticacao',
        detalhes: { role, platform: 'web' }
      })

      await supabase.from('profiles').upsert({
        id: user.id,
        role,
        updated_at: new Date()
      })

      router.push(role === 'prestador' ? '/cadastro' : '/dashboard')
      
    } catch (err) {
      console.error('Erro ao definir papel:', err)
      setLoading(false)
    }
  }

  if (!mounted) return null

  return (
    <main className="min-h-screen bg-[#FDFDFD] flex flex-col items-center justify-center px-6">
      {loading && (
        <div className="fixed inset-0 bg-white/90 backdrop-blur-md z-50 flex items-center justify-center animate-in fade-in duration-300">
          <div className="flex flex-col items-center gap-4">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-blue-600">Sincronizando perfil</p>
          </div>
        </div>
      )}

      <div className="w-full max-w-[440px] space-y-12">
        <div className="flex flex-col items-center space-y-8 text-center">
          <img src="/logo.png" alt="Logo" className="h-10 md:h-12 w-auto opacity-90" />
          <div className="space-y-3">
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">
              Como você quer usar o <span className="text-blue-600">PQF</span>?
            </h1>
            <p className="text-slate-400 text-sm md:text-base font-medium">Escolha seu perfil para uma experiência personalizada.</p>
          </div>
        </div>

        <div className="space-y-4">
          <button
            onClick={() => selecionarRole('cliente')}
            disabled={loading}
            className="w-full group p-6 bg-white border border-slate-100 hover:border-blue-200 hover:shadow-xl hover:shadow-blue-50/50 rounded-[2.5rem] transition-all duration-300 text-left flex items-center gap-5 shadow-sm"
          >
            <div className="w-14 h-14 bg-slate-50 rounded-[1.5rem] flex items-center justify-center text-2xl group-hover:scale-110 group-hover:bg-blue-50 transition-all duration-300">🔍</div>
            <div className="flex-1">
              <h2 className="text-[15px] font-bold text-slate-800 leading-none">Quero Contratar</h2>
              <p className="text-[11px] text-slate-400 font-bold uppercase mt-2 tracking-widest">Busco profissionais qualificados</p>
            </div>
          </button>

          <button
            onClick={() => selecionarRole('prestador')}
            disabled={loading}
            className="w-full group p-6 bg-blue-600 hover:bg-blue-700 hover:shadow-2xl hover:shadow-blue-200 rounded-[2.5rem] transition-all duration-300 text-left flex items-center gap-5 shadow-xl shadow-blue-100"
          >
            <div className="w-14 h-14 bg-white/10 rounded-[1.5rem] flex items-center justify-center text-2xl group-hover:scale-110 transition-all duration-300">🛠️</div>
            <div className="flex-1">
              <h2 className="text-[15px] font-bold text-white leading-none">Quero Trabalhar</h2>
              <p className="text-[11px] text-blue-100 font-bold uppercase mt-2 tracking-widest">Quero oferecer meus serviços</p>
            </div>
          </button>
        </div>
      </div>
    </main>
  )
}