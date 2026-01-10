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

  // Função mestre de busca (aceita um termo direto ou usa o que está no input)
  async function executarBusca(termoManual = null) {
    const termoFinal = termoManual !== null ? termoManual : busca;
    if (!termoFinal.trim()) return;

    setCarregando(true)
    try {
      const { data, error } = await supabase.from('prestadores').select('*')
      
      if (data) {
        const filtrados = data.filter(p => 
          p.nome.toLowerCase().includes(termoFinal.toLowerCase()) || 
          p.categoria.toLowerCase().includes(termoFinal.toLowerCase())
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

  // Função para quando clica nas categorias sugestões
  function clicarCategoria(cat) {
    setBusca(cat);
    executarBusca(cat);
  }

  return (
    <main className="min-h-screen bg-white flex flex-col p-4 md:p-6 text-slate-900">
      
      {/* HEADER - Botão de Cadastro (z-50 para não ficar atrás de nada) */}
      <header className="w-full max-w-6xl mx-auto flex justify-end items-center h-12 relative z-50">
        <Link 
          href="/cadastro" 
          className="text-[10px] md:text-xs font-black uppercase tracking-widest text-blue-600 border-2 border-blue-600/20 bg-blue-50/30 px-4 py-2 rounded-full hover:bg-blue-600 hover:text-white transition-all active:scale-95 shadow-sm"
        >
          Anunciar meu Serviço
        </Link>
      </header>

      {/* ÁREA CENTRAL - Ajustada para Mobile e Desktop */}
      <div className={`flex flex-col items-center transition-all duration-1000 ease-in-out w-full
        ${mostrarResultados ? 'mt-4' : 'mt-16 md:mt-0 md:flex-grow md:justify-center md:-mt-12'}`}
      >
        
        {/* LOGO */}
        <div className={`transition-all duration-700 w-full flex justify-center px-8 ${mostrarResultados ? 'mb-4 scale-75' : 'mb-6 md:mb-8 scale-100'}`}>
          <img 
            src="/logo.png" 
            alt="Logo" 
            className="w-full max-w-[240px] md:max-w-[450px] h-auto object-contain" 
          />
        </div>

        {/* BARRA DE BUSCA */}
        <div className="w-full max-w-2xl relative shadow-2xl rounded-full mb-6 mx-auto px-2 md:px-0">
          <input 
            type="text" 
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && executarBusca()}
            placeholder="O que você precisa?" 
            className="w-full p-3.5 md:p-5 pl-6 md:pl-8 rounded-full border border-slate-100 outline-none focus:ring-2 focus:ring-blue-500 text-sm md:text-lg shadow-inner bg-slate-50/50 text-slate-800"
          />
          <button 
            onClick={() => executarBusca()}
            className="absolute right-3.5 top-2 md:right-2.5 md:top-2.5 bg-blue-600 text-white px-5 md:px-8 py-2 md:py-3 rounded-full font-bold text-xs md:text-base hover:bg-blue-700 active:scale-95 transition-all shadow-md"
          >
            {carregando ? '...' : 'Buscar'}
          </button>
        </div>

        {/* CATEGORIAS RÁPIDAS (Só aparecem no início) */}
        {!mostrarResultados && (
          <div className="w-full max-w-xl px-2 animate-in fade-in zoom-in duration-700">
            <p className="text-center text-slate-400 text-[9px] font-black uppercase tracking-widest mb-4">Principais Serviços</p>
            <div className="flex flex-wrap justify-center gap-2">
              {CATEGORIAS_OFICIAIS.slice(0, 6).map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => clicarCategoria(cat)}
                  className="bg-white text-slate-600 px-4 py-2 rounded-full text-[10px] md:text-xs font-bold border border-slate-200 hover:border-blue-300 hover:text-blue-600 transition-all shadow-sm active:scale-90"
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* RESULTADOS */}
      {mostrarResultados && (
        <div className="w-full max-w-5xl mx-auto mt-8 pb-20 animate-in slide-in-from-bottom-8 duration-700">
          <div className="flex justify-between items-center mb-8 px-4 border-b border-slate-100 pb-4">
            <span className="text-slate-400 font-bold text-[10px] uppercase">
              {prestadores.length} resultados encontrados
            </span>
            <button 
              onClick={() => {setMostrarResultados(false); setBusca('')}}
              className="text-blue-600 text-xs font-bold hover:underline"
            >
              Limpar busca
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 px-4">
            {prestadores.map((p) => (
              <div key={p.id} className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col hover:shadow-xl transition-all duration-300 group">
                
                {/* FOTO E CATEGORIA NO CARD */}
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-14 h-14 rounded-2xl overflow-hidden bg-slate-100 border border-slate-50 flex-shrink-0 shadow-inner">
                    {p.foto_url ? (
                      <img 
                        src={p.foto_url} 
                        alt={p.nome} 
                        className="w-full h-full object-cover"
                        onError={(e) => { e.target.src = `https://ui-avatars.com/api/?name=${p.nome}&background=DBEAFE&color=2563EB` }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-blue-50 text-blue-400 font-bold text-xl uppercase">
                        {p.nome.charAt(0)}
                      </div>
                    )}
                  </div>
                  <span className="bg-blue-50 text-blue-600 text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-widest">
                    {p.categoria}
                  </span>
                </div>

                <h3 className="text-xl font-bold text-slate-800 mb-1 group-hover:text-blue-600 transition-colors">{p.nome}</h3>
                <p className="text-slate-500 text-xs mb-6 leading-relaxed flex-grow line-clamp-3">{p.bio}</p>
                <a 
                  href={`https://wa.me/${p.whatsapp?.replace(/\D/g, '')}`} 
                  target="_blank"
                  className="w-full bg-green-500 text-white text-center py-4 rounded-2xl font-bold text-sm shadow-lg shadow-green-100 hover:bg-green-600 active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  WhatsApp
                </a>
              </div>
            ))}
          </div>
          
          {prestadores.length === 0 && (
            <div className="text-center mt-20">
              <p className="text-slate-400 italic">Nenhum profissional encontrado.</p>
            </div>
          )}
        </div>
      )}
    </main>
  )
}