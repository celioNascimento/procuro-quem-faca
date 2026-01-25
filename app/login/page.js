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

  // 2. Lógica de Recuperação de Senha
  async function handleEsqueciSenha() {
    if (!email || emailInvalido) {
      setMensagem('Erro: Digite um e-mail válido primeiro.')
      return
    }
    setLoading(true)
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/login`,
    })
    if (error) setMensagem('Erro: ' + error.message)
    else setMensagem('Sucesso: Link de recuperação enviado para o seu e-mail!')
    setLoading(false)
  }

  async function handleLogin(e) {
    e.preventDefault()
    setLoading(true)
    setMensagem('')

    // Tenta o Cadastro primeiro
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({ 
      email, 
      password,
      options: {
        // Isso ajuda a garantir o redirecionamento se o e-mail estiver desativado no painel
        emailRedirectTo: `${window.location.origin}/cadastro`,
      }
    })

    // Caso 1: Usuário já existe (Fluxo de Login)
    if (signUpError?.message?.toLowerCase().includes("already registered") || 
        signUpError?.message?.toLowerCase().includes("already exists")) {
      
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({ email, password })

      if (signInError) {
        setMensagem('Erro: Senha incorreta para este e-mail.')
      } else {
        // Login com sucesso
        router.push('/cadastro')
        return // Encerra a função
      }
    } 
    // Caso 2: Erro real de cadastro
    else if (signUpError) {
      setMensagem('Erro: ' + signUpError.message)
    } 
    // Caso 3: Cadastro novo com sucesso (Sessão criada na hora)
    else if (signUpData?.session) {
      router.push('/cadastro')
    } 
    // Caso 4: Cadastro com confirmação de e-mail ligada
    else {
      setMensagem('Sucesso! Verifique seu e-mail para confirmar a conta e acessar o cadastro.')
    }

    setLoading(false)
  }

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

        <h1 className="text-2xl font-black text-slate-800 mb-2 tracking-tighter">Acesse sua conta</h1>
        <p className="text-slate-500 mb-8 text-sm font-medium">Crie ou gerencie seu perfil profissional.</p>

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
            <div className="flex justify-between items-center ml-4 mr-2">
              <label className="text-slate-400 font-bold text-[9px] uppercase tracking-widest">Senha</label>
              <button 
                type="button"
                onClick={handleEsqueciSenha}
                className="text-[9px] font-black text-blue-600 uppercase hover:underline"
              >
                Esqueci a senha
              </button>
            </div>
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
            {loading ? 'Processando...' : 'Entrar / Cadastrar'}
          </button>
        </form>

        <Link href="/" className="inline-block mt-10 text-slate-400 font-bold text-[10px] uppercase tracking-[0.2em] hover:text-blue-600 transition-colors">
          ← Voltar para a busca
        </Link>
      </div>
    </main>
  )
}