// app/error.tsx

'use client'
import { useEffect } from 'react'
import { insertLog } from '@/lib/db/logs'

export default function Erro400({ reset }: { error: Error & { digest?: string }; reset: () => void }) {

  useEffect(() => {
    // Log de Erro de Requisição (Bad Request)
    const registrarErro400 = async () => {
      try {
        await insertLog({
          acao: 'ERRO_400_BAD_REQUEST',
          entidadeTipo: 'erro_tecnico',
          detalhes: {
            url: window.location.href,
            timestamp: new Date().toISOString(),
            mensagem: 'Requisição malformada ou cabeçalhos inválidos',
          },
        })
      } catch (err) {
        console.warn('Falha ao registrar log de erro 400.')
      }
    }
    registrarErro400()
  }, [])

  return (
    <main className="min-h-screen bg-[#FDFDFD] flex items-center justify-center p-6 font-sans antialiased text-slate-600">
      <div className="w-full max-w-lg text-center animate-in fade-in zoom-in-95 duration-700">
        
        <header className="mb-2">
          {/* LOGO MONUMENTAL: h-[400px] para domínio visual total */}
          <img 
            src="/logo.png" 
            alt="Logo Procuro Quem Faça" 
            className="h-[400px] w-auto mx-auto -mb-24 md:-mb-32 object-contain drop-shadow-sm relative z-10" 
          />
          
          <div className="relative z-20 space-y-4">
            <div className="inline-flex items-center bg-slate-100 text-slate-500 px-5 py-2 rounded-full border border-slate-200 shadow-sm">
              <span className="text-[10px] font-black uppercase tracking-[0.2em]">Erro 400 • Bad Request</span>
            </div>
            
            <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase italic leading-none">
              Requisição<br />Inválida<span className="text-blue-600">.</span>
            </h1>
            
            <p className="text-slate-500 text-[11px] font-bold uppercase tracking-[0.2em] max-w-xs mx-auto leading-relaxed px-4">
              O servidor não conseguiu interpretar os dados enviados pelo seu navegador.
            </p>
          </div>
        </header>

        <div className="bg-white rounded-[3rem] p-10 md:p-14 border border-slate-100 shadow-[0_32px_64px_-12px_rgba(0,0,0,0.06)] space-y-10 relative z-10 mt-8">
          <div className="space-y-6">
            <div className="text-6xl grayscale opacity-10 select-none">🛠️</div>
            <p className="text-slate-400 text-[12px] font-medium leading-relaxed italic px-4">
              "A sincronização de dados falhou devido a um erro de comunicação. Isso pode ser causado por um link corrompido ou informações de sessão expiradas."
            </p>
          </div>

          <button
            onClick={reset}
            className="block w-full py-6 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] transition-all shadow-xl shadow-blue-100 active:scale-95 bg-blue-600 text-white hover:bg-blue-700 italic text-center"
          >
            Tentar Novamente
          </button>
        </div>
        
        <footer className="mt-12 flex flex-col items-center gap-2">
          <div className="h-px w-8 bg-slate-200" />
          <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest italic leading-none">
            ProcuroQuemFaça • Console de Diagnóstico
          </p>
        </footer>
      </div>
    </main>
  )
}