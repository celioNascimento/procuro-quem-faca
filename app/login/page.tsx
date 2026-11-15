// app/login/page.tsx

'use client'
import Link from 'next/link'
import AuthSkeleton from '@/components/auth/AuthSkeleton'
import GoogleButton from '@/components/auth/GoogleButton'
import { useLoginForm } from '@/hooks/useLoginForm'
import Logo from '@/components/Logo'

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

  // Tom calmo do restante da plataforma: texto de no mínimo 12px, sem caixa-alta,
  // contraste mínimo 4,5:1 e alvos de toque de 44px.
  const inputClass = (erro: boolean | string) =>
    `w-full p-4 lg:p-5 rounded-[1.25rem] border transition-all duration-300 outline-none text-slate-800 bg-slate-50/50 placeholder-slate-500 font-semibold text-sm lg:text-base ${
      erro
        ? 'border-red-500 bg-red-50 ring-4 ring-red-100'
        : 'border-slate-200 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-50/50 shadow-sm'
    }`

  return (
    <main className="min-h-screen bg-[#FDFDFD] flex flex-col items-center justify-center p-6 font-sans antialiased text-slate-600">
      {!mounted ? <AuthSkeleton /> : (
        <div className="w-full max-w-[420px] md:max-w-[480px] lg:max-w-[560px] bg-white px-8 pt-8 pb-10 md:px-12 md:pt-10 md:pb-12 lg:px-16 lg:pt-14 lg:pb-16 rounded-[3rem] shadow-[0_30px_60px_-15px_rgba(0,0,0,0.05)] border border-slate-50 text-center relative overflow-hidden animate-in fade-in zoom-in-95 duration-500">

          {/* Barra decorativa topo */}
          <div className="absolute top-0 left-0 right-0 h-1 md:h-1.5 bg-gradient-to-r from-blue-50 via-blue-400/30 to-blue-50" />

          {/* Logo — escala maior em telas grandes */}
          <div className="flex justify-center mb-5 lg:mb-6">
            <Link href="/" className="block transition-transform hover:opacity-80 active:scale-95">
              <Logo variant="auth" priority className="drop-shadow-sm" />
            </Link>
          </div>

          {/* Título */}
          <h1 className="text-xl md:text-2xl lg:text-[28px] font-semibold text-slate-900 mb-1 lg:mb-2 tracking-tight">
            Entrar ou Criar Conta
          </h1>

          <p className="text-slate-500 text-[13px] lg:text-[14px] font-semibold mb-2 lg:mb-3">
            Área do Profissional
          </p>

          <p className="text-slate-600 text-[13px] lg:text-[14px] font-medium mb-7 lg:mb-9 leading-relaxed">
            Use seu e-mail e senha abaixo.{' '}
            <span className="text-blue-700 font-semibold block md:inline mt-1 md:mt-0">Primeira vez? Sua conta será criada automaticamente.</span>
          </p>

          {/* Google — tela dedicada a profissionais: conta nova nasce como prestador */}
          <GoogleButton text="Entrar com Google" onLog={registrarLogAuth} roleDesejado="prestador" />

          {/* Divisor */}
          <div className="flex items-center gap-4 my-6 lg:my-8">
            <div className="h-px flex-grow bg-slate-200" />
            <span className="text-[12px] lg:text-[13px] font-medium text-slate-500">ou e-mail</span>
            <div className="h-px flex-grow bg-slate-200" />
          </div>

          <form onSubmit={handleLogin} className="flex flex-col gap-4 lg:gap-5 text-left">

            {/* E-mail */}
            <div className="flex flex-col gap-1.5 lg:gap-2">
              <label className="text-slate-600 font-semibold text-[12px] lg:text-[13px] ml-1">E-mail</label>
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
            <div className="flex flex-col gap-1.5 lg:gap-2">
              <div className="flex justify-between items-center ml-1 mr-1">
                <label className="text-slate-600 font-semibold text-[12px] lg:text-[13px]">Senha</label>
                <button
                  type="button"
                  onClick={handleEsqueciSenha}
                  className="inline-flex items-center min-h-[44px] text-[12px] lg:text-[13px] font-semibold text-blue-700 hover:text-blue-800 transition-colors"
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
                  aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                  className="absolute right-2 lg:right-3 top-1/2 -translate-y-1/2 min-w-[44px] min-h-[44px] flex items-center justify-center text-slate-500 hover:text-blue-700 transition-colors rounded-full"
                >
                  {showPassword ? (
                    <svg className="w-5 h-5 lg:w-6 lg:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5 lg:w-6 lg:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
              {!touched.password && (
                <p className="text-[12px] lg:text-[13px] text-slate-500 ml-1 font-medium">
                  Primeiro acesso? Escolha uma senha nova aqui.
                </p>
              )}
            </div>

            {/* Feedback */}
            {mensagem && (
              <div
                role="status"
                className={`p-4 lg:p-5 rounded-2xl text-[13px] lg:text-[14px] font-semibold text-center animate-in fade-in duration-300 ${
                  mensagem.includes('Erro')
                    ? 'bg-red-50 text-red-700 border border-red-100'
                    : 'bg-blue-50 text-blue-700 border border-blue-100'
                }`}
              >
                {mensagem}
              </div>
            )}

            {/* Botão */}
            <button
              type="submit"
              disabled={loading}
              className="w-full min-h-[44px] py-4 lg:py-5 bg-blue-600 text-white rounded-[1.5rem] font-semibold shadow-lg shadow-blue-100 hover:bg-blue-700 hover:-translate-y-0.5 active:scale-[0.98] transition-all mt-2 lg:mt-4 text-[15px] lg:text-[16px] flex items-center justify-center gap-2"
            >
              {loading
                ? <div className="w-5 h-5 lg:w-6 lg:h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                : 'Entrar / Criar Conta'
              }
            </button>
          </form>

          <Link
            href="/"
            className="inline-flex items-center justify-center min-h-[44px] mt-6 lg:mt-8 text-slate-600 font-semibold text-[13px] lg:text-[14px] hover:text-blue-700 transition-colors"
          >
            ← Voltar para a busca
          </Link>

        </div>
      )}
    </main>
  )
}
