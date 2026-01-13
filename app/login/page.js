'use client'
import { useState, useEffect } from 'react'
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

  // 1. Persistência: Redireciona se já estiver logado
  useEffect(() => {
    const verificarSessao = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        router.push('/cadastro')
      }
    }
    verificarSessao()
  }, [router])

  const handleBlur = (field) => setTouched(prev => ({ ...prev, [field]: true }))
  const emailInvalido = touched.email && (!email.includes('@') || email.length < 5)
  const senhaInvalida = touched.password && password.length < 6

  // 2. Lógica Robusta: Tenta registar, se já existir, tenta logar
  async function handleLogin(e) {
    e.preventDefault()
    setLoading(true)
    setMensagem('')

    // TENTA O REGISTO (SIGN UP) PRIMEIRO
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({ 
      email, 
      password 
    })

    // Se o erro for que o utilizador já existe, tentamos o Login
    if (signUpError?.message?.toLowerCase().includes("already registered") || 
        signUpError?.message?.toLowerCase().includes("already exists")) {
      
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({ 
        email, 
        password 
      })

      if (signInError) {
        setMensagem('Erro: Senha incorreta para este e-mail.')
      } else {
        router.push('/cadastro')
      }
    } 
    // Se houver outro erro no registo
    else if (signUpError) {
      setMensagem('Erro: ' + signUpError.message)
    } 
    // Registo novo com sucesso (com login automático se a confirmação de email estiver OFF)
    else if (signUpData?.session) {
      router.push('/cadastro')
    } 
    else {
      setMensagem('Conta criada! Tente clicar em entrar novamente.')
    }

    setLoading(false)
  }

  // Estilo com letras escuras (slate-800) para evitar "letras brancas"
  const inputClass = (erro) => `
    w-full p-4 rounded-2xl border transition-all outline-none focus:ring-2 focus:ring-blue-500 
    text-slate-800 bg-slate-50 placeholder-slate-400 font-medium
    ${erro ? 'border-red-500 bg-red-50' : 'border-slate-100 focus:border-blue-200'}
  `

  return (
    <main className="min-h-screen bg-white flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm text-center">
        
        <Link href="/">
          <img src="/logo.png" alt="Logo" className="h-16 w-auto object-contain mx-auto mb-8" />
        </Link>

        <h1 className="text-2xl font-black text-slate-800 mb-2 tracking-tighter">Aceda à sua conta</h1>
        <p className="text-slate-500 mb-8 text-sm font-medium">Crie ou gira o seu perfil profissional.</p>

        <form onSubmit={handleLogin} className="flex flex-col gap-4 text-left">
          <div className="flex flex-col gap-1">
            <label className="text-slate-400 font-bold text-[9px] uppercase ml-4 tracking-widest">E-mail</label>
            <input 
              type="email" 
              placeholder="exemplo@email.com" 
              value={email}
              onBlur={() => handleBlur('email')}
              onChange={(e) => setEmail(e.target.value.toLowerCase().trim())}
              className={inputClass(emailInvalido)}
              required
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-slate-400 font-bold text-[9px] uppercase ml-4 tracking-widest">Senha</label>
            <input 
              type="password" 
              placeholder="Mínimo 6 caracteres" 
              value={password}
              onBlur={() => handleBlur('password')}
              onChange={(e) => setPassword(e.target.value)}
              className={inputClass(senhaInvalida)}
              required
            />
          </div>

          {mensagem && (
            <div className={`p-4 rounded-xl text-[10px] font-black text-center uppercase tracking-wider ${mensagem.includes('Erro') ? 'bg-red-50 text-red-500' : 'bg-blue-50 text-blue-600'}`}>
              {mensagem}
            </div>
          )}

          <button 
            type="submit" 
            disabled={loading} 
            className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black shadow-lg shadow-blue-100 hover:bg-blue-700 active:scale-95 transition-all mt-2 uppercase tracking-widest text-xs"
          >
            {loading ? 'A processar...' : 'Entrar / Registar'}
          </button>
        </form>

        <Link href="/" className="inline-block mt-10 text-slate-400 font-bold text-[10px] uppercase tracking-[0.2em] hover:text-blue-600 transition-colors">
          ← Voltar para a busca
        </Link>
      </div>
    </main>
  )
}