'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import AuthSkeleton from '@/components/auth/AuthSkeleton'

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
    if (window.location.hash.includes('type=recovery') || params.get('type') === 'recovery') {
      router.replace('/recuperar-senha')
      return
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session) {
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

  // Estilização de Input refinada: foco mais suave, border sutil e fonte otimizada
  const inputClass = (erro) => `
    w-full p-4 rounded-2xl border transition-all duration-300 outline-none
    text-slate-800 bg-slate-50 placeholder-slate-400 font-semibold text-sm
    ${erro ? 'border-red-500 bg-red-50 ring-2 ring-red-100' : 'border-slate-100 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-50'}
  `

  if (!mounted) return <AuthSkeleton />

  return (
    <main className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-6 font-sans">
      <div className="w-full max-w-[400px] bg-white p-10 rounded-[2.5rem] shadow-2xl shadow-slate-200/60 border border-slate-50 text-center">
        
        <div className="mb-8 flex justify-center">
          <Link href="/" className="block transition-all duration-300 hover:scale-110 active:scale-95">
            <img 
              src="/logo.png" 
              alt="Logo" 
              className="h-20 w-auto object-contain drop-shadow-sm" 
            />
          </Link>
        </div>

        <h1 className="text-2xl font-black text-slate-800 mb-2 tracking-tight uppercase italic leading-none">
          Acesse sua conta
        </h1>
        <p className="text-slate-400 mb-10 text-[10px] font-bold uppercase tracking-[0.2em] leading-relaxed max-w-[240px] mx-auto">
          Área do Profissional: Crie ou gerencie seu anúncio
        </p>

        <form onSubmit={handleLogin} className="flex flex-col gap-5 text-left">
          <div className="flex flex-col gap-1.5">
            <label className="text-slate-500 font-black text-[9px] uppercase ml-4 tracking-[0.15em]">E-mail</label>
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

          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between items-center ml-4 mr-2">
              <label className="text-slate-500 font-black text-[9px] uppercase tracking-[0.15em]">Senha</label>
              <button 
                type="button"
                onClick={handleEsqueciSenha}
                className="text-[9px] font-black text-blue-600 uppercase hover:text-blue-700 transition-colors tracking-widest"
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
            <div className={`p-4 rounded-2xl text-[10px] font-black text-center uppercase tracking-widest animate-in zoom-in-95 duration-300 ${mensagem.includes('Erro') ? 'bg-red-50 text-red-500 border border-red-100' : 'bg-blue-50 text-blue-600 border border-blue-100'}`}>
              {mensagem}
            </div>
          )}

          <button 
            type="submit" 
            disabled={loading} 
            className="w-full py-5 bg-blue-600 text-white rounded-2xl font-black shadow-[0_10px_25px_-5px_rgba(37,99,235,0.4)] hover:bg-blue-700 hover:-translate-y-0.5 active:scale-[0.97] transition-all mt-4 uppercase tracking-[0.2em] text-[11px]"
          >
            {loading ? 'Processando...' : 'Entrar / Cadastrar'}
          </button>
        </form>

        <Link href="/" className="inline-block mt-10 text-slate-400 font-black text-[9px] uppercase tracking-[0.3em] hover:text-blue-600 transition-all italic hover:translate-x-1">
          ← Voltar para a busca
        </Link>
      </div>
    </main>
  )
}