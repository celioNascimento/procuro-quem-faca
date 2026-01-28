'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

export default function Home() {
  const [busca, setBusca] = useState('')
  const [sugestoes, setSugestoes] = useState([])

  // 1. CARREGAMENTO INICIAL
  useEffect(() => {
    async function carregarSugestoes() {
      try {
        const { data } = await supabase
          .from('habilidades')
          .select('nome')
          .limit(6) 
        if (data) setSugestoes(data.map(i => i.nome))
      } catch (error) {
        console.error('Erro ao carregar sugestões:', error)
      }
    }
    carregarSugestoes()
  }, [])

  // 2. FUNÇÃO AUXILIAR PARA REGISTRO DE LOGS
  const registrarLog = async (acao, detalhes = {}, entidade = null) => {
    try {
      await supabase.from('logs_atividades').insert({
        acao,
        detalhes,
        entidade_tipo: entidade
      })
    } catch (err) {
      console.error('Erro ao registrar log:', err)
    }
  }

  // 3. FUNÇÃO DA BARRA DE BUSCA COM TRATAMENTO DE ERROS
  const dispararBusca = async (e, termoManual = null) => {
    if (e) e.preventDefault()
    const termo = (termoManual || busca).trim()
    
    // REGISTRO DE LOG: Intenção de busca
    await registrarLog('BUSCA_INICIADA', { termo }, 'busca')

    if (!termo) {
      window.location.href = '/prestadores'
      return
    }

    try {
      // O try/catch aqui captura falhas de conexão ou erros nas queries
      const [resHab, resCid, resReg, resEst] = await Promise.all([
        supabase.from('habilidades').select('id, nome').ilike('nome', termo).maybeSingle(),
        supabase.from('cidades').select('id, nome').ilike('nome', termo).maybeSingle(),
        supabase.from('regioes').select('id, nome').ilike('nome', termo).maybeSingle(),
        supabase.from('estados').select('sigla, nome').ilike('nome', termo).maybeSingle()
      ])

      let url = `/prestadores?q=${encodeURIComponent(termo)}`
      
      // Log de sucesso com os filtros identificados
      const filtros = {
        hab: resHab.data?.id,
        cid: resCid.data?.id,
        reg: resReg.data?.id,
        est: resEst.data?.sigla
      }

      if (filtros.hab) url += `&habilidade=${filtros.hab}`
      if (filtros.cid) url += `&cidade=${filtros.cid}`
      if (filtros.reg) url += `&regiao=${filtros.reg}`
      if (filtros.est) url += `&estado=${filtros.est}`

      await registrarLog('BUSCA_PROCESSADA_SUCESSO', { termo, filtros }, 'busca')
      window.location.href = url

    } catch (error) {
      // REGISTRO DE ERRO CRÍTICO NO BANCO
      await registrarLog('ERRO_CRITICO_BUSCA', { 
        termo, 
        mensagem: error.message,
        stack: error.stack?.slice(0, 200) // Salva parte do erro para diagnóstico
      }, 'erro')
      
      // Fallback: Redireciona mesmo com erro na identificação de filtros para não travar o usuário
      window.location.href = `/prestadores?q=${encodeURIComponent(termo)}`
    }
  }

  return (
    <main className="min-h-screen bg-[#F8FAFC] flex flex-col items-center font-sans overflow-x-hidden relative">
      
      {/* HEADER SUPERIOR */}
      <header className="w-full max-w-5xl px-6 py-6 flex justify-end absolute top-0">
        <Link 
          href="/login" 
          onClick={() => registrarLog('CLIQUE_SOU_PROFISSIONAL', {}, 'navegacao')}
          className="bg-white border border-slate-200 text-blue-600 px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all shadow-sm active:scale-95"
        >
          Sou Profissional
        </Link>
      </header>

      <section className="w-full max-w-[90%] md:max-w-2xl px-4 pt-24 md:pt-40 pb-10 flex flex-col items-center text-center">
        
        {/* LOGO FORMATO PÍLULA */}
        <div className="mb-12 md:mb-16 transition-all hover:scale-[1.05]">
          <Link 
            href="/" 
            className="inline-block px-10 py-5 bg-white rounded-full shadow-xl shadow-blue-900/5 border border-slate-50 overflow-hidden"
          >
            <img src="/logo.png" alt="Logo" className="h-16 md:h-20 w-auto object-contain" />
          </Link>
        </div>

        {/* BARRA DE BUSCA */}
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

        {/* SUGESTÕES (CHIPS) */}
        <div className="flex flex-col items-center gap-4 mb-16">
          <span className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em]">Sugestões para você</span>
          <div className="flex flex-wrap justify-center gap-2 md:gap-3">
            {sugestoes.map((item, index) => (
              <button 
                key={index} 
                onClick={() => {
                  registrarLog('CLIQUE_SUGESTAO', { categoria: item }, 'sugestao');
                  dispararBusca(null, item);
                }} 
                className="bg-white text-slate-500 px-5 py-2.5 rounded-2xl text-[10px] font-bold border border-slate-100 uppercase hover:text-blue-600 hover:border-blue-500 hover:shadow-md transition-all active:bg-blue-50"
              >
                {item}
              </button>
            ))}
          </div>
        </div>

        <p className="text-slate-400 text-xs md:text-sm max-w-xs leading-relaxed">
          Encontre os melhores profissionais de <span className="text-blue-600 font-bold">Londrina e região</span> em poucos segundos.
        </p>
      </section>      
    </main> 
  )
}