'use client'
import Link from 'next/link'

export default function NotFound() {
  return (
    <main className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-6 font-sans antialiased">
      <div className="w-full max-w-md text-center animate-in fade-in zoom-in-95 duration-500">
        <header className="mb-8">
          {/* Logo com opacidade suave conforme padrão */}
          <img src="/logo.png" alt="Logo" className="h-10 w-auto mx-auto mb-6 opacity-80" />
          
          <span className="bg-blue-50 text-blue-600 px-4 py-1 rounded-full text-[9px] font-black uppercase tracking-[0.2em] border border-blue-100">
            Erro 404
          </span>
          
          <h1 className="text-3xl font-black text-slate-900 tracking-tighter uppercase italic mt-6 leading-none">
            Rastro Perdido<span className="text-blue-600">.</span>
          </h1>
          
          <p className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.2em] mt-3">
            O conteúdo solicitado não foi localizado no servidor.
          </p>
        </header>

        <div className="bg-white rounded-[2.5rem] p-10 border border-slate-100 shadow-xl shadow-blue-900/5 space-y-8">
          <div className="py-4">
            <div className="text-5xl mb-6 grayscale opacity-20">📡</div>
            <p className="text-slate-500 text-[11px] font-bold uppercase leading-relaxed italic">
              Não se preocupe, a sincronização foi interrompida, mas podemos restabelecer o acesso à vitrine principal agora mesmo.
            </p>
          </div>

          {/* Botão em Azul com Sombra Suave */}
          <Link
            href="/"
            className="block w-full py-6 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] transition-all shadow-xl shadow-blue-100 active:scale-95 bg-blue-600 text-white hover:bg-blue-700 italic text-center"
          >
            Restabelecer Conexão
          </Link>
        </div>
        
        <p className="mt-8 text-[8px] font-black text-slate-300 uppercase tracking-widest italic leading-none">
          ProcuroQuemFaça • Console de Gestão
        </p>
      </div>
    </main>
  )
}