//app/recuperar-senha/page.tsx

'use client'
import Link from 'next/link'
import { ShieldCheck, AlertCircle } from 'lucide-react'
import { EyeIconButton } from '@/components/auth/EyeIconButton'
import { ForcaSenhaBar } from '@/components/auth/ForcaSenhaBar'
import { useNovaSenha } from '@/hooks/useNovaSenha'

export default function NovaSenha() {
  const {
    senha, setSenha, confirmarSenha, setConfirmarSenha,
    showSenha, setShowSenha, showConfirmar, setShowConfirmar,
    status, loading, isReady, linkValido, mounted,
    senhasPreenchidas, senhasIguais, senhaCurta, podeSubmeter,
    handleSubmit,
  } = useNovaSenha()

  if (!mounted || !isReady) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-6 text-center gap-5">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Verificando link...</p>
      </div>
    )
  }

  const inputBase = 'w-full p-5 pr-14 rounded-[1.5rem] border transition-all duration-200 outline-none font-medium text-sm text-slate-900 placeholder-slate-300 shadow-sm'
  const inputOk   = 'border-slate-100 bg-slate-50 focus:bg-white focus:border-blue-400 focus:shadow-[0_0_0_3px_rgba(59,130,246,0.08)]'
  const inputErr  = 'border-amber-200 bg-amber-50/30 focus:border-amber-400'

  const statusEstilo: Record<string, string> = {
    erro:    'bg-red-50 text-red-600 border border-red-100',
    aviso:   'bg-amber-50 text-amber-600 border border-amber-100',
    sucesso: 'bg-green-50 text-green-600 border border-green-100',
    info:    'bg-blue-50 text-blue-600 border border-blue-100',
  }

  return (
    <main className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-6 font-sans antialiased">
      <div className="w-full max-w-[400px] flex flex-col items-center gap-6">

        <Link href="/" className="hover:opacity-80 active:scale-95 transition-all">
          <img src="/logo.png" alt="Procuro Quem Faça" className="h-12 w-auto object-contain" />
        </Link>

        <div className="w-full bg-white p-8 md:p-10 rounded-[3rem] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.07)] border border-slate-100 text-center">

          {linkValido ? (
            <>
              <div className="flex flex-col items-center gap-3 mb-8">
                <div className="w-14 h-14 bg-blue-50 rounded-[1.5rem] flex items-center justify-center">
                  <ShieldCheck size={26} className="text-blue-500" strokeWidth={2} />
                </div>
                <div>
                  <h2 className="text-xl font-black text-slate-800 tracking-tight">Nova senha</h2>
                  <p className="text-slate-400 text-[11px] font-semibold mt-1">Escolha uma senha segura para sua conta</p>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="flex flex-col gap-5 text-left">

                <div className="flex flex-col gap-1.5">
                  <div className="flex justify-between items-center px-1">
                    <label className="text-slate-500 font-bold text-[10px] uppercase tracking-widest">Nova Senha</label>
                    {senhaCurta && (
                      <span className="text-[9px] font-black text-amber-500 uppercase tracking-wide">
                        Mínimo 6 caracteres
                      </span>
                    )}
                  </div>
                  <div className="relative">
                    <input
                      type={showSenha ? 'text' : 'password'}
                      placeholder="Mínimo 6 caracteres"
                      required
                      value={senha}
                      onChange={e => setSenha(e.target.value)}
                      className={`${inputBase} ${senhaCurta ? inputErr : inputOk}`}
                    />
                    <EyeIconButton show={showSenha} toggle={() => setShowSenha(v => !v)} />
                  </div>
                  <ForcaSenhaBar senha={senha} />
                </div>

                <div className="flex flex-col gap-1.5">
                  <div className="flex justify-between items-center px-1">
                    <label className="text-slate-500 font-bold text-[10px] uppercase tracking-widest">Confirmar Senha</label>
                    {senhasPreenchidas && (
                      <span className={`text-[9px] font-black uppercase tracking-wide ${senhasIguais ? 'text-green-500' : 'text-amber-500'}`}>
                        {senhasIguais ? 'Senhas iguais ✓' : 'Ainda diferentes'}
                      </span>
                    )}
                  </div>
                  <div className="relative">
                    <input
                      type={showConfirmar ? 'text' : 'password'}
                      placeholder="Repita a senha"
                      required
                      value={confirmarSenha}
                      onChange={e => setConfirmarSenha(e.target.value)}
                      className={`${inputBase} ${senhasPreenchidas && !senhasIguais ? inputErr : inputOk}`}
                    />
                    <EyeIconButton show={showConfirmar} toggle={() => setShowConfirmar(v => !v)} />
                  </div>
                </div>

                {status.texto && (
                  <div className={`p-4 rounded-2xl text-[11px] font-semibold text-center ${statusEstilo[status.tipo] || statusEstilo.info} ${loading ? 'animate-pulse' : ''}`}>
                    {status.texto}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={!podeSubmeter}
                  className={`w-full py-5 rounded-[2rem] font-black text-[11px] uppercase tracking-[0.2em] transition-all ${
                    podeSubmeter
                      ? 'bg-blue-600 text-white hover:bg-blue-700 active:scale-[0.98] shadow-lg shadow-blue-100'
                      : 'bg-slate-100 text-slate-300 cursor-not-allowed'
                  }`}
                >
                  {loading ? 'Salvando...' : 'Confirmar nova senha'}
                </button>
              </form>
            </>
          ) : (
            <div className="flex flex-col items-center gap-6 py-2">
              <div className="w-14 h-14 bg-red-50 rounded-[1.5rem] flex items-center justify-center">
                <AlertCircle size={26} className="text-red-400" strokeWidth={2} />
              </div>
              <div>
                <h2 className="text-xl font-black text-slate-800 tracking-tight mb-1">Link inválido</h2>
                <p className="text-slate-400 text-[12px] font-medium leading-relaxed">
                  {status.texto || 'Este link não é mais válido.'}<br />
                  Solicite um novo link de recuperação.
                </p>
              </div>
              <Link
                href="/login"
                className="w-full py-5 bg-blue-600 text-white rounded-[2rem] font-black text-[11px] uppercase tracking-[0.2em] shadow-lg shadow-blue-100 hover:bg-blue-700 active:scale-95 transition-all text-center block"
              >
                Solicitar novo link
              </Link>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}