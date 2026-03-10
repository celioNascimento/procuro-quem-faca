'use client'
import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

import HeroSection from '@/components/home/HeroSection'
import SearchForm from '@/components/home/SearchForm'

export default function Home() {
  const router = useRouter()
  const [busca, setBusca] = useState('')
  const [sugestoes, setSugestoes] = useState([])
  const [erro, setErro] = useState(false)

  // registrarLog estável — useCallback evita recriação a cada render
  const registrarLog = useCallback(async (acao, detalhes = {}, entidade = null) => {
    try {
      await supabase.from('logs_atividades').insert([{ acao, detalhes, entidade_tipo: entidade }])
    } catch { /* silencioso — log nunca deve travar o fluxo */ }
  }, [])

  // Sugestões de categoria com debounce 300ms
  useEffect(() => {
    const buscarSugestoes = async () => {
      try {
        let query = supabase.from('categorias').select('nome')
        if (busca.trim()) query = query.ilike('nome', `%${busca.trim()}%`)
        const { data } = await query.limit(6)
        if (data) {
          const corrigidas = data
            .map(i => i.nome)
            .map(item => item.toLowerCase() === 'manutenção' ? 'Mecânico' : item)

          const filtradas = [...new Set(corrigidas)].filter(item => {
            const t = item.toLowerCase()
            return !t.includes('ar condicionado') && !t.includes('ar-condicionado')
          })
          setSugestoes(filtradas)
        }
      } catch (err) {
        console.warn('Erro na busca de sugestões:', err.message)
      }
    }

    const timer = setTimeout(buscarSugestoes, 300)
    return () => clearTimeout(timer)
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
    // encodeURIComponent garante segurança com caracteres especiais
    router.push(`/prestadores?q=${encodeURIComponent(termoFinal)}`)
  }

  // Label de sugestões: só muda se há termo real (sem espaços em branco falsos)
  const temBuscaReal = busca.trim().length > 0

  return (
    <main className="min-h-screen bg-[#FDFDFD] flex flex-col items-center font-sans relative antialiased overflow-x-hidden">

      {/* Gradiente decorativo de fundo */}
      <div
        className="absolute inset-0 pointer-events-none -z-0"
        style={{ background: 'radial-gradient(circle at 50% 0%, rgba(219,234,254,0.4) 0%, transparent 60%)' }}
      />

      <div className="w-full flex flex-col items-center relative z-10">

        {/* Header com botões de login/painel — posição absoluta, h-20 reservado */}
        <HeroSection onLog={registrarLog} />

        {/* pt-20 = altura do header absoluto (h-20) — espaço reservado desde o primeiro frame */}
        <section className="w-full max-w-4xl px-6 pt-20 md:pt-28 pb-12 flex flex-col items-center text-center">

          {/* Logo — largura controlada, não depende de margens negativas para posicionar */}
          <div className="w-full flex justify-center mb-2">
            <Link
              href="/"
              className="block w-full max-w-[260px] md:max-w-[520px] transition-transform active:scale-95 duration-300"
            >
              <img
                src="/logo.png"
                alt="Procuro Quem Faça"
                className="w-full h-auto object-contain drop-shadow-sm"
              />
            </Link>
          </div>

          {/* SearchForm — abaixo da logo, sem margin negativa frágil */}
          <div className="w-full max-w-[620px] mx-auto mb-8">
            <SearchForm
              busca={busca}
              setBusca={setBusca}
              onSubmit={dispararBusca}
              temErro={erro}
            />
          </div>

          {/* Sugestões de categoria */}
          {sugestoes.length > 0 && (
            <div className="flex flex-col items-center gap-3 animate-in slide-in-from-bottom-4 duration-500">
              <span className="text-[9px] md:text-[10px] font-black text-slate-300 uppercase tracking-[0.3em] italic">
                {temBuscaReal ? 'Encontramos para você' : 'Sugestões em destaque'}
              </span>

              <div className="flex flex-wrap justify-center gap-1.5 md:gap-2 max-w-[320px] md:max-w-none">
                {sugestoes.map((item) => (
                  // key pelo nome da categoria — mais estável que índice
                  <button
                    key={item}
                    onClick={() => dispararBusca(null, item)}
                    className="bg-white text-slate-500 px-4 py-1.5 md:px-5 md:py-2 rounded-2xl text-[10px] md:text-[11px] font-bold border border-slate-100 hover:border-blue-500 hover:text-blue-600 transition-all active:scale-95 shadow-sm uppercase tracking-tighter"
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* Footer discreto — opacity única no container, sem dupla opacidade no texto */}
        <footer className="mt-auto py-10">
          <div className="flex flex-col items-center gap-3 opacity-30">
            <div className="h-px w-8 bg-slate-400" />
            <p className="text-[9px] font-black text-slate-600 uppercase tracking-[0.4em] italic leading-none">
              Londrina • Paraná
            </p>
          </div>
        </footer>
      </div>
    </main>
  )
}