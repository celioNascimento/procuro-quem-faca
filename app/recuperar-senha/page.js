'use client'
import { useState, useEffect } from 'react' // Adicionado useEffect
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function NovaSenha() {
  const [senha, setSenha] = useState('')
  const [confirmarSenha, setConfirmarSenha] = useState('')
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  // Sincroniza a sessão assim que a página carrega
  useEffect(() => {
    supabase.auth.getSession()
  }, [])

  async function handleSubmit(e) {
    e.preventDefault()
    
    if (senha !== confirmarSenha) {
      setStatus('⚠️ As senhas não coincidem')
      return
    }
    if (senha.length < 6) {
      setStatus('⚠️ A senha deve ter no mínimo 6 caracteres')
      return
    }

    setLoading(true)
    setStatus('Verificando conexão...')

    try {
      // Força a atualização da sessão antes de tentar o update
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()

      if (sessionError || !session) {
        setStatus('❌ Erro: Sessão não encontrada. Tente o link novamente.')
        setLoading(false)
        return
      }

      setStatus('Atualizando senha...')

      const { error } = await supabase.auth.updateUser({
        password: senha
      })

      if (error) {
        setStatus(`❌ Erro: ${error.message}`)
        setLoading(false)
      } else {
        setStatus('✅ SENHA ATUALIZADA!')
        window.location.hash = "" 
        setTimeout(() => router.push('/login'), 2000)
      }
    } catch (err) {
      setStatus('❌ Erro inesperado ao processar.')
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-6 font-sans">
      <div className="w-full max-w-md">
        <header className="mb-8 text-center">
          <img src="/logo.png" alt="Logo" className="h-12 w-auto mx-auto mb-6" />
          <h1 className="text-3xl font-black text-slate-900 tracking-tight uppercase italic">Nova Senha</h1>
          <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-2">Crie uma senha forte e segura</p>
        </header>

        <form onSubmit={handleSubmit} className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-xl space-y-6">
          <div className="space-y-4">
            <input
              type="password"
              placeholder="Nova Senha"
              required
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              className="w-full p-4 rounded-2xl border border-slate-100 bg-slate-50 outline-none focus:border-blue-500 focus:bg-white transition-all font-bold text-slate-800"
            />
            <input
              type="password"
              placeholder="Confirme a Nova Senha"
              required
              value={confirmarSenha}
              onChange={(e) => setConfirmarSenha(e.target.value)}
              className="w-full p-4 rounded-2xl border border-slate-100 bg-slate-50 outline-none focus:border-blue-500 focus:bg-white transition-all font-bold text-slate-800"
            />
          </div>

          {status && (
            <p className="text-center text-[10px] font-black uppercase tracking-widest text-blue-600 animate-pulse">
              {status}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all shadow-lg active:scale-95
              ${loading ? 'bg-slate-200 text-slate-400' : 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-100'}`}
          >
            {loading ? 'Salvando...' : 'Atualizar Senha'}
          </button>
        </form>
        
        <p className="text-center mt-8">
          <Link href="/login" className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-blue-600 transition-colors">
            Voltar para o Login
          </Link>
        </p>
      </div>
    </main>
  )
}