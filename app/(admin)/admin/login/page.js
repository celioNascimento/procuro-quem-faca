'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [mensagem, setMensagem] = useState('')
  const router = useRouter()

  async function handleLogin(e) {
    e.preventDefault()
    setLoading(true)
    setMensagem('')

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setMensagem('Erro: Verifique suas credenciais.')
      setLoading(false)
    } else {
      router.push('/admin') // Redireciona para o Dashboard
      router.refresh()
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
      <div className="max-w-md w-full bg-white p-10 rounded-[3rem] shadow-xl border border-slate-100 space-y-8">
        
        {/* LOGO */}
        <div className="flex flex-col items-center gap-3">
          <div className="w-16 h-16 bg-slate-900 rounded-2xl flex items-center justify-center shadow-lg">
            <span className="text-white font-black text-3xl italic">A</span>
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">Acesso Restrito</h1>
            <p className="text-blue-500 font-bold text-[10px] uppercase tracking-[0.2em]">Profissionais V2.0</p>
          </div>
        </div>

        {/* FORMULÁRIO */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase ml-4">E-mail</label>
            <input 
              type="email" required
              value={email} onChange={e => setEmail(e.target.value)}
              placeholder="seu@email.com"
              className="w-full p-4 bg-slate-50 rounded-2xl font-bold text-slate-900 outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase ml-4">Senha</label>
            <input 
              type="password" required
              value={password} onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full p-4 bg-slate-50 rounded-2xl font-bold text-slate-900 outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            />
          </div>

          {mensagem && (
            <p className="text-red-500 text-[10px] font-black uppercase text-center">{mensagem}</p>
          )}

          <button 
            disabled={loading}
            className="w-full bg-slate-900 text-white p-5 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-600 transition-all disabled:opacity-50 shadow-lg shadow-slate-200"
          >
            {loading ? 'Autenticando...' : 'Entrar no Painel'}
          </button>
        </form>

        <Link href="/" className="block text-center text-[10px] font-black text-slate-400 uppercase hover:text-slate-600 transition-colors">
          ← Voltar para o site
        </Link>
      </div>
    </div>
  )
}