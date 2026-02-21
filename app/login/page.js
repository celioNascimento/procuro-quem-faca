'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import AuthSkeleton from '@/components/auth/AuthSkeleton'
import GoogleButton from '@/components/auth/GoogleButton'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [mensagem, setMensagem] = useState('')
  const [touched, setTouched] = useState({})
  const [mounted, setMounted] = useState(false)
  
  const router = useRouter()

  const registrarLogAuth = async (acao, detalhes = {}) => {
    try {
      await supabase.from('logs_atividades').insert({
        acao,
        detalhes: { ...detalhes, email_tentativa: email },
        entidade_tipo: 'autenticacao'
      })
    } catch (err) { console.error('Erro log:', err) }
  }

  const redirecionarUsuario = async (user) => {
    try {
      const { data: perfil } = await supabase
        .from('prestadores')
        .select('id, user_id, origem_tipo, categoria_id')
        .or(`user_id.eq.${user.id},whatsapp.ilike.%${user.email}%`)
        .maybeSingle();

      if (!perfil || perfil.origem_tipo === 'curadoria_publica' || !perfil.categoria_id) {
        const query = perfil?.origem_tipo === 'curadoria_publica' ? `?reivindicar=${perfil.id}` : '';
        router.push(`/cadastro${query}`);
      } else {
        router.push('/dashboard');
      }
    } catch (err) {
      router.push('/cadastro');
    }
  };

  useEffect(() => {
    setMounted(true)
    const params = new URLSearchParams(window.location.search)
    const hashParams = new URLSearchParams(window.location.hash.replace('#', '?'))
    const isRecovery = params.get('type') === 'recovery' || hashParams.get('type') === 'recovery'

    if (isRecovery) {
      router.replace('/recuperar-senha')
      return
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session && !isRecovery) {
        router.refresh()
        await redirecionarUsuario(session.user)
      }
    })
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
      redirectTo: `${window.location.origin}/recuperar-senha`,
    })
    setMensagem(error ? 'Erro: ' + error.message : 'Sucesso: Link enviado! Verifique seu e-mail.')
    setLoading(false)
  }

  async function handleLogin(e) {
    e.preventDefault()
    if (loading) return
    setLoading(true)
    setMensagem('')
    await registrarLogAuth('TENTATIVA_ACESSO_UNIFICADO')

    try {
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({ email, password })

      if (!signInError && signInData?.session) {
        await registrarLogAuth('LOGIN_SUCESSO')
        router.refresh()
        await redirecionarUsuario(signInData.session.user)
        return 
      }

      if (signInError && (signInError.message.includes("Invalid login credentials") || signInError.status === 400)) {
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({ email, password })

        if (signUpError) {
          setMensagem(signUpError.code === 'user_already_exists' ? 'Erro: Senha incorreta para este e-mail.' : 'Erro: ' + signUpError.message)
        } else if (signUpData?.session) {
          await registrarLogAuth('CADASTRO_SUCESSO_IMEDIATO')
          router.refresh()
          await redirecionarUsuario(signUpData.session.user)
        } else {
          setMensagem('Conta criada! Verifique seu e-mail para confirmar.')
        }
      } else {
        setMensagem('Erro: ' + (signInError?.message || 'Erro desconhecido'))
      }
    } catch (err) {
      setMensagem('Erro inesperado.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const inputClass = (erro) => `
    w-full p-4 rounded-[1.25rem] border transition-all duration-300 outline-none
    text-slate-800 bg-slate-50/50 placeholder-slate-400 font-semibold text-sm
    ${erro 
      ? 'border-red-500 bg-red-50 ring-4 ring-red-100' 
      : 'border-slate-100 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-50/50 shadow-sm'}
  `

  return (
    <main className="min-h-screen bg-[#FDFDFD] flex flex-col items-center justify-center p-6 font-sans antialiased text-slate-600">
      {!mounted ? (
        <AuthSkeleton />
      ) : (
        <div className="w-full max-w-[420px] bg-white p-10 md:p-14 rounded-[3.5rem] shadow-[0_30px_60px_-15px_rgba(0,0,0,0.05)] border border-slate-50 text-center relative overflow-hidden animate-in fade-in zoom-in-95 duration-500">
          
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-50 via-blue-500/10 to-blue-50" />

          <div className="mb-10 flex justify-center">
            <Link href="/" className="block transition-transform duration-500 hover:scale-110 active:scale-95">
              <img src="/logo.png" alt="Logo" className="h-12 w-auto object-contain" />
            </Link>
          </div>

          <h1 className="text-2xl font-bold text-slate-900 mb-2 tracking-tight">
            Acesse sua conta
          </h1>
          <p className="text-slate-400 mb-10 text-[11px] font-bold uppercase tracking-[0.2em]">
            Área do Profissional
          </p>

          <GoogleButton text="Entrar com Google" onLog={registrarLogAuth} />

          <div className="flex items-center gap-4 my-10">
            <div className="h-[1px] flex-grow bg-slate-100" />
            <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">ou e-mail</span>
            <div className="h-[1px] flex-grow bg-slate-100" />
          </div>

          <form onSubmit={handleLogin} className="flex flex-col gap-6 text-left">
            <div className="flex flex-col gap-2">
              <label className="text-slate-500 font-bold text-[10px] uppercase ml-4 tracking-widest">E-mail</label>
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

            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-center ml-4 mr-2">
                <label className="text-slate-500 font-bold text-[10px] uppercase tracking-widest">Senha</label>
                <button 
                  type="button"
                  onClick={handleEsqueciSenha}
                  className="text-[10px] font-bold text-blue-600 uppercase hover:text-blue-700 transition-colors tracking-wider"
                >
                  Esqueci a senha
                </button>
              </div>
              <input 
                type="password" 
                placeholder="Sua senha secreta" 
                value={password}
                onBlur={() => handleBlur('password')}
                onChange={(e) => setPassword(e.target.value)}
                className={inputClass(senhaInvalida)}
                required
              />
            </div>

            {mensagem && (
              <div className={`p-4 rounded-2xl text-[11px] font-bold text-center uppercase tracking-wider animate-in fade-in duration-300 ${mensagem.includes('Erro') ? 'bg-red-50 text-red-500 border border-red-100' : 'bg-blue-50 text-blue-600 border border-blue-100'}`}>
                {mensagem}
              </div>
            )}

            <button 
              type="submit" 
              disabled={loading} 
              className="w-full py-5 bg-blue-600 text-white rounded-[1.5rem] font-bold shadow-[0_20px_40px_-10px_rgba(37,99,235,0.3)] hover:bg-blue-700 hover:-translate-y-0.5 active:scale-[0.98] transition-all mt-4 uppercase tracking-[0.2em] text-[12px] flex items-center justify-center gap-2"
            >
              {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : 'Entrar'}
            </button>
          </form>

          <Link href="/" className="inline-block mt-12 text-slate-300 font-bold text-[10px] uppercase tracking-[0.2em] hover:text-blue-600 transition-all hover:translate-x-1">
            ← Voltar para a busca
          </Link>
        </div>
      )}
    </main>
  )
}