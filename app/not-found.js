'use client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function NotFound() {
  const router = useRouter()

  return (
    <main className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-6 font-sans">
      <div className="w-full max-w-md text-center">
        <header className="mb-8">
          <img src="/logo.png" alt="Logo" className="h-12 w-auto mx-auto mb-6" />
          <span className="bg-blue-100 text-blue-600 px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
            Erro 404
          </span>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight uppercase italic mt-4">
            Página Não Encontrada
          </h1>
          <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-2">
            O conteúdo que você procura foi movido ou não existe mais.
          </p>
        </header>

        <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-xl space-y-6">
          <div className="py-4">
            <div className="text-6xl mb-4">🔍</div>
            <p className="text-slate-600 text-sm font-medium">
              Não se preocupe, acontece com os melhores. Vamos levar você de volta para um lugar seguro.
            </p>
          </div>

          <button
            onClick={() => router.push('/')}
            className="w-full py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all shadow-lg active:scale-95 bg-blue-600 text-white hover:bg-blue-700 shadow-blue-100"
          >
            Voltar para o Início
          </button>
        </div>
      </div>
    </main>
  )
}