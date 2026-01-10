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

  async function buscar() {
    if (!busca.trim()) return;
    setCarregando(true)
    
    try {
      const { data, error } = await supabase.from('prestadores').select('*')
      
      if (data) {
        const filtrados = data.filter(p => 
          p.nome.toLowerCase().includes(busca.toLowerCase()) || 
          p.categoria.toLowerCase().includes(busca.toLowerCase())
        )
        setPrestadores(filtrados)
        setMostrarResultados(true)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setCarregando(false)
    }
  }

  return (
    <main className="min-h-screen bg-white flex flex-col p-4 md:p-6 text-slate-900">
      
      {/* HEADER - Versão com Z-Index para garantir o clique */}
      <header className="w-full max-w-6xl mx-auto flex justify-end items-center h-12 relative z-50">
        <Link 
          href="/cadastro" 
          className="text-[10px] md:text-xs font-black uppercase tracking-widest text-blue-600 border-2 border-blue-600/20 bg-blue-50/30 px-4 py-2 rounded-full hover:bg-blue-600 hover:text-white transition-all active:scale-95 shadow-sm cursor-pointer"
        >
          Anunciar meu Serviço
        </Link>
      </header>

      {/* ÁREA CENTRAL - Ajustada para ficar mais alta no Mobile */}
        <div className={`flex flex-col items-center transition-all duration-1000 ease-in-out w-full
          ${mostrarResultados 
            ? 'mt-4' 
            : 'mt-16 md:mt-0 md:flex-grow md:justify-center md:-mt-12'
          }`}
        >
        
        {/* LOGO - Tamanho ajustado */}
        <div className={`transition-all duration-700 w-full flex justify-center px-8 ${mostrarResultados ? 'mb-4 scale-75' : 'mb-8 scale-100'}`}>
          <img 
            src="/logo.png" 
            alt="Logo" 
            className="w-full max-w-[280px] md:max-w-[450px] h-auto object-contain" 
          />
        </div>

        {/* BARRA DE BUSCA - Compacta e Centralizada */}
        <div className="w-full max-w-2xl relative shadow-2xl rounded-full mb-6 mx-auto">
          <input 
            type="text" 
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && buscar()}
            placeholder="O que você precisa?" 
            className="w-full p-3.5 md:p-5 pl-6 md:pl-8 rounded-full border border-slate-100 outline-none focus:ring-2 focus:ring-blue-500 text-sm md:text-lg shadow-inner bg-slate-50/50"
          />
        <button 
          onClick={buscar}
          className="absolute right-1.5 top-1.5 md:right-2 md:top-2 bg-blue-600 text-white px-5 md:px-8 py-2 md:py-3 rounded-full font-bold text-xs md:text-base hover:bg-blue-700 active:scale-95 transition-all shadow-md"
        >
          {carregando ? '...' : 'Buscar'}
        </button>
        </div>

        {/* CATEGORIAS RÁPIDAS - Só aparecem antes da busca */}
        {!mostrarResultados && (
          <div className="w-full max-w-xl px-2 animate-in fade-in zoom-in duration-700">
            <p className="text-center text-slate-400 text-[9px] font-black uppercase tracking-widest mb-4">Populares agora</p>
            <div className="flex flex-wrap justify-center gap-2">
              {CATEGORIAS_OFICIAIS.slice(0, 6).map((cat) => (
                <button
                  key={cat}
                  onClick={() => { setBusca(cat); setTimeout(buscar, 100); }}
                  className="bg-white text-slate-600 px-4 py-2 rounded-full text-[10px] md:text-xs font-bold border border-slate-200 hover:border-blue-300 hover:text-blue-600 transition-all shadow-sm active:scale-90"
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* RESULTADOS - Aparecem abaixo da busca */}
      {mostrarResultados && (
        <div className="w-full max-w-5xl mx-auto mt-8 pb-20 animate-in slide-in-from-bottom-8 duration-700">
          <div className="flex justify-between items-center mb-8 px-4 border-b border-slate-100 pb-4">
            <span className="text-slate-400 font-bold text-[10px] uppercase tracking-tighter">
              {prestadores.length} profissionais encontrados
            </span>
            <button 
              onClick={() => {setMostrarResultados(false); setBusca('')}}
              className="text-blue-600 text-xs font-bold hover:underline"
            >
              Limpar Tudo
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 px-4">
            {prestadores.map((p) => (
              <div key={p.id} className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group">
                <span className="bg-blue-50 text-blue-600 text-[9px] font-black px-3 py-1 rounded-full uppercase w-fit mb-4">
                  {p.categoria}
                </span>
                <h3 className="text-xl font-bold text-slate-800 mb-2 group-hover:text-blue-600 transition-colors">{p.nome}</h3>
                <p className="text-slate-500 text-xs mb-6 leading-relaxed flex-grow line-clamp-3">{p.bio}</p>
                <a 
                  href={`https://wa.me/${p.whatsapp?.replace(/\D/g, '')}`} 
                  target="_blank"
                  className="w-full bg-green-500 text-white text-center py-4 rounded-2xl font-bold text-sm shadow-lg shadow-green-100 hover:bg-green-600 active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                  Chamar no WhatsApp
                </a>
              </div>
            ))}
          </div>
          
          {prestadores.length === 0 && (
            <div className="text-center mt-20">
              <p className="text-slate-400 italic">Nenhum profissional encontrado com esse termo.</p>
            </div>
          )}
        </div>
      )}
    </main>
  )
}