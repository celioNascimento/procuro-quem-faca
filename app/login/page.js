'use client'
// ADICIONADO O useEffect NA IMPORTAÇÃO ABAIXO
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

  // VERIFICA SE JÁ ESTÁ LOGADO AO ENTRAR NA PÁGINA
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

  async function handleLogin(e) {
    e.preventDefault()
    setLoading(true)
    setMensagem('')

    // 1. Tenta o Login
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({ 
      email, 
      password 
    })

    if (signInError) {
      // 2. Se as credenciais forem inválidas (usuário não existe), tenta cadastrar
      if (signInError.message.includes("Invalid login credentials")) {
        setMensagem('Criando sua conta...')
        
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({ 
          email, 
          password 
        })

        if (signUpError) {
          setMensagem('Erro: ' + signUpError.message)
        } else if (signUpData?.user && signUpData?.session) {
          // Logado automaticamente após cadastro
          router.push('/cadastro')
        } else {
          setMensagem('Conta criada! Verifique seu e-mail ou tente entrar novamente.')
        }
      } else {
        setMensagem('Erro: ' + signInError.message)
      }
    } else {
      // Login com sucesso
      router.push('/cadastro')
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

        <h1 className="text-2xl font-black text-slate-800 mb-2">Acesse sua conta</h1>
        <p className="text-slate-500 mb-8 text-sm font-medium">Use seu e-mail para entrar ou criar seu perfil.</p>

        <form onSubmit={handleLogin} className="flex flex-col gap-4 text-left">
          <div className="flex flex-col gap-1">
            <label className="text-slate-400 font-bold text-[9px] uppercase ml-4 tracking-widest">Seu E-mail</label>
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
            <label className="text-slate-400 font-bold text-[9px] uppercase ml-4 tracking-widest">Sua Senha</label>
            <input 
              type="password" 
              placeholder="••••••" 
              value={password}
              onBlur={() => handleBlur('password')}
              onChange={(e) => setPassword(e.target.value)}
              className={inputClass(senhaInvalida)}
              required
            />
          </div>

          {mensagem && (
            <div className={`p-4 rounded-xl text-xs font-bold text-center ${mensagem.includes('Erro') ? 'bg-red-50 text-red-500' : 'bg-blue-50 text-blue-600'}`}>
              {mensagem}
            </div>
          )}

          <button 
            type="submit" 
            disabled={loading} 
            className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black shadow-lg shadow-blue-100 hover:bg-blue-700 active:scale-95 transition-all mt-2 uppercase tracking-widest text-xs"
          >
            {loading ? 'CARREGANDO...' : 'ENTRAR / CADASTRAR'}
          </button>
        </form>

        <Link href="/" className="inline-block mt-10 text-slate-400 font-bold text-[10px] uppercase tracking-[0.2em] hover:text-blue-600 transition-colors">
          ← Voltar para a busca
        </Link>
      </div>
    </main>
  )
}