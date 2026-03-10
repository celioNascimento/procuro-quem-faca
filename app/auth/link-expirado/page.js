'use client'
import { useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function LinkExpirado() {
  const router = useRouter()

  useEffect(() => {
    const registrarLinkExpirado = async () => {
      try {
        await supabase.from('logs_atividades').insert([{
          acao: 'LINK_RECUPERACAO_EXPIRADO',
          entidade_tipo: 'seguranca',
          detalhes: { 
            url_tentativa: window.location.href,
            agente: window.navigator.userAgent,
            motivo: 'Token expirado, inválido ou sessão corrompida' 
          }
        }])
      } catch (err) {
        console.warn('Falha ao registrar log de auditoria.')
      }
    }
    registrarLinkExpirado()
  }, [])

  return (
    <main className="min-h-screen bg-[#FDFDFD] flex flex-col items-center justify-center p-6 font-sans antialiased text-slate-600">
      <div className="w-full max-w-[420px] text-center animate-in fade-in zoom-in-95 duration-700">
        
        {/* LOGO MONUMENTAL */}
        <div className="relative z-20 -mb-28 md:-mb-36">
          <Link href="/">
            <img 
              src="/logo.png" 
              alt="Logo Procuro Quem Faça" 
              className="h-80 md:h-[400px] w-auto mx-auto object-contain drop-shadow-sm select-none" 
            />
          </Link>
        </div>

        {/* CARD DE STATUS */}
        <div className="w-full bg-white rounded-[3.5rem] p-10 md:p-14 border border-slate-50 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.05)] space-y-8 relative z-10 overflow-hidden">
          {/* Linha de Identidade Superior */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-50 via-blue-500/10 to-blue-50" />
          
          <div className="space-y-4 pt-4">
            <div className="inline-flex items-center gap-2 bg-amber-50 text-amber-600 px-5 py-2 rounded-full border border-amber-100/50">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
              </span>
              <span className="text-[10px] font-black uppercase tracking-[0.2em]">Sessão Expirada</span>
            </div>
            
            <h1 className="text-3xl font-black text-slate-900 tracking-tighter uppercase italic leading-none">
              Link Inativo<span className="text-blue-600">.</span>
            </h1>
            
            <p className="text-slate-400 text-[11px] font-bold uppercase tracking-[0.2em] max-w-xs mx-auto leading-relaxed italic">
              O protocolo de segurança perdeu a validade ou já foi processado anteriormente.
            </p>
          </div>

          <div className="h-px w-full bg-slate-50" />

          <div className="space-y-6">
            <div className="text-6xl grayscale opacity-10 select-none py-2">🔐</div>
            <p className="text-slate-400 text-[12px] font-medium leading-relaxed italic px-4">
              "Para garantir a integridade da sua conta, este acesso único foi invalidado. Por favor, inicie um novo processo de recuperação."
            </p>

            {/* BOTÃO AZUL OFICIAL - CORRIGIDO PARA IDENTIDADE DO APP */}
            <button
              onClick={() => router.push('/login')}
              className="w-full py-6 bg-blue-600 text-white rounded-[2rem] font-black text-[11px] uppercase tracking-[0.2em] shadow-[0_20px_40px_-10px_rgba(37,99,235,0.4)] hover:bg-blue-700 hover:-translate-y-0.5 active:scale-95 transition-all italic text-center"
            >
              Solicitar Novo Acesso
            </button>
          </div>
        </div>
        
        <footer className="mt-12 flex flex-col items-center gap-3">
          <div className="h-px w-8 bg-slate-100" />
          <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.3em] italic leading-none">
            Procuro Quem Faça • Camada de Proteção
          </p>
        </footer>
      </div>
    </main>
  )
}
