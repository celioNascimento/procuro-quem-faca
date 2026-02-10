'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import AuthCard from '../../components/auth/AuthCard'
import AuthSkeleton from '../../components/auth/AuthSkeleton'

export default function NovaSenha() {
  const [senha, setSenha] = useState('')
  const [confirmarSenha, setConfirmarSenha] = useState('')
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(false)
  const [isReady, setIsReady] = useState(false)
  const [linkValido, setLinkValido] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        setStatus('❌ Este link de recuperação não é mais válido.')
        setLinkValido(false)
      }
      
      setIsReady(true)
    }
    checkSession()
  }, [])

  const traduzirErro = (msg) => {
    if (msg.includes("New password should be different")) return "⚠️ A nova senha deve ser diferente da anterior."
    if (msg.includes("Password should be at least 6 characters")) return "⚠️ A senha deve ter no mínimo 6 caracteres."
    if (msg.includes("Auth session missing")) return "❌ Link expirado ou já utilizado."
    return `❌ Erro: ${msg}`
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (senha !== confirmarSenha) { setStatus('⚠️ As senhas não coincidem'); return }

    setLoading(true)
    setStatus('Verificando conexão...')

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { 
        setStatus('❌ Sessão expirada. Solicite um novo link.')
        setLinkValido(false)
        setLoading(false)
        return 
      }

      setStatus('Atualizando senha...')
      const { error } = await supabase.auth.updateUser({ password: senha })

      if (error) {
        setStatus(traduzirErro(error.message))
        setLoading(false)
      } else {
        setStatus('✅ SENHA ATUALIZADA!')
        window.history.replaceState({}, document.title, window.location.pathname);
        window.location.hash = "" 
        await supabase.auth.signOut()
        setTimeout(() => router.push('/login'), 2000)
      }
    } catch (err) { 
      setStatus('❌ Erro inesperado.')
      setLoading(false) 
    }
  }

  if (!isReady) return <AuthSkeleton />

  const inputStyle = "w-full p-4 rounded-2xl border border-slate-100 bg-slate-50 outline-none font-bold text-sm text-slate-900 placeholder-slate-500 focus:bg-white focus:border-blue-500 transition-all shadow-sm"

  return (
    <main className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-6 font-sans">
      <div className="mb-8">
        <Link href="/">
          <img src="/logo.png" alt="Logo" className="h-14 w-auto mx-auto hover:scale-105 transition-transform" />
        </Link>
      </div>

      <AuthCard 
        title={linkValido ? "Nova Senha" : "Link Inválido"} 
        subtitle={linkValido ? "Crie uma senha forte e segura" : "Não foi possível prosseguir"}
      >
        {linkValido ? (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-3">
              <input 
                type="password" 
                placeholder="Digite a nova senha" 
                required 
                value={senha} 
                onChange={(e) => setSenha(e.target.value)} 
                className={inputStyle} 
              />
              <input 
                type="password" 
                placeholder="Confirme a nova senha" 
                required 
                value={confirmarSenha} 
                onChange={(e) => setConfirmarSenha(e.target.value)} 
                className={inputStyle} 
              />
            </div>

            {status && (
              <div className="p-4 rounded-2xl text-[10px] font-black text-center uppercase tracking-wider bg-blue-50 text-blue-600 animate-in fade-in slide-in-from-top-1">
                {status}
              </div>
            )}

            <button 
              type="submit" 
              disabled={loading} 
              className={`w-full py-5 rounded-[1.8rem] font-black text-[11px] uppercase tracking-[0.2em] transition-all shadow-xl shadow-blue-100/50 
                ${loading ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700 active:scale-[0.98]'}`}
            >
              {loading ? 'Salvando...' : 'Confirmar Nova Senha'}
            </button>
          </form>
        ) : (
          <div className="space-y-6 text-center">
            <div className="p-6 rounded-[2rem] bg-red-50 border border-red-100">
              <p className="text-[11px] font-black text-red-500 uppercase tracking-widest leading-relaxed">
                {status || "Este link já foi utilizado ou expirou por tempo de segurança."}
              </p>
            </div>
            
            <p className="text-slate-400 text-[10px] font-medium px-4">
              Para sua segurança, links de recuperação são de uso único. Se precisar, solicite um novo link na página de login.
            </p>

            <Link 
              href="/login" 
              className="block w-full py-5 bg-blue-600 text-white rounded-[1.8rem] font-black text-[11px] uppercase tracking-[0.2em] shadow-xl shadow-blue-100/50 hover:bg-blue-700 active:scale-[0.98] transition-all text-center"
            >
              Ir para o Login
            </Link>
          </div>
        )}
      </AuthCard>

      {linkValido && (
        <Link href="/login" className="mt-10 text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 hover:text-blue-600 transition-colors italic">
          ← Voltar para o Login
        </Link>
      )}
    </main>
  )
}