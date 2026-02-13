// app/auth/escolha/page.js
'use client'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function PaginaEscolha() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  // Segue o seu padrão de registro de log
  const registrarLogEscolha = async (roleSelecionada) => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      await supabase.from('logs_atividades').insert({
        acao: 'DEFINICAO_ROLE_POS_GOOGLE',
        entidade_tipo: 'autenticacao',
        usuario_id: session?.user?.id,
        detalhes: { 
          role: roleSelecionada,
          email: session?.user?.email,
          timestamp: new Date().toISOString()
        }
      })
    } catch (err) {
      console.error('Falha ao registrar log de escolha:', err)
    }
  }

  const finalizar = async (role) => {
    if (loading) return
    setLoading(true)
    
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      // 1. Registra a intenção no log primeiro
      await registrarLogEscolha(role)

      // 2. Atualiza o perfil no banco
      const { error } = await supabase
        .from('profiles')
        .update({ role, updated_at: new Date() })
        .eq('id', user.id)

      if (error) throw error

      // 3. Redireciona cirurgicamente
      if (role === 'prestador') {
        router.push('/cadastro')
      } else {
        router.push('/')
      }
    } catch (err) {
      console.error('Erro ao salvar escolha:', err)
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-6 font-sans antialiased">
      <div className="w-full max-w-xl text-center space-y-12">
        <div className="space-y-3">
          <h1 className="text-4xl font-black text-slate-800 italic uppercase tracking-tighter leading-none">
            Falta só um passo
          </h1>
          <p className="text-slate-400 font-bold text-[10px] uppercase tracking-[0.3em]">
            Como você deseja utilizar a plataforma?
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Opção Cliente */}
          <button 
            onClick={() => finalizar('cliente')}
            disabled={loading}
            className="group p-10 bg-white rounded-[2.5rem] border-2 border-slate-100 hover:border-blue-500 hover:shadow-2xl hover:shadow-blue-100 transition-all duration-300 flex flex-col items-center"
          >
            <span className="text-5xl mb-6 block group-hover:scale-110 transition-transform duration-300">🔍</span>
            <h2 className="font-black text-slate-800 uppercase italic text-lg leading-none">Sou Cliente</h2>
            <p className="text-slate-400 text-[10px] font-bold mt-2 uppercase tracking-tighter">Busco serviços</p>
          </button>

          {/* Opção Prestador */}
          <button 
            onClick={() => finalizar('prestador')}
            disabled={loading}
            className="group p-10 bg-blue-600 rounded-[2.5rem] border-2 border-blue-600 hover:shadow-2xl hover:shadow-blue-200 transition-all duration-300 flex flex-col items-center"
          >
            <span className="text-5xl mb-6 block group-hover:scale-110 transition-transform duration-300">🛠️</span>
            <h2 className="font-black text-white uppercase italic text-lg leading-none">Sou Profissional</h2>
            <p className="text-blue-200 text-[10px] font-bold mt-2 uppercase tracking-tighter">Quero trabalhar</p>
          </button>
        </div>

        {loading && (
          <div className="flex justify-center animate-in fade-in">
            <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>
    </main>
  )
}