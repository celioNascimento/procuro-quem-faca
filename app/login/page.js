'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [mensagem, setMensagem] = useState('')
  const [touched, setTouched] = useState({})
  const router = useRouter()

  const handleBlur = (field) => setTouched(prev => ({ ...prev, [field]: true }))
  const emailInvalido = touched.email && (!email.includes('@') || email.length < 5)
  const senhaInvalida = touched.password && password.length < 6

  async function handleLogin(e) {
    e.preventDefault()
    setLoading(true)
    setMensagem('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      const { error: signUpError } = await supabase.auth.signUp({ email, password })
      if (signUpError) setMensagem('Verifique seus dados.');
      else setMensagem('Conta criada! Tente logar agora.');
    } else {
      router.push('/cadastro')
    }
    setLoading(false)
  }

  return (
    <main className="min-h-screen bg-white flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm">
                <div className="flex justify-center mb-10 transition-all">
          <Link href="/" className="hover:opacity-80 transition-opacity">
            <img 
              src="/logo.png" 
              alt="Logo" 
              className="h-16 md:h-20 w-auto object-contain" // h-16 no mobile e h-20 no desktop
            />
          </Link>
        </div>

        <Link href="/" className="text-blue-600 font-black text-[10px] uppercase tracking-widest mb-6 inline-block">
          ← Voltar ao Início
        </Link>

        <h1 className="text-3xl font-black text-slate-800 mb-2">Entrar</h1>
        <p className="text-slate-500 mb-8 text-sm font-medium">Acesse sua conta para gerenciar seu anúncio.</p>

        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <input 
            type="email" placeholder="E-mail" value={email}
            onBlur={() => handleBlur('email')}
            onChange={(e) => setEmail(e.target.value.toLowerCase().trim())}
            className={`w-full p-4 rounded-2xl border ${emailInvalido ? 'border-red-500 bg-red-50' : 'border-slate-100'} outline-none focus:ring-2 focus:ring-blue-500`}
            required
          />
          <input 
            type="password" placeholder="Senha" value={password}
            onBlur={() => handleBlur('password')}
            onChange={(e) => setPassword(e.target.value)}
            className={`w-full p-4 rounded-2xl border ${senhaInvalida ? 'border-red-500 bg-red-50' : 'border-slate-100'} outline-none focus:ring-2 focus:ring-blue-500`}
            required
          />
          {mensagem && <div className="p-4 rounded-2xl bg-blue-50 text-blue-600 text-xs font-bold text-center">{mensagem}</div>}
          <button type="submit" disabled={loading} className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black shadow-lg hover:bg-blue-700 transition-all">
            {loading ? 'PROCESSANDO...' : 'ENTRAR OU CRIAR CONTA'}
          </button>
        </form>
      </div>
    </main>
  )
}