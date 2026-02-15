'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function PaginaEscolha() {
  const router = useRouter()
  const [loading, setLoading] = useState(true) // Começa em loading para checar status
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    // Use um requestAnimationFrame ou apenas mova para garantir o ciclo de vida
    const timer = setTimeout(() => setMounted(true), 0);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {

    // Trava de segurança: Se o usuário já passou por aqui, 
    // mas não completou o cadastro, manda ele de volta pro lugar certo.
    const checarStatusExistente = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .maybeSingle()

      const { data: prestador } = await supabase
        .from('prestadores')
        .select('categoria_id')
        .eq('user_id', user.id)
        .maybeSingle()

      // Se ele já escolheu ser prestador mas não tem categoria, manda pro cadastro direto
      if (profile?.role === 'prestador' && !prestador?.categoria_id) {
        router.push('/cadastro')
      } else if (profile?.role === 'cliente') {
        router.push('/')
      } else {
        setLoading(false) // Deixa ele escolher se for realmente novo
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

      // Upsert no perfil
      await supabase.from('profiles').upsert({
        id: user.id,
        role,
        updated_at: new Date()
      })

      // Se escolheu prestador, precisamos garantir que ele passe pelo aceite de termos no /cadastro
      router.push(role === 'prestador' ? '/cadastro' : '/')
    } catch (err) {
      console.error('Erro ao definir papel:', err)
      setLoading(false)
    }
  }

  if (!mounted) return null

  return (
    <main className="min-h-screen bg-[#FDFDFD] flex flex-col items-center justify-center px-6">
      {/* O Loader agora cobre a checagem inicial também */}
      {loading && (
        <div className="fixed inset-0 bg-white/80 backdrop-blur-sm z-50 flex items-center justify-center animate-in fade-in duration-300">
          <div className="flex flex-col items-center gap-4">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-[10px] font-black uppercase tracking-widest text-blue-600">Sincronizando perfil...</p>
          </div>
        </div>
      )}

      <div className="w-full max-w-[440px] space-y-10">
        <div className="flex flex-col items-center space-y-6 text-center">
          <img src="/logo.png" alt="Logo" className="h-12 w-auto opacity-90" />
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Como você quer usar o <span className="text-blue-600 italic font-black">PQF</span>?
            </h1>
            <p className="text-slate-400 text-sm font-medium">
              Escolha seu perfil para uma experiência personalizada.
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <button
            onClick={() => selecionarRole('cliente')}
            disabled={loading}
            className="w-full group p-6 bg-white border-2 border-slate-100 hover:border-blue-100 hover:bg-blue-50/30 rounded-[2.5rem] transition-all duration-300 text-left flex items-center gap-5"
          >
            <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center text-2xl group-hover:scale-110 group-hover:bg-white transition-all duration-300 shadow-sm">🔍</div>
            <div className="flex-1">
              <h2 className="text-base font-black uppercase italic text-slate-800 leading-none">Sou Cliente</h2>
              <p className="text-xs text-slate-400 font-bold uppercase mt-1 tracking-tighter">Busco profissionais qualificados</p>
            </div>
            <div className="text-slate-300 group-hover:text-blue-500 transition-colors mr-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 5l7 7-7 7" /></svg>
            </div>
          </button>

          <button
            onClick={() => selecionarRole('prestador')}
            disabled={loading}
            className="w-full group p-6 bg-blue-600 hover:bg-blue-700 rounded-[2.5rem] transition-all duration-300 text-left flex items-center gap-5 shadow-xl shadow-blue-100"
          >
            <div className="w-14 h-14 bg-blue-500 rounded-2xl flex items-center justify-center text-2xl group-hover:scale-110 transition-all duration-300">🛠️</div>
            <div className="flex-1">
              <h2 className="text-base font-black uppercase italic text-white leading-none">Sou Profissional</h2>
              <p className="text-xs text-blue-100 font-bold uppercase mt-1 tracking-tighter">Quero oferecer meus serviços</p>
            </div>
            <div className="text-blue-300 group-hover:text-white transition-colors mr-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 5l7 7-7 7" /></svg>
            </div>
          </button>
        </div>

        <div className="pt-4">
          <button
            onClick={() => router.push('/')}
            className="w-full text-center text-[10px] font-black uppercase tracking-[0.2em] text-slate-300 hover:text-blue-600 transition-colors italic"
          >
            Pular esta etapa por enquanto
          </button>
        </div>
      </div>
    </main>
  )
}