//components/meus-servicos/LoginGate.tsx

'use client'
import Link from 'next/link'
import { ShieldCheck, Briefcase } from 'lucide-react'
import { loginComGoogle } from '../../lib/services/painelCliente.service'

export default function LoginGate({ tokenUrl }: { tokenUrl: string | null }) {
  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="flex justify-center mb-4">
          <Link href="/">
            <img src="/logo.png" alt="Procuro Quem Faça" className="h-10 md:h-12 w-auto object-contain" />
          </Link>
        </div>

        <div className="bg-white rounded-[2.5rem] p-8 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.08)] border border-slate-50 text-center space-y-8">
          {tokenUrl ? (
            <div className="space-y-4">
              <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto text-blue-600">
                <Briefcase size={32} />
              </div>
              <h2 className="text-2xl font-black italic uppercase text-slate-800 tracking-tighter">
                Projeto<br />Identificado
              </h2>
              <p className="text-xs font-medium text-slate-500 leading-relaxed px-2">
                Para sua segurança, confirme sua identidade Google para vincular este projeto à sua conta.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto text-blue-600">
                <ShieldCheck size={32} />
              </div>
              <h2 className="text-2xl font-black italic uppercase text-slate-800 tracking-tighter">
                Portal do<br />Cliente
              </h2>
              <p className="text-xs font-medium text-slate-500 leading-relaxed px-4">
                Acesse seus contratos e acompanhe serviços em tempo real.
              </p>
            </div>
          )}

          <button
            onClick={() => loginComGoogle(tokenUrl)}
            className="w-full py-6 bg-blue-600 text-white rounded-3xl font-black italic uppercase text-[12px] tracking-widest hover:bg-blue-700 transition-all active:scale-[0.98] shadow-2xl shadow-blue-200/60"
          >
            Acessar com Google
          </button>
        </div>
      </div>
    </div>
  )
}