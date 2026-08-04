//app/not-found.js

'use client'
import { useEffect } from 'react'
import { insertLog } from '@/lib/db/logs'

export default function NotFound() {

  useEffect(() => {
    // Registro de Log Automático para Auditoria de Erros
    const registrarErro404 = async () => {
      try {
        await insertLog({
           acao: 'PAGINA_NAO_ENCONTRADA',
          entidadeTipo: 'erro_404',
           detalhes: {
             url: window.location.href,
            user_agent: navigator.userAgent,
           },
         })
      } catch (err) {
        console.warn('Falha ao registrar log de erro técnico.')
      }
    }
    registrarErro404()
  }, [])

  return (
    <main className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-6 font-sans antialiased">
      <div className="w-full max-w-md text-center animate-in fade-in zoom-in-95 duration-500">
        
        <header className="mb-5">
          
          {/* LOGO: 
              - h-[320px] mantido para autoridade visual.
              - mb-[-2rem] para aproximar drasticamente os elementos abaixo (redução de padding).
              - relative z-10 para garantir que a imagem não sobreponha a interação.
          */}
          <img 
            src="/logo.png" 
            alt="Logo Procuro Quem Faça" 
            className="h-[320px] w-auto mx-auto -mb-8 md:-mb-12 object-contain drop-shadow-sm relative z-10" 
          />
          
          <div className="relative z-20">
            <span className="bg-blue-50 text-blue-600 px-4 py-1 rounded-full text-[9px] font-black uppercase tracking-[0.2em] border border-blue-100">
              Erro 404
            </span>
            
            <h1 className="text-3xl font-black text-slate-900 tracking-tighter uppercase italic mt-4 leading-none">
              Rastro Perdido<span className="text-blue-600">.</span>
            </h1>
            
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.2em] mt-3">
              O conteúdo solicitado não foi localizado no servidor.
            </p>
          </div>
        </header>

        <div className="bg-white rounded-[2.5rem] p-10 border border-slate-100 shadow-xl shadow-blue-900/5 space-y-8 relative z-10">
          <div className="py-4">
            <div className="text-5xl mb-6 grayscale opacity-20">📡</div>
            <p className="text-slate-500 text-[11px] font-bold uppercase leading-relaxed italic">
              Não se preocupe, a sincronização foi interrompida, mas podemos restabelecer o acesso à vitrine principal agora mesmo.
            </p>
          </div>

          <button
            onClick={() => window.location.href = '/'}
            className="block w-full py-6 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] transition-all shadow-xl shadow-blue-100 active:scale-95 bg-blue-600 text-white hover:bg-blue-700 italic text-center"
          >
            Restabelecer Conexão
          </button>
        </div>
        
        <p className="mt-8 text-[8px] font-black text-slate-300 uppercase tracking-widest italic leading-none">
          ProcuroQuemFaça • Console de Gestão
        </p>
      </div>
    </main>
  )
}
