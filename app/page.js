'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { CATEGORIAS_OFICIAIS } from '@/lib/categorias'

export default function Home() {
  const [busca, setBusca] = useState('')
  const [prestadores, setPrestadores] = useState([])
  const [mostrarResultados, setMostrarResultados] = useState(false)
  const [carregando, setCarregando] = useState(false)

  async function buscar() {
    if (!busca.trim()) return;
    setCarregando(true)
    
    let query = supabase.from('prestadores').select('*')
    const palavras = busca.trim().split(/\s+/)

    palavras.forEach(palavra => {
      query = query.or(`nome.ilike.%${palavra}%,categoria.ilike.%${palavra}%`)
    })

    const { data, error } = await query
    if (data) {
      setPrestadores(data)
      setMostrarResultados(true)
    }
    setCarregando(false)
  }

  return (
    <main className="min-h-screen bg-white flex flex-col items-center p-4 md:p-6 text-slate-900">
      
      {/* CONTAINER DE BUSCA */}
      <div className={`transition-all duration-700 flex flex-col items-center w-full max-w-2xl ${mostrarResultados ? 'mt-4 mb-6' : 'mt-20 mb-0'}`}>
        
        {/* LOGO - Ajustada para mobile */}
        <div className="mb-6 flex justify-center w-full px-4">
          <img 
            src="/logo.png" 
            alt="Logo" 
            className="w-full max-w-[300px] md:max-w-[500px] h-auto object-contain" 
          />
        </div>

        {/* BARRA DE BUSCA - Compacta no Mobile */}
        <div className="w-full relative shadow-lg rounded-full mb-6">
          <input 
            type="text" 
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && buscar()}
            placeholder="O que você precisa?" 
            className="w-full p-4 md:p-5 pl-6 md:pl-8 rounded-full border border-slate-100 outline-none focus:ring-2 focus:ring-blue-500 text-base md:text-xl"
          />
          <button 
            onClick={buscar}
            className="absolute right-2 top-1.5 md:top-2.5 bg-blue-600 text-white px-5 md:px-8 py-2.5 md:py-3 rounded-full font-bold text-sm md:text-base hover:bg-blue-700 active:scale-95 transition-all"
          >
            {carregando ? '...' : 'Buscar'}
          </button>
        </div>

        {/* CATEGORIAS RÁPIDAS - Ajustadas para não quebrar layout */}
        {!mostrarResultados && (
          <div className="w-full px-2">
            <p className="text-center text-slate-400 text-[10px] font-black uppercase tracking-widest mb-4">Populares</p>
            <div className="flex flex-wrap justify-center gap-2">
              {CATEGORIAS_OFICIAIS.slice(0, 6).map((cat) => (
                <button
                  key={cat}
                  onClick={() => { setBusca(cat); setTimeout(buscar, 100); }}
                  className="bg-slate-50 text-slate-600 px-3 py-1.5 rounded-full text-[11px] font-bold border border-slate-100 active:bg-blue-600 active:text-white"
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* RESULTADOS - Grid corrigido para Mobile */}
      {mostrarResultados && (
        <div className="w-full max-w-5xl pb-20">
          <div className="flex justify-between items-center mb-6 px-2">
            <h2 className="text-slate-400 font-bold text-[10px] uppercase">Resultados</h2>
            <button 
              onClick={() => {setMostrarResultados(false); setBusca('')}}
              className="text-blue-600 text-xs font-bold"
            >
              Limpar
            </button>
          </div>

          {/* Grid: 1 coluna no mobile, 2 no tablet, 3 no desktop */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {prestadores.map((p) => (
              <div key={p.id} className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex flex-col">
                <span className="bg-blue-50 text-blue-600 text-[10px] font-black px-3 py-1 rounded-full uppercase w-fit mb-3">
                  {p.categoria}
                </span>
                <h3 className="text-lg font-bold text-slate-800 mb-1">{p.nome}</h3>
                <p className="text-slate-500 text-xs mb-5 leading-relaxed flex-grow">{p.bio}</p>
                <a 
                  href={`https://wa.me/${p.whatsapp?.replace(/\D/g, '')}`} 
                  target="_blank"
                  className="w-full bg-green-500 text-white text-center py-3.5 rounded-2xl font-bold text-sm shadow-md active:scale-95 transition-all"
                >
                  WhatsApp
                </a>
              </div>
            ))}
          </div>
          
          {prestadores.length === 0 && (
            <div className="text-center mt-10">
              <p className="text-slate-400 italic">Nenhum profissional encontrado.</p>
            </div>
          )}
        </div>
      )}
    </main>
  )
}