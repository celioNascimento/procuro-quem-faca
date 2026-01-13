'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { CATEGORIAS_OFICIAIS } from '@/lib/categorias'
import Link from 'next/link'

export default function Home() {
  const [busca, setBusca] = useState('')
  const [prestadores, setPrestadores] = useState([])
  const [loading, setLoading] = useState(false)
  const [mostrarResultados, setMostrarResultados] = useState(false)

  const SUGESTOES = [
    'Técnico de ar-condicionado',
    'Eletricista',
    'Encanador',
    'Pintor',
    'Diarista',
    'Mecânico'
  ]

  async function buscarPrestadores(termo = busca) {
    setLoading(true)
    setMostrarResultados(true)

    let query = supabase.from('prestadores').select('*')

    if (termo) {
      query = query.or(`nome.ilike.%${termo}%,categoria.ilike.%${termo}%,cidade.ilike.%${termo}%,bio.ilike.%${termo}%`)
    }

    const { data, error } = await query
    if (!error) setPrestadores(data)
    setLoading(false)
  }

  const clicarCategoria = (cat) => {
    setBusca(cat)
    buscarPrestadores(cat)
  }

  return (
    <main className="min-h-screen bg-white flex flex-col items-center">
      
      {/* SEÇÃO INICIAL: LOGO + BUSCA */}
      <section className="w-full max-w-xl px-6 pt-16 md:pt-24 pb-10 flex flex-col items-center text-center">
        
        {/* LOGO CENTRALIZADA */}
        <div className="mb-10 md:mb-14">
          <Link href="/">
            <img 
              src="/logo.png" 
              alt="Logo" 
              className="h-20 md:h-36 w-auto object-contain transition-transform hover:scale-105" 
            />
          </Link>
        </div>

        {/* BARRA DE BUSCA REDIMENSIONADA PARA MOBILE */}
        <div className="w-full relative mb-8 group">
          <input
            type="text"
            placeholder="O que você precisa hoje?"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && buscarPrestadores()}
            className="w-full p-4 md:p-7 rounded-[1.5rem] md:rounded-[2.5rem] border border-slate-100 bg-slate-50 shadow-xl shadow-blue-100/30 outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 text-sm md:text-lg transition-all"
          />
          <button 
            onClick={() => buscarPrestadores()}
            className="absolute right-2 top-2 md:right-3 md:top-3 bg-blue-600 text-white px-5 py-2 md:px-8 md:py-4 rounded-[1.1rem] md:rounded-[1.8rem] font-black text-[10px] md:text-xs hover:bg-blue-700 active:scale-95 transition-all shadow-md shadow-blue-600/20"
          >
            BUSCAR
          </button>
        </div>

        {/* CATEGORIAS RÁPIDAS */}
        {!mostrarResultados && (
          <div className="flex flex-wrap justify-center gap-2 mb-10">
            {SUGESTOES.map((cat) => (
              <button
                key={cat}
                onClick={() => clicarCategoria(cat)}
                className="bg-white text-slate-500 px-4 py-2 md:px-5 md:py-2.5 rounded-full text-[9px] md:text-[10px] font-black border border-slate-200 hover:border-blue-500 hover:text-blue-600 transition-all shadow-sm uppercase tracking-wider"
              >
                {cat}
              </button>
            ))}
          </div>
        )}

        {/* BOTÃO ANUNCIAR */}
        {!mostrarResultados && (
          <Link 
            href="/login" 
            className="bg-blue-50 text-blue-600 px-8 py-4 md:px-10 md:py-5 rounded-[1.5rem] md:rounded-[2rem] text-[10px] md:text-[11px] font-black uppercase tracking-[0.2em] hover:bg-blue-600 hover:text-white transition-all shadow-sm active:scale-95 border border-blue-100"
          >
            Quero anunciar meu serviço
          </Link>
        )}
      </section>

      {/* RESULTADOS DA BUSCA (HORIZONTALMENTE AMPLIADOS) */}
      {mostrarResultados && (
        <section className="w-full max-w-4xl px-6 pb-24 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex justify-between items-center mb-6 border-b border-slate-50 pb-4">
            <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
              {loading ? 'Consultando...' : `${prestadores.length} encontrados`}
            </h2>
            <button 
              onClick={() => {setMostrarResultados(false); setBusca('');}} 
              className="text-blue-600 text-[10px] font-black uppercase tracking-widest hover:underline"
            >
              ✕ Limpar Busca
            </button>
          </div>

          <div className="flex flex-col gap-3">
            {prestadores.map((p) => (
              <div key={p.id} className="bg-white border border-slate-100 p-3 md:p-4 rounded-[20px] shadow-sm hover:shadow-md transition-all flex items-center gap-4">
                
                {/* Imagem Compacta */}
                <div className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-slate-100 overflow-hidden border border-slate-50 flex-shrink-0 shadow-sm">
                  <img 
                    src={p.foto_url || `https://ui-avatars.com/api/?name=${p.nome}&background=DBEAFE&color=2563EB`} 
                    className="w-full h-full object-cover"
                    alt={p.nome}
                    onError={(e) => { e.target.src = `https://ui-avatars.com/api/?name=${p.nome}&background=DBEAFE&color=2563EB` }}
                  />
                </div>

                {/* Conteúdo Otimizado */}
                <div className="flex-grow min-w-0 flex flex-col md:flex-row md:items-center justify-between gap-2 md:gap-4">
                  <div className="truncate md:max-w-[35%]">
                    <h3 className="font-black text-slate-800 text-sm md:text-base leading-tight truncate">{p.nome}</h3>
                    <span className="text-blue-600 text-[8px] md:text-[9px] font-black uppercase tracking-widest">{p.categoria}</span>
                    <span className="text-slate-400 text-[8px] md:text-[9px] font-bold uppercase block">📍 {p.cidade}</span>
                  </div>
                  
                  <p className="text-slate-500 text-[11px] md:text-xs line-clamp-1 md:line-clamp-2 font-medium leading-snug flex-grow max-w-md hidden sm:block">
                    {p.bio}
                  </p>
                  
                  <div className="flex-shrink-0">
                    <a 
                      href={`https://wa.me/55${p.whatsapp?.replace(/\D/g, '')}`} 
                      target="_blank"
                      className="bg-[#25D366] text-white px-4 py-1.5 md:px-5 md:py-2 rounded-lg text-[9px] md:text-[10px] font-black hover:bg-[#20bd5a] transition-all flex items-center gap-2 uppercase shadow-sm shadow-green-100"
                    >
                      WhatsApp
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {prestadores.length === 0 && !loading && (
            <div className="text-center py-20 text-slate-400 font-bold uppercase text-[10px] tracking-widest">
              Nenhum profissional encontrado.
            </div>
          )}
        </section>
      )}
    </main>
  )
}