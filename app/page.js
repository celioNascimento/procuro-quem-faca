'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function Home() {
  const router = useRouter()
  const [busca, setBusca] = useState('')
  const [sugestoes, setSugestoes] = useState([])

  useEffect(() => {
    const buscarSugestoes = async () => {
      try {
        let query = supabase.from('habilidades').select('nome, categoria')
        if (busca.trim()) {
          query = query.or(`nome.ilike.%${busca}%,categoria.ilike.%${busca}%`)
        }
        
        const { data } = await query.limit(20)
        
        if (data) {
          const sugestoesUnicas = [...new Set([
            ...data.map(i => i.nome),
            ...data.map(i => i.categoria).filter(Boolean)
          ])]
          
          const filtradas = sugestoesUnicas
            .filter(item => {
              const t = item.toLowerCase();
              // Remove termos com "ar condicionado" ou "ar-condicionado"
              return !t.includes('ar condicionado') && !t.includes('ar-condicionado');
            })
            .slice(0, 5) // Alterado para 5 sugestões
          
          setSugestoes(filtradas)
        }
      } catch (error) { console.error(error) }
    }
    const timer = setTimeout(buscarSugestoes, 200)
    return () => clearTimeout(timer)
  }, [busca])

  const registrarLog = async (acao, detalhes = {}, entidade = null) => {
    try { await supabase.from('logs_atividades').insert({ acao, detalhes, entidade_tipo: entidade }) } catch {}
  }

  const dispararBusca = async (e, termoManual) => {
    if (e) e.preventDefault()
    const termo = (termoManual || busca).trim()
    await registrarLog('BUSCA_REALIZADA', { termo }, 'busca')
    if (!termo) { router.push('/prestadores'); return; }

    try {
      const [resCid, resReg, resEst] = await Promise.all([
        supabase.from('cidades').select('id').ilike('nome', `%${termo}%`).maybeSingle(),
        supabase.from('regioes').select('id').ilike('nome', `%${termo}%`).maybeSingle(),
        supabase.from('estados').select('sigla').ilike('nome', `%${termo}%`).maybeSingle()
      ])

      const params = new URLSearchParams({ q: termo })
      if (resCid.data) params.append('cidade', resCid.data.id)
      if (resReg.data) params.append('regiao', resReg.data.id)
      if (resEst.data) params.append('estado', resEst.data.sigla)

      router.push(`/prestadores?${params.toString()}`)
    } catch {
      router.push(`/prestadores?q=${encodeURIComponent(termo)}`)
    }
  }

  return (
    <main className="min-h-screen bg-[#F8FAFC] flex flex-col items-center font-sans relative">
      <header className="w-full max-w-5xl px-6 py-6 flex justify-end absolute top-0">
        <Link href="/login" onClick={() => registrarLog('CLIQUE_SOU_PROFISSIONAL')} className="bg-white border border-slate-200 text-blue-600 px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all shadow-sm active:scale-95">
          Sou Profissional
        </Link>
      </header>

      <section className="w-full max-w-2xl px-4 pt-32 md:pt-44 pb-10 flex flex-col items-center text-center">
        <div className="mb-12 flex justify-center w-full">
          <Link href="/" className="block w-full max-w-[320px] md:max-w-[500px]">
            <img src="/logo.png" alt="Logo" className="w-full h-auto object-contain" />
          </Link>
        </div>

        <form onSubmit={(e) => dispararBusca(e)} className="w-full flex flex-col items-center gap-4 group mb-12">
          <div className="w-full relative">
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-cyan-500 rounded-[2.2rem] blur opacity-10 group-hover:opacity-20 transition duration-1000"></div>
            <input 
              type="text" 
              placeholder="O que você precisa hoje?" 
              value={busca} 
              onChange={(e) => setBusca(e.target.value)} 
              className="relative w-full h-16 md:h-20 pl-8 pr-8 md:pr-44 rounded-[2.2rem] border border-slate-200 bg-white shadow-2xl shadow-blue-900/5 outline-none focus:border-blue-500 text-slate-700 text-lg md:text-xl transition-all" 
            />
            {/* Botão Desktop */}
            <button type="submit" className="hidden md:block absolute right-2.5 top-2.5 bottom-2.5 bg-blue-600 text-white px-10 rounded-[1.7rem] font-black text-xs uppercase tracking-widest hover:bg-blue-700 transition-all active:scale-95">
              BUSCAR
            </button>
          </div>
          
          {/* Botão Mobile (Centralizado estilo Google) */}
          <button type="submit" className="md:hidden w-40 bg-blue-600 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-blue-200 active:scale-95">
            BUSCAR
          </button>
        </form>

        <div className="flex flex-col items-center gap-4 mb-16">
          <span className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em]">
            {busca.length > 0 ? 'Encontramos para você' : 'Sugestões para você'}
          </span>
          <div className="flex flex-wrap justify-center gap-3">
            {sugestoes.map((item, index) => (
              <button 
                key={index} 
                onClick={() => dispararBusca(null, item)} 
                className="bg-white text-slate-500 px-5 py-2.5 rounded-2xl text-[10px] font-bold border border-slate-100 uppercase hover:text-blue-600 hover:border-blue-500 transition-all active:scale-95 shadow-sm"
              >
                {item}
              </button>
            ))}
          </div>
        </div>
      </section>
    </main>
  )
}