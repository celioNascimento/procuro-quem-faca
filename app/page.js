'use client'
import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

import HeroSection from '@/components/home/HeroSection'
import SearchForm from '@/components/home/SearchForm'

export default function Home() {
  const router = useRouter()
  const SUGESTOES_PADRAO = ['Pedreiro', 'Eletricista', 'Encanador', 'Pintor', 'Técnico de Ar-condicionado']

  const [busca, setBusca] = useState('')
  const [sugestoes, setSugestoes] = useState(SUGESTOES_PADRAO)
  const [erro, setErro] = useState(false)

  const registrarLog = useCallback(async (acao, detalhes = {}, entidade = null) => {
    try {
      await supabase.from('logs_atividades').insert([{ acao, detalhes, entidade_tipo: entidade }])
    } catch { /* silencioso */ }
  }, [])

  useEffect(() => {
    let cancelado = false // flag para evitar setState em componente desmontado

    const buscarSugestoes = async () => {
      try {
        let query = supabase.from('categorias').select('nome')
        if (busca.trim()) query = query.ilike('nome', `%${busca.trim()}%`)
        const { data } = await query.limit(6)
        if (cancelado) return
        if (data && data.length > 0) {
          const corrigidas = data
            .map(i => i.nome)
            .map(item => item.toLowerCase() === 'manutenção' ? 'Mecânico' : item)
          const filtradas = [...new Set(corrigidas)].filter(item => {
            const t = item.toLowerCase()
            return !t.includes('ar condicionado') && !t.includes('ar-condicionado')
          })
          setSugestoes(filtradas)
        }
        // se retornou vazio, mantém as sugestões anteriores (padrão ou última busca)
      } catch (err) {
        console.warn('Erro sugestões:', err.message)
        // mantém sugestões padrão — não limpa
      }
    }

    const timer = setTimeout(buscarSugestoes, 300)
    return () => {
      clearTimeout(timer)
      cancelado = true
    }
  }, [busca])

  const dispararBusca = (e, termoManual) => {
    if (e?.preventDefault) e.preventDefault()
    const termoFinal = (termoManual || busca || '').trim()
    if (!termoFinal) {
      setErro(true)
      setTimeout(() => setErro(false), 3000)
      return
    }
    setErro(false)
    if (termoManual) setBusca(termoManual)
    registrarLog('BUSCA_REALIZADA', { termo: termoFinal }, 'busca')
    router.push(`/prestadores?q=${encodeURIComponent(termoFinal)}`)
  }

  const temBuscaReal = busca.trim().length > 0

  return (
    <main className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans antialiased overflow-x-hidden relative">

      <div
        className="absolute inset-0 pointer-events-none -z-0"
        style={{ background: 'radial-gradient(ellipse 90% 55% at 50% -5%, rgba(219,234,254,0.65) 0%, transparent 65%)' }}
      />

      <HeroSection onLog={registrarLog} />

      {/* BUG 2: -mt-8 md:-mt-10 compensa o header e centraliza visualmente */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-6">
        <div className="w-full max-w-xl flex flex-col items-center text-center gap-5 -mt-8 md:-mt-10">

          <Link href="/" className="block transition-transform active:scale-95 duration-200">
            <img
              src="/logo.png"
              alt="Procuro Quem Faça"
              className="h-12 md:h-16 w-auto object-contain drop-shadow-sm"
            />
          </Link>

          <div className="w-full">
            <SearchForm
              busca={busca}
              setBusca={setBusca}
              onSubmit={dispararBusca}
              temErro={erro}
            />
          </div>

          {/* Área de sugestões com altura reservada — evita layout shift */}
          <div className="min-h-[72px] flex flex-col items-center justify-start gap-3 w-full">
            {sugestoes.length > 0 && (
              <div className="flex flex-col items-center gap-3 w-full animate-in fade-in duration-300">
                <span className="text-[9px] font-black text-slate-300 uppercase tracking-[0.3em] italic">
                  {temBuscaReal ? 'Encontramos para você' : 'Sugestões em destaque'}
                </span>
                <div className="flex flex-wrap justify-center gap-1.5 md:gap-2">
                  {sugestoes.map((item) => (
                    <button
                      key={item}
                      onClick={() => dispararBusca(null, item)}
                      className="bg-white text-slate-500 px-4 py-1.5 rounded-full text-[10px] font-bold border border-slate-100 hover:border-blue-400 hover:text-blue-600 transition-all active:scale-95 shadow-sm uppercase tracking-tighter"
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <footer className="relative z-10 py-10 flex justify-center">
        <div className="flex flex-col items-center gap-2 opacity-20">
          <div className="h-px w-6 bg-slate-500" />
          <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.4em] italic">
            Londrina • Paraná
          </p>
        </div>
      </footer>

    </main>
  )
}