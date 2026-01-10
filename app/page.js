'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { CATEGORIAS_OFICIAIS } from '@/lib/categorias'

export default function Home() {
  const [busca, setBusca] = useState('')
  const [prestadores, setPrestadores] = useState([])
  const [mostrarResultados, setMostrarResultados] = useState(false)
  const [carregando, setCarregando] = useState(false)

  // FUNÇÃO DE BUSCA INTELIGENTE
  async function buscar() {
  setCarregando(true)
  try {
    // Busca simples sem filtros complexos primeiro
    const { data, error } = await supabase
      .from('prestadores')
      .select('*')

    if (error) throw error
    
    if (data) {
      // Se houver texto na busca, filtramos aqui no Javascript mesmo (mais fácil de debugar)
      const filtrados = data.filter(p => 
        p.nome.toLowerCase().includes(busca.toLowerCase()) || 
        p.categoria.toLowerCase().includes(busca.toLowerCase())
      )
      setPrestadores(filtrados)
      setMostrarResultados(true)
    }
  } catch (err) {
    console.error("Erro total na busca:", err)
    alert("Erro ao conectar com o banco. Verifique as chaves.")
  } finally {
    setCarregando(false)
  }
}

  // Função para os botões de categoria rápida
  async function buscarPorCategoria(cat) {
    setBusca(cat)
    setCarregando(true)
    const { data } = await supabase
      .from('prestadores')
      .select('*')
      .ilike('categoria', `%${cat}%`)
    
    if (data) {
      setPrestadores(data)
      setMostrarResultados(true)
    }
    setCarregando(false)
  }

  return (
    <main className="min-h-screen bg-white flex flex-col items-center p-6">
      
      {/* CONTAINER DE BUSCA */}
      <div className={`transition-all duration-700 flex flex-col items-center w-full max-w-2xl ${mostrarResultados ? 'mt-6 mb-8' : 'mt-32 mb-0'}`}>
        
        {/* LOGO */}
        <div className="mb-8 flex justify-center w-full">
          <img 
            src="/logo.png" 
            alt="Logo" 
            className="w-full max-w-[450px] md:max-w-[550px] h-auto object-contain" 
          />
        </div>

        {/* BARRA DE BUSCA */}
        <div className="w-full relative shadow-2xl rounded-full group mb-6">
          <input 
            type="text" 
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && buscar()}
            placeholder="O que você precisa hoje?" 
            className="w-full p-5 pl-8 rounded-full border border-slate-100 outline-none focus:ring-2 focus:ring-blue-500 text-xl text-slate-700"
          />
          <button 
            onClick={buscar}
            className="absolute right-3 top-2.5 bg-blue-600 text-white px-8 py-3 rounded-full font-bold hover:bg-blue-700 transition-all shadow-md active:scale-95"
          >
            {carregando ? '...' : 'Buscar'}
          </button>
        </div>

        {/* CATEGORIAS RÁPIDAS (Só aparecem antes de buscar) */}
        {!mostrarResultados && (
          <div className="w-full animate-in fade-in duration-1000">
            <p className="text-center text-slate-400 text-[10px] font-black uppercase tracking-widest mb-4">Categorias Populares</p>
            <div className="flex flex-wrap justify-center gap-2">
              {CATEGORIAS_OFICIAIS.slice(0, 6).map((cat) => (
                <button
                  key={cat}
                  onClick={() => buscarPorCategoria(cat)}
                  className="bg-slate-50 hover:bg-blue-600 hover:text-white text-slate-600 px-5 py-2 rounded-full text-xs font-bold border border-slate-100 transition-all active:scale-95"
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
        <div className="container mx-auto max-w-5xl animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
          
          <div className="flex justify-between items-center mb-6 px-4">
            <h2 className="text-slate-400 font-bold text-sm uppercase">Resultados para: {busca}</h2>
            <button 
              onClick={() => {setMostrarResultados(false); setBusca('')}}
              className="text-blue-600 text-xs font-bold hover:underline"
            >
              Limpar Busca
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {prestadores.map((p) => (
              <div key={p.id} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl transition-all flex flex-col group">
                <span className="bg-blue-50 text-blue-600 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider w-fit mb-4">
                  {p.categoria}
                </span>
                <h3 className="text-xl font-bold text-slate-800 mb-2 group-hover:text-blue-600 transition-colors">{p.nome}</h3>
                <p className="text-slate-500 text-sm mb-6 leading-relaxed flex-grow">{p.bio}</p>
                <a 
                  href={`https://wa.me/${p.whatsapp?.replace(/\D/g, '')}`} 
                  target="_blank"
                  className="block w-full bg-green-500 hover:bg-green-600 text-white text-center py-4 rounded-2xl font-bold transition-all shadow-lg shadow-green-100 active:scale-95"
                >
                  Chamar no WhatsApp
                </a>
              </div>
            ))}
          </div>
          
          {prestadores.length === 0 && (
            <div className="text-center mt-20">
              <p className="text-slate-400 italic text-lg">Nenhum profissional encontrado com esse termo.</p>
              <button onClick={() => setMostrarResultados(false)} className="mt-4 bg-slate-100 px-6 py-2 rounded-full font-bold text-slate-600">Voltar</button>
            </div>
          )}
        </div>
      )}
    </main>
  )
}