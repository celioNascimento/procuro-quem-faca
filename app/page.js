'use client'
import { useState } from 'react'
import Link from 'next/link'

export default function Home() {
  const [busca, setBusca] = useState('')

  const SUGESTOES = [
    'Eletricista',
    'Encanador',  
    'Pintor',
    'Diarista',
    'Mecânico'
  ]

  const dispararBusca = (e) => {
    if (e) e.preventDefault()
    const termo = busca.trim()
    
    if (termo) {
      window.location.href = `/prestadores?q=${encodeURIComponent(termo)}`
    } else {
      window.location.href = '/prestadores'
    }
  }

  return (
    <main className="min-h-screen bg-white flex flex-col items-center font-sans overflow-x-hidden">
      
      <section className="w-full max-w-[90%] md:max-w-xl px-4 pt-12 md:pt-28 pb-10 flex flex-col items-center text-center">
        
        {/* LOGO - Ajustada para não dominar demais a tela */}
        <div className="mb-10 md:mb-14">
          <Link href="/">
            <img 
              src="/logo.png" 
              alt="Logo" 
              className="h-16 md:h-32 w-auto object-contain transition-transform" 
            />
          </Link>
        </div>

        {/* BARRA DE BUSCA - Altura "Ligeiramente Menor" (h-14 no mobile, h-18 no PC) */}
        <form onSubmit={dispararBusca} className="w-full relative mb-8">
          <input
            type="text"
            placeholder="O que você precisa hoje?"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="w-full h-14 md:h-18 pl-6 pr-28 md:pr-36 rounded-2xl md:rounded-[1.8rem] border-2 border-slate-100 bg-slate-50 shadow-lg shadow-blue-50/50 outline-none focus:border-blue-500 text-slate-700 text-sm md:text-lg transition-all"
          />
          <button 
            type="submit"
            className="absolute right-2 top-2 bottom-2 md:right-2.5 md:top-2.5 md:bottom-2.5 bg-blue-600 text-white px-5 md:px-8 rounded-xl md:rounded-[1.3rem] font-black text-[10px] md:text-[11px] uppercase tracking-widest active:scale-95 transition-all shadow-md hover:bg-blue-700"
          >
            BUSCAR
          </button>
        </form>

        {/* SUGESTÕES - Ajustadas para acompanhar o novo tamanho */}
        <div className="flex flex-wrap justify-center gap-2 md:gap-3 mb-12">
          {SUGESTOES.map((cat) => (
            <button 
              key={cat} 
              onClick={() => window.location.href = `/prestadores?q=${encodeURIComponent(cat)}`} 
              className="bg-white text-slate-400 px-4 py-2 md:px-5 md:py-2.5 rounded-full text-[9px] md:text-[10px] font-black border border-slate-100 uppercase hover:text-blue-600 hover:border-blue-200 transition-all shadow-sm active:bg-blue-50"
            >
              {cat}
            </button>
          ))}
        </div>

        {/* BOTÃO ANUNCIAR */}
        <Link 
          href="/login" 
          className="w-full md:w-auto bg-blue-50 text-blue-600 px-10 py-5 md:px-14 md:py-5 rounded-2xl md:rounded-[1.8rem] text-[10px] md:text-[11px] font-black uppercase tracking-[0.2em] hover:bg-blue-600 hover:text-white transition-all border border-blue-100 text-center shadow-sm active:scale-95"
        >
          Anunciar meu Serviço
        </Link>
      </section>

      {/* FOOTER */}
      <footer className="mt-auto py-10 text-center px-4">
        <p className="text-[9px] md:text-[10px] font-black text-slate-300 uppercase tracking-[0.4em]">
          Londrina e Região
        </p>
      </footer>
     
    </main> 
  )
}