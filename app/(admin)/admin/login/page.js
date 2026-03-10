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
      setMensagem('Credenciais inválidas.')
      setLoading(false)
    } else {
      router.push('/admin')
      router.refresh()
    }
  }

  const inputStyle = "w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-900 outline-none focus:bg-white focus:border-indigo-600 focus:ring-4 focus:ring-indigo-50 transition-all placeholder:text-slate-300 text-sm";

  return (
    /* Centralização perfeita com Flexbox e H-Screen */
    <div className="min-h-screen w-full bg-[#F8FAFC] flex flex-col items-center justify-center p-4 md:p-6 antialiased text-slate-900 font-sans">
      
      {/* Wrapper de largura controlada para evitar que o card 'dance' na tela */}
      <div className="w-full max-w-[440px] flex flex-col items-center">
        
        {/* CARD PRINCIPAL */}
        <div className="w-full bg-white p-8 md:p-12 rounded-[3.5rem] shadow-[0_40px_80px_-15px_rgba(0,0,0,0.08)] border border-slate-100 space-y-10 relative overflow-hidden">
          
          {/* Logo Centralizada */}
          <div className="flex flex-col items-center gap-4 relative">
            <div className="w-20 h-20 bg-slate-900 rounded-[2rem] flex items-center justify-center shadow-xl shadow-indigo-100 transform transition-transform hover:rotate-6">
              <span className="text-white font-black text-4xl italic tracking-tighter">A</span>
            </div>
            <div className="text-center">
              <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tighter italic leading-none">
                Terminal<span className="text-indigo-600 not-italic text-3xl">.</span>
              </h1>
              <p className="text-slate-400 font-black text-[9px] uppercase tracking-[0.4em] mt-2">Sessão Administrativa</p>
            </div>
          </div>

          {/* FORMULÁRIO */}
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Usuário Identificado</label>
              <input 
                type="email" required
                value={email} onChange={e => setEmail(e.target.value)}
                placeholder="admin@empresa.com"
                className={inputStyle}
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center px-4">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Senha Privada</label>
              </div>
              <input 
                type="password" required
                value={password} onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className={inputStyle}
              />
            </div>

            {mensagem && (
              <div className="bg-red-50 border border-red-100 p-3 rounded-xl">
                <p className="text-red-600 text-[10px] font-black uppercase text-center">{mensagem}</p>
              </div>
            )}

            <button 
              disabled={loading}
              className="w-full bg-slate-900 text-white p-5 rounded-[1.5rem] font-black text-xs uppercase tracking-[0.2em] transition-all disabled:opacity-50 shadow-lg hover:bg-indigo-600 hover:-translate-y-1 active:scale-[0.98] flex items-center justify-center gap-3"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              ) : (
                "Entrar no Sistema"
              )}
            </button>
          </form>

          {/* Link de volta */}
          <div className="pt-2">
            <Link href="/" className="flex items-center justify-center gap-2 text-[10px] font-black text-slate-400 uppercase hover:text-indigo-600 transition-all">
              <span>←</span> Retornar ao site
            </Link>
          </div>
        </div>

        {/* Info extra abaixo do card para ancorar o design no centro */}
        <p className="mt-8 text-[9px] font-bold text-slate-300 uppercase tracking-[0.4em] text-center">
          Secure Core V2.0 ● Encrypted Terminal
        </p>
      </div>
    </div>
  )
}
