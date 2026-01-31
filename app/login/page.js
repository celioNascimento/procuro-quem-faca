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

  const registrarLogAuth = async (acao, detalhes = {}) => {
    try {
      await supabase.from('logs_atividades').insert({
        acao,
        detalhes: { ...detalhes, email_tentativa: email },
        entidade_tipo: 'autenticacao'
      })
    } catch (err) {
      console.error('Erro ao registrar log:', err)
    }
  }

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      const isRecoveryFlow = 
        event === 'PASSWORD_RECOVERY' || 
        window.location.hash.includes('type=recovery') || 
        window.location.search.includes('type=recovery');

      if (isRecoveryFlow) {
        router.replace('/recuperar-senha')
        return
      }

      if (session && event === 'SIGNED_IN') {
        router.push('/cadastro')
      }
    })

    const verificarIntencaoOriginal = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      const isRecovery = window.location.hash.includes('type=recovery') || window.location.search.includes('type=recovery')

      if (isRecovery) {
        router.replace('/recuperar-senha')
        return
      }

      if (session && !isRecovery) {
        router.push('/cadastro')
      }
    }

    verificarIntencaoOriginal()
    return () => subscription.unsubscribe()
  }, [router])

  const handleBlur = (field) => setTouched(prev => ({ ...prev, [field]: true }))
  const emailInvalido = touched.email && (!email.includes('@') || email.length < 5)
  const senhaInvalida = touched.password && password.length < 6

  async function handleEsqueciSenha() {
    if (!email || emailInvalido) {
      setMensagem('Erro: Digite um e-mail válido primeiro.')
      return
    }
    setLoading(true)
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/recuperar-senha`,
    })
    
    if (error) setMensagem('Erro: ' + error.message)
    else setMensagem('Sucesso: Link enviado! Verifique seu e-mail.')
    setLoading(false)
  }

  async function handleLogin(e) {
    e.preventDefault()
    if (loading) return
    setLoading(true)
    setMensagem('')

    await registrarLogAuth('TENTATIVA_ACESSO_UNIFICADO')

    try {
      // Tenta primeiro o Login
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (!signInError) {
        await registrarLogAuth('LOGIN_SUCESSO')
        router.push('/cadastro')
        return 
      }

      // Se o erro for "Invalid login credentials", pode ser um usuário novo
      // Verificamos se o erro é de credenciais inválidas para tentar o cadastro
      if (signInError.message.includes("Invalid login credentials") || signInError.status === 400) {
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email,
          password
        })

        if (signUpError) {
          // Caso o usuário já exista (mas errou a senha no primeiro passo), mostramos senha incorreta
          if (signUpError.message.includes("User already registered")) {
            setMensagem('Erro: Senha incorreta para este e-mail.')
            await registrarLogAuth('ERRO_LOGIN_SENHA_INCORRETA')
          } else {
            setMensagem('Erro: ' + signUpError.message)
            await registrarLogAuth('ERRO_CADASTRO_NOVO', { erro: signUpError.message })
          }
        } else if (signUpData?.session) {
          await registrarLogAuth('CADASTRO_SUCESSO_IMEDIATO')
          router.push('/cadastro')
        } else {
          setMensagem('Conta criada! Verifique seu e-mail para confirmar.')
          await registrarLogAuth('CADASTRO_PENDENTE_CONFIRMACAO')
        }
      } else {
        setMensagem('Erro: ' + signInError.message)
        await registrarLogAuth('ERRO_LOGIN_TECNICO', { erro: signInError.message })
      }
    } catch (err) {
      setMensagem('Erro inesperado ao processar acesso.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }
  const inputClass = (erro) => `
    w-full p-4 rounded-2xl border transition-all outline-none focus:ring-2 focus:ring-blue-500 
    text-slate-800 bg-slate-50 placeholder-slate-400 font-medium
    ${erro ? 'border-red-500 bg-red-50' : 'border-slate-100 focus:border-blue-200'}
  `

  return (
    <main className="min-h-screen bg-white flex flex-col items-center justify-center p-6 font-sans">
      <div className="w-full max-w-sm text-center">
        
        {/* LOGO AJUSTADA: Transparente e Proporcional como na Home */}
        <div className="mb-10 flex justify-center">
          <Link href="/" className="block transition-transform hover:scale-105">
            <img 
              src="/logo.png" 
              alt="Logo" 
              className="h-24 md:h-28 w-auto object-contain" 
            />
          </Link>
        </div>

        <h1 className="text-2xl font-black text-slate-800 mb-2 tracking-tighter uppercase italic">Acesse sua conta</h1>
        <p className="text-slate-500 mb-8 text-[10px] font-black uppercase tracking-widest leading-relaxed">
          Área do Profissional: Crie ou gerencie seu anúncio
        </p>

        <form onSubmit={handleLogin} className="flex flex-col gap-4 text-left">
          <div className="flex flex-col gap-1">
            <label className="text-slate-400 font-bold text-[9px] uppercase ml-4 tracking-widest">E-mail</label>
            <input 
              type="email" 
              placeholder="seu@email.com" 
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
                className="text-[9px] font-black text-blue-600 uppercase hover:underline tracking-widest"
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
            <div className={`p-4 rounded-xl text-[10px] font-black text-center uppercase tracking-wider animate-in fade-in slide-in-from-top-2 ${mensagem.includes('Erro') ? 'bg-red-50 text-red-500' : 'bg-blue-50 text-blue-600'}`}>
              {mensagem}
            </div>
          )}

          <button 
            type="submit" 
            disabled={loading} 
            className="w-full py-5 bg-blue-600 text-white rounded-[1.8rem] font-black shadow-lg shadow-blue-100 hover:bg-blue-700 active:scale-95 transition-all mt-2 uppercase tracking-[0.2em] text-[11px]"
          >
            {loading ? 'Sincronizando...' : 'Entrar / Cadastrar'}
          </button>
        </form>

        <Link href="/" className="inline-block mt-10 text-slate-400 font-black text-[9px] uppercase tracking-[0.3em] hover:text-blue-600 transition-colors italic">
          ← Voltar para a busca
        </Link>
      </div>
    </main>
  )
}