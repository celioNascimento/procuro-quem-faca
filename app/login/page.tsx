'use client'  
import Link from 'next/link'
import AuthSkeleton from '@/components/auth/AuthSkeleton'
import GoogleButton from '@/components/auth/GoogleButton'
import { useLoginForm } from '@/hooks/useLoginForm'

export default function Login() {
  const {
    email, setEmail,
    password, setPassword,
    showPassword, setShowPassword,
    loading,
    mensagem,
    touched,
    mounted,
    emailInvalido,
    senhaInvalida,
    handleBlur,
    handleEsqueciSenha,
    handleLogin,
    registrarLogAuth
  } = useLoginForm()

  const inputClass = (erro: boolean | string) =>
    `w-full p-4 rounded-[1.25rem] border transition-all duration-300 outline-none text-slate-800 bg-slate-50/50 placeholder-slate-400 font-semibold text-sm ${
      erro
        ? 'border-red-500 bg-red-50 ring-4 ring-red-100'
        : 'border-slate-100 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-50/50 shadow-sm'
    }`

  return (
    <main className="min-h-screen bg-[#FDFDFD] flex flex-col items-center justify-center p-6 font-sans antialiased text-slate-600">
      {!mounted ? <AuthSkeleton /> : (
        <div className="w-full max-w-[420px] bg-white px-8 pt-8 pb-10 md:px-12 md:pt-10 md:pb-12 rounded-[3rem] shadow-[0_30px_60px_-15px_rgba(0,0,0,0.05)] border border-slate-50 text-center relative overflow-hidden animate-in fade-in zoom-in-95 duration-500">

          {/* Barra decorativa topo */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-50 via-blue-400/30 to-blue-50" />

          {/* Logo — tamanho controlado, sem margem negativa */}
          <div className="flex justify-center mb-4">
            <Link href="/" className="block transition-transform hover:opacity-80 active:scale-95">
              <img
                src="/logo.png"
                alt="Procuro Quem Faça"
                className="h-10 md:h-12 w-auto object-contain drop-shadow-sm"
              />
            </Link>
          </div>

          {/* Título */}
          <h1 className="text-xl md:text-2xl font-black text-slate-900 mb-1 tracking-tight">
            Entrar ou Criar Conta
          </h1>

          <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mb-2">
            Área do Profissional
          </p>

          <p className="text-slate-500 text-[12px] font-medium mb-7 leading-relaxed">
            Use seu e-mail e senha abaixo.{' '}
            <span className="text-blue-600 font-semibold">Primeira vez? Sua conta será criada automaticamente.</span>
          </p>

          {/* Google */}
          <GoogleButton text="Entrar com Google" onLog={registrarLogAuth} />

          {/* Divisor */}
          <div className="flex items-center gap-4 my-6">
            <div className="h-px flex-grow bg-slate-100" />
            <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">ou e-mail</span>
            <div className="h-px flex-grow bg-slate-100" />
          </div>

          <form onSubmit={handleLogin} className="flex flex-col gap-4 text-left">

            {/* E-mail */}
            <div className="flex flex-col gap-1.5">
              <label className="text-slate-500 font-bold text-[10px] uppercase ml-1 tracking-widest">E-mail</label>
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

            {/* Senha */}
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between items-center ml-1 mr-1">
                <label className="text-slate-500 font-bold text-[10px] uppercase tracking-widest">Senha</label>
                <button
                  type="button"
                  onClick={handleEsqueciSenha}
                  className="text-[10px] font-bold text-blue-600 uppercase hover:text-blue-700 transition-colors tracking-wider"
                >
                  Redefinir senha
                </button>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Mínimo 6 caracteres"
                  value={password}
                  onBlur={() => handleBlur('password')}
                  onChange={(e) => setPassword(e.target.value)}
                  className={inputClass(senhaInvalida)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-blue-600 transition-colors p-1"
                >
                  {showPassword ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
              {!touched.password && (
                <p className="text-[10px] text-slate-400 ml-1 font-medium">
                  Primeiro acesso? Escolha uma senha nova aqui.
                </p>
              )}
            </div>

            {/* Feedback */}
            {mensagem && (
              <div className={`p-4 rounded-2xl text-[11px] font-bold text-center uppercase tracking-wider animate-in fade-in duration-300 ${
                mensagem.includes('Erro')
                  ? 'bg-red-50 text-red-500 border border-red-100'
                  : 'bg-blue-50 text-blue-600 border border-blue-100'
              }`}>
                {mensagem}
              </div>
            )}

            {/* Botão */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-blue-600 text-white rounded-[1.5rem] font-black shadow-lg shadow-blue-100 hover:bg-blue-700 hover:-translate-y-0.5 active:scale-[0.98] transition-all mt-1 uppercase tracking-[0.15em] text-[11px] flex items-center justify-center gap-2"
            >
              {loading
                ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                : 'Entrar / Criar Conta'
              }
            </button>
          </form>

          <Link
            href="/"
            className="inline-block mt-8 text-slate-300 font-bold text-[10px] uppercase tracking-[0.2em] hover:text-blue-600 transition-colors"
          >
            ← Voltar para a busca
          </Link>

        </div>
      )}
    </main>
  )
}