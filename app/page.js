'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

export default function Home() {
  const [busca, setBusca] = useState('')
  const [sugestoes, setSugestoes] = useState([])

  // 1. CARREGAMENTO INICIAL - APENAS HABILIDADES EM SUGESTÕES
  useEffect(() => {
    async function carregarSugestoes() {
      try {
        const { data, error } = await supabase
          .from('habilidades')
          .select('nome')
          .limit(6) // Aumentado para preencher melhor o espaço visual

        if (data) {
          setSugestoes(data.map(i => i.nome))
        }
      } catch (error) {
        console.error('Erro ao carregar sugestões:', error)
      }
    }
    carregarSugestoes()
  }, [])

  // 2. FUNÇÃO DA BARRA DE BUSCA AJUSTADA PARA ALCANÇAR TODAS AS TABELAS
  const dispararBusca = async (e) => {
    if (e) e.preventDefault()
    const termo = busca.trim()
    
    if (!termo) {
      window.location.href = '/prestadores'
      return
    }

    // Buscamos em todas as tabelas citadas para identificar a intenção da busca
    const [resHab, resCid, resReg, resEst] = await Promise.all([
      supabase.from('habilidades').select('id, nome').ilike('nome', termo).maybeSingle(),
      supabase.from('cidades').select('id, nome').ilike('nome', termo).maybeSingle(),
      supabase.from('regioes').select('id, nome').ilike('nome', termo).maybeSingle(),
      supabase.from('estados').select('sigla, nome').ilike('nome', termo).maybeSingle()
    ])

    // Construção inteligente da URL
    let url = `/prestadores?q=${encodeURIComponent(termo)}`

    // Adiciona filtros específicos caso encontre match exato em alguma tabela
    if (resHab.data) url += `&habilidade=${resHab.data.id}`
    if (resCid.data) url += `&cidade=${resCid.data.id}`
    if (resReg.data) url += `&regiao=${resReg.data.id}`
    if (resEst.data) url += `&estado=${resEst.data.sigla}`

    window.location.href = url
  }

  return (
    <main className="min-h-screen bg-[#F8FAFC] flex flex-col items-center font-sans overflow-x-hidden relative">
      
      {/* HEADER SUPERIOR */}
      <header className="w-full max-w-5xl px-6 py-6 flex justify-end absolute top-0">
        <Link 
          href="/login" 
          className="bg-white border border-slate-200 text-blue-600 px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all shadow-sm active:scale-95"
        >
          Sou Profissional
        </Link>
      </header>

      <section className="w-full max-w-[90%] md:max-w-2xl px-4 pt-24 md:pt-40 pb-10 flex flex-col items-center text-center">
        
        <div className="mb-12 md:mb-16 transition-all hover:scale-[1.02]">
          <Link href="/">
            <img src="/logo.png" alt="Logo" className="h-20 md:h-32 w-auto object-contain" />
          </Link>
        </div>

        {/* BARRA DE BUSCA COM LÓGICA MULTI-TABELA */}
        <form onSubmit={dispararBusca} className="w-full relative group mb-10">
          <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-cyan-500 rounded-[2rem] blur opacity-10 group-hover:opacity-25 transition duration-1000 group-focus-within:opacity-30"></div>
          
          <div className="relative">
            <input
              type="text"
              placeholder="Busque por serviço, cidade ou região..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="w-full h-16 md:h-20 pl-8 pr-32 md:pr-40 rounded-[1.8rem] md:rounded-[2.2rem] border border-slate-200 bg-white shadow-2xl shadow-blue-900/5 outline-none focus:border-blue-500 text-slate-700 text-base md:text-xl transition-all placeholder:text-slate-300"
            />
            <button 
              type="submit"
              className="absolute right-2.5 top-2.5 bottom-2.5 bg-blue-600 text-white px-6 md:px-10 rounded-[1.4rem] md:rounded-[1.7rem] font-black text-[11px] md:text-xs uppercase tracking-[0.15em] active:scale-95 transition-all shadow-lg shadow-blue-200 hover:bg-blue-700 hover:shadow-blue-300"
            >
              BUSCAR
            </button>
          </div>
        </form>

        {/* SUGESTÕES (CHIPS) - AGORA APENAS HABILIDADES */}
        <div className="flex flex-col items-center gap-4 mb-16">
          <span className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em]">Sugestões para você</span>
          <div className="flex flex-wrap justify-center gap-2 md:gap-3">
            {sugestoes.length > 0 ? (
              sugestoes.map((item, index) => (
                <button 
                  key={index} 
                  onClick={() => window.location.href = `/prestadores?q=${encodeURIComponent(item)}`} 
                  className="bg-white text-slate-500 px-5 py-2.5 rounded-2xl text-[10px] font-bold border border-slate-100 uppercase hover:text-blue-600 hover:border-blue-500 hover:shadow-md transition-all active:bg-blue-50"
                >
                  {item}
                </button>
              ))
            ) : (
              <div className="flex gap-2">
                {[1,2,3,4].map(i => (
                  <div key={i} className="w-20 h-8 bg-slate-100 animate-pulse rounded-2xl"></div>
                ))}
              </div>
            )}
          </div>
        </div>

        <p className="text-slate-400 text-xs md:text-sm max-w-xs leading-relaxed">
          Encontre os melhores profissionais de <span className="text-blue-600 font-bold">Londrina e região</span> em poucos segundos.
        </p>
      </section>

      <footer className="mt-auto py-12 text-center w-full bg-white border-t border-slate-50">
        <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.5em]">
          {new Date().getFullYear()} • Guia de Serviços Online
        </p>
      </footer>
      
    </main> 
  )
}