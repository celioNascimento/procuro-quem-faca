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

  // Busca de sugestões (roda apenas no cliente via useEffect)
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
    } catch (err) { 
      console.warn('Log bloqueado ou falhou') 
    }
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

  return (
    <main 
      className="min-h-screen bg-[#F8FAFC] flex flex-col items-center font-sans relative antialiased"
      suppressHydrationWarning={true}
    >
      <div className="w-full flex flex-col items-center animate-in fade-in duration-500">
        
        <HeroSection onLog={registrarLog} />

        <section className="w-full max-w-2xl px-4 pt-32 md:pt-44 pb-10 flex flex-col items-center text-center">
          <div className="mb-12 flex justify-center w-full">
            <Link href="/" className="block w-full max-w-[320px] md:max-w-[500px]">
              <img 
                src="/logo.png" 
                alt="Logo Procuro que Faça" 
                className="w-full h-auto object-contain hover:scale-[1.02] transition-transform" 
              />
            </Link>
          </div>

          <SearchForm
            busca={busca}
            setBusca={setBusca}
            onSubmit={dispararBusca}
            temErro={erro}
          />

          {sugestoes.length > 0 && (
            <div className="flex flex-col items-center gap-4 mb-16 animate-in slide-in-from-bottom-2">
              <span className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em]">
                {busca.length > 0 ? 'Encontramos para você' : 'Sugestões'}
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
          )}
        </section>
      </div>
    </main>
  )
}