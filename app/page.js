'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

// Componentes
import HeroSection from '@/components/home/HeroSection'
import SearchForm from '@/components/home/SearchForm'

export default function Home() {
  const router = useRouter()
  const [busca, setBusca] = useState('')
  const [sugestoes, setSugestoes] = useState([])
  const [erro, setErro] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, []);

  useEffect(() => {
    const buscarSugestoes = async () => {
      try {
        let query = supabase.from('categorias').select('nome')
        if (busca.trim()) {
          query = query.ilike('nome', `%${busca}%`)
        }
        const { data } = await query.limit(5)
        if (data) {
          const listaBruta = data.map(i => i.nome)
          const corrigidas = listaBruta.map(item => {
            if (item.toLowerCase() === 'manutenção') return 'Mecânico';
            return item;
          })
          const filtradas = [...new Set(corrigidas)]
            .filter(item => {
              const t = item.toLowerCase();
              return !t.includes('ar condicionado') && !t.includes('ar-condicionado');
            })
          setSugestoes(filtradas)
        }
      } catch (error) {
        console.warn('Erro na busca de sugestões:', error.message)
      }
    }

    const timer = setTimeout(buscarSugestoes, 300)
    return () => clearTimeout(timer)
  }, [busca])

  const registrarLog = async (acao, detalhes = {}, entidade = null) => {
    try {
      await supabase.from('logs_atividades').insert([{ acao, detalhes, entidade_tipo: entidade }])
    } catch (err) { /* Silencioso */ }
  }

  const dispararBusca = async (e, termoManual) => {
    if (e && e.preventDefault) e.preventDefault();
    const termoFinal = (termoManual || busca || "").trim();

    if (!termoFinal) {
      setErro(true);
      setTimeout(() => setErro(false), 3000);
      return;
    }

    setErro(false);
    if (termoManual) setBusca(termoManual);
    registrarLog('BUSCA_REALIZADA', { termo: termoFinal }, 'busca');

    const params = new URLSearchParams();
    params.set('q', termoFinal);
    router.push(`/prestadores?${params.toString()}`);
  };

  if (!mounted) return <main className="min-h-screen bg-[#FDFDFD]" />

  return (
    <main className="min-h-screen bg-[#FDFDFD] flex flex-col items-center font-sans relative antialiased overflow-x-hidden">
      
      {/* BACKGROUND DECO: Gradiente sutil fixo no topo */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-blue-50/40 via-transparent to-transparent -z-0 pointer-events-none" />

      <div className="w-full flex flex-col items-center animate-in fade-in duration-700 relative z-10">

        <HeroSection onLog={registrarLog} />

        {/* SEÇÃO DE BUSCA: Ajustada para não ser centralizada verticalmente no mobile */}
        <section className="w-full max-w-4xl px-6 pt-12 md:pt-32 pb-12 flex flex-col items-center text-center">
          
          {/* CONTAINER DA LOGO: Aproximação técnica da barra de busca */}
          <div className="mb-0 transition-transform duration-500">
            <Link href="/" className="block w-full max-w-[240px] md:max-w-[540px] transition-transform active:scale-95 duration-300">
              <img
                src="/logo.png"
                alt="Logo Procuro quem Faça"
                className="w-full h-auto object-contain drop-shadow-sm"
              />
            </Link>
          </div>

          {/* FORMULÁRIO DE BUSCA: 
              -mt-10 no mobile aproxima a barra da logo de forma agressiva e elegante.
              Removida a sombra excessiva do container pai para usar apenas a interna do componente.
          */}
          <div className="w-full mb-10 -mt-10 md:-mt-16 relative z-20">
            <div className="w-full max-w-[620px] mx-auto">
              <SearchForm
                busca={busca}
                setBusca={setBusca}
                onSubmit={dispararBusca}
                temErro={erro}
              />
            </div>
          </div>

          {/* SUGESTÕES: Tags mais compactas */}
          {sugestoes.length > 0 && (
            <div className="flex flex-col items-center gap-4 animate-in slide-in-from-bottom-4 duration-500">
              <span className="text-[9px] md:text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] opacity-70">
                {busca.length > 0 ? 'Encontramos para você' : 'Sugestões em destaque'}
              </span>
              
              <div className="flex flex-wrap justify-center gap-1.5 md:gap-2 max-w-[320px] md:max-w-none">
                {sugestoes.map((item, index) => (
                  <button
                    key={index}
                    onClick={() => dispararBusca(null, item)}
                    className="bg-white text-slate-500 px-4 py-1.5 md:px-5 md:py-2 rounded-2xl text-[10px] md:text-[11px] font-semibold border border-slate-100 hover:border-blue-500 hover:text-blue-600 transition-all active:scale-95 shadow-sm"
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* FOOTER: Mantido discreto no final */}
        <footer className="mt-auto py-10 opacity-40">
           <div className="flex flex-col items-center gap-3">
             <div className="h-px w-8 bg-slate-200" />
             <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.4em] italic leading-none">
                Londrina e Região
             </p>
           </div>
        </footer>
      </div>
    </main>
  )
}