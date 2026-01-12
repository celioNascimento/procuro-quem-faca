'use client'
import { useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { CATEGORIAS_OFICIAIS } from '@/lib/categorias'

export default function Home() {
  const [busca, setBusca] = useState('')
  const [prestadores, setPrestadores] = useState([])
  const [mostrarResultados, setMostrarResultados] = useState(false)
  const [carregando, setCarregando] = useState(false)

  async function executarBusca(termoManual = null) {
    const termoFinal = termoManual !== null ? termoManual : busca;
    if (!termoFinal.trim()) return;

    setCarregando(true)
    try {
      const { data, error } = await supabase.from('prestadores').select('*')
      
      if (data) {
        const t = termoFinal.toLowerCase();
        const filtrados = data.filter(p => 
          p.nome?.toLowerCase().includes(t) || 
          p.categoria?.toLowerCase().includes(t) ||
          p.cidade?.toLowerCase().includes(t)
        )
        setPrestadores(filtrados)
        setMostrarResultados(true)
      }
      if (error) throw error
    } catch (err) {
      console.error("Erro na busca:", err)
    } finally {
      setCarregando(false)
    }
  }

  return (
    <main className={`flex flex-col bg-white p-4 md:p-6 text-slate-900 ${!mostrarResultados ? 'h-[calc(100vh-140px)] overflow-hidden' : 'min-h-screen'}`}>
      
      {/* BOTÃO DE ANUNCIAR NO TOPO */}
      <header className="w-full max-w-6xl mx-auto flex justify-end items-center mb-4">
        <Link 
          href="/cadastro" 
          className="text-[10px] font-black uppercase tracking-widest text-blue-600 border-2 border-blue-600/20 bg-blue-50/50 px-5 py-2.5 rounded-full hover:bg-blue-600 hover:text-white transition-all shadow-sm"
        >
          Anunciar Serviço
        </Link>
      </header>

      {/* ÁREA DA LOGO E BUSCA */}
      <div className={`flex flex-col items-center w-full transition-all duration-700 ${mostrarResultados ? 'mt-0' : 'flex-grow justify-center'}`}>
        
        {/* LOGO ADAPTÁVEL: Fica menor quando mostra resultados */}
        <div className={`text-center transition-all duration-700 ease-in-out ${mostrarResultados ? 'mb-4 scale-75 opacity-80' : 'mb-8 scale-100 opacity-100'}`}>
          <img 
            src="/logo.png" 
            alt="Logo AchePerto" 
            className={`${mostrarResultados ? 'h-16 md:h-20' : 'h-24 md:h-32'} w-auto mx-auto mb-2 object-contain transition-all duration-700`}
          />
          {!mostrarResultados}
        </div>

        {/* BARRA DE BUSCA */}
        <div className="w-full max-w-2xl px-2">
          <div className="relative shadow-xl rounded-full bg-slate-50 border border-slate-100">
            <input 
              type="text" 
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && executarBusca()}
              placeholder="Ex: Eletricista em Londrina" 
              className="w-full p-4 md:p-5 pl-6 md:pl-8 rounded-full outline-none bg-transparent text-slate-800 text-base"
            />
            <button 
              onClick={() => executarBusca()}
              className="absolute right-2 top-2 bottom-2 bg-blue-600 text-white px-6 md:px-10 rounded-full font-bold text-xs hover:bg-blue-700 transition-all active:scale-95 shadow-md"
            >
              {carregando ? '...' : 'Buscar'}
            </button>
          </div>
        </div>

        {/* CATEGORIAS RÁPIDAS (Somente na tela inicial) */}
        {!mostrarResultados && (
          <div className="mt-8 flex flex-wrap justify-center gap-2 max-w-xl px-4 pb-10">
            {CATEGORIAS_OFICIAIS.slice(0, 8).map((cat) => (
              <button
                key={cat}
                onClick={() => { setBusca(cat); executarBusca(cat); }}
                className="bg-white text-slate-500 px-4 py-2 rounded-full text-[10px] font-bold border border-slate-100 hover:border-blue-400 hover:text-blue-600 transition-all shadow-sm active:scale-95"
              >
                {cat}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* RESULTADOS EM FORMATO DE LISTA */}
      {mostrarResultados && (
        <div className="w-full max-w-5xl mx-auto mt-8 pb-32 animate-in slide-in-from-bottom-5 duration-700">
          <div className="flex justify-between items-center mb-6 px-4 border-b border-slate-100 pb-4">
            <span className="text-slate-400 font-bold text-[10px] uppercase tracking-widest">
              {prestadores.length} {prestadores.length === 1 ? 'resultado' : 'resultados'}
            </span>
            <button 
              onClick={() => {setMostrarResultados(false); setBusca(''); setPrestadores([]);}} 
              className="text-blue-600 text-xs font-bold hover:underline"
            >
              Limpar Busca
            </button>
          </div>

          <div className="flex flex-col gap-3 px-4">
            {prestadores.map((p) => (
              <div 
                key={p.id} 
                className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row items-center gap-4 group"
              >
                {/* AVATAR */}
                <div className="w-16 h-16 rounded-2xl bg-blue-50 overflow-hidden flex-shrink-0 border border-blue-50">
                  {p.foto_url ? (
                    <img src={p.foto_url} alt={p.nome} className="w-full h-full object-cover" onError={(e) => { e.target.src = `https://ui-avatars.com/api/?name=${p.nome}&background=DBEAFE&color=2563EB` }} />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-blue-500 font-black text-2xl uppercase">{p.nome.charAt(0)}</div>
                  )}
                </div>

                {/* INFO */}
                <div className="flex-grow text-center md:text-left">
                  <div className="flex flex-col md:flex-row md:items-center gap-1 md:gap-3">
                    <h3 className="text-lg font-bold text-slate-800">{p.nome}</h3>
                    <span className="text-[10px] font-black text-blue-600 uppercase bg-blue-50 px-2 py-0.5 rounded-full self-center md:self-auto">
                      {p.categoria}
                    </span>
                  </div>
                  <div className="flex items-center justify-center md:justify-start gap-1 mt-1 text-slate-400">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                    </svg>
                    <span className="text-[11px] font-bold uppercase tracking-wider">{p.cidade}</span>
                  </div>
                  <p className="text-slate-500 text-xs mt-2 line-clamp-1 max-w-xl italic">"{p.bio}"</p>
                </div>

                {/* BOTÃO WHATSAPP */}
                <div className="w-full md:w-auto">
                  <a 
                    href={`https://wa.me/${p.whatsapp?.replace(/\D/g, '')}`} 
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center bg-green-500 text-white px-8 py-3.5 rounded-2xl font-bold text-sm hover:bg-green-600 transition-all active:scale-95 w-full md:w-auto shadow-lg shadow-green-100"
                  >
                    WhatsApp
                  </a>
                </div>
              </div>
            ))}
          </div>

          {prestadores.length === 0 && (
            <div className="text-center py-20 text-slate-400 font-medium">
              Nenhum profissional encontrado.
            </div>
          )}
        </div>
      )}
    </main>
  )
}