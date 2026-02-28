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
    <main className="min-h-screen bg-[#FDFDFD] flex flex-col items-center justify-center font-sans relative antialiased overflow-x-hidden">
      
      {/* BACKGROUND DECO: Um leve gradiente para profundidade */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-blue-50/20 via-transparent to-transparent -z-0" />

      <div className="w-full flex flex-col items-center animate-in fade-in zoom-in-95 duration-1000 relative z-10">

        <HeroSection onLog={registrarLog} />

        {/* SEÇÃO DE BUSCA CENTRALIZADA */}
        <section className="w-full max-w-4xl px-6 flex flex-col items-center text-center">
          
          {/* CONTAINER DA LOGO: Monumentalidade e Respiro */}
          <div className="mb-4 md:mb-8 transition-all duration-700 ease-out translate-y-0 opacity-100">
            <Link href="/" className="block w-full max-w-[260px] md:max-w-[580px] transition-transform hover:scale-[1.02] active:scale-95 duration-500">
              <img
                src="/logo.png"
                alt="Logo Procuro quem Faça"
                className="w-full h-auto object-contain drop-shadow-[0_8px_30px_rgba(0,0,0,0.04)]"
              />
            </Link>
          </div>

          {/* FORMULÁRIO DE BUSCA: Sobreposição Elegante */}
          <div className="w-full mb-12 -mt-6 md:-mt-16 perspective-1000">
            <div className="w-full max-w-[640px] mx-auto shadow-[0_20px_50px_-12px_rgba(0,0,0,0.08)] rounded-[2rem]">
              <SearchForm
                busca={busca}
                setBusca={setBusca}
                onSubmit={dispararBusca}
                temErro={erro}
              />
            </div>
          </div>

          {/* SUGESTÕES: Tags Modernas */}
          {sugestoes.length > 0 && (
            <div className="flex flex-col items-center gap-5 animate-in slide-in-from-bottom-6 duration-700">
              <span className="text-[10px] font-bold text-slate-300 uppercase tracking-[0.3em]">
                {busca.length > 0 ? 'Serviços Relacionados' : 'Sugestões em destaque'}
              </span>
              
              <div className="flex flex-wrap justify-center gap-2 md:gap-3">
                {sugestoes.map((item, index) => (
                  <button
                    key={index}
                    onClick={() => dispararBusca(null, item)}
                    className="bg-white/80 backdrop-blur-sm text-slate-500 px-5 py-2.5 rounded-full text-[10px] md:text-[12px] font-bold border border-slate-100 hover:border-blue-500 hover:text-blue-600 hover:bg-white transition-all hover:shadow-md active:scale-90"
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* FOOTER DISCRETO */}
        <footer className="mt-20 md:mt-32 pb-12 opacity-40">
           <div className="flex flex-col items-center gap-4">
             <div className="h-px w-12 bg-slate-200" />
             <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] italic leading-none">
                Londrina • Paraná
             </p>
           </div>
        </footer>
      </div>
    </main>
  )
}