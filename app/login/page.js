'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [isSignUp, setIsSignUp] = useState(false) 
  const router = useRouter()

  async function handleAuth(e) {
    e.preventDefault()
    setLoading(true)

    // Se isSignUp for true, ele cadastra. Se for false, ele entra.
    const { error } = isSignUp 
      ? await supabase.auth.signUp({ email, password })
      : await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      alert("Erro: " + error.message)
    } else {
      // Se deu certo, manda para a página de cadastro/perfil
      router.push('/cadastro')
    }
    setLoading(false)
  }

  return (
    <main className="flex-grow flex items-center justify-center p-4 bg-slate-50">
      <div className="w-full max-w-md bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-100">
        <h1 className="text-3xl font-black text-slate-800 mb-2">
          {isSignUp ? 'Criar Conta' : 'Entrar'}
        </h1>
        <p className="text-slate-500 mb-8 font-medium">Para gerenciar seu anúncio no portal.</p>

        <form onSubmit={handleAuth} className="flex flex-col gap-4">
          <input 
            type="email" placeholder="Seu e-mail"
            value={email} onChange={(e) => setEmail(e.target.value)}
            className="w-full p-4 rounded-2xl border border-slate-100 bg-slate-50 outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
            required
          />
          <input 
            type="password" placeholder="Sua senha"
            value={password} onChange={(e) => setPassword(e.target.value)}
            className="w-full p-4 rounded-2xl border border-slate-100 bg-slate-50 outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
            required
          />
          <button 
            disabled={loading}
            className="bg-blue-600 text-white p-4 rounded-2xl font-bold hover:bg-blue-700 transition-all shadow-lg active:scale-95 disabled:opacity-50"
          >
            {loading ? 'Aguarde...' : (isSignUp ? 'Cadastrar agora' : 'Entrar')}
          </button>
        </form>

        <button 
          onClick={() => setIsSignUp(!isSignUp)}
          className="w-full mt-6 text-slate-500 text-sm font-bold hover:text-blue-600 transition-colors"
        >
          {isSignUp ? 'Já tenho uma conta. Entrar.' : 'Não tenho conta. Quero me cadastrar.'}
        </button>
      </div>
    </main>
  )
}