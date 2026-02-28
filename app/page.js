'use client'
import { useState, useEffect, useCallback } from 'react'
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
    const timer = setTimeout(() => setMounted(true), 0);
    return () => clearTimeout(timer);
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

  if (!mounted) {
    return <main className="min-h-screen bg-[#FDFDFD]" />
  }

  return (
    <main
      className="min-h-screen bg-[#FDFDFD] flex flex-col items-center font-sans relative antialiased"
      suppressHydrationWarning={true}
    >
      <div className="w-full flex flex-col items-center animate-in fade-in duration-700">

        <HeroSection onLog={registrarLog} />

        {/* SEÇÃO PRINCIPAL: 
            Reduzimos o pt-16 para pt-10 no mobile para ganhar espaço vertical útil.
        */}
        <section className="w-full max-w-3xl px-6 pt-10 md:pt-24 pb-12 flex flex-col items-center text-center relative z-10">
          
          {/* CONTAINER DA LOGO:
              Ajustamos o max-w no mobile para 220px (era 280px). 
              Isso evita que a logo "estoure" visualmente em telas pequenas.
          */}
          <div className="mb-0 p-0 flex justify-center w-full">
            <Link href="/" className="block w-full max-w-[220px] md:max-w-[500px] transition-transform active:scale-95 duration-300">
              <img
                src="/logo.png"
                alt="Logo Procuro quem Faça"
                className="w-full h-auto object-contain drop-shadow-sm p-0 m-0"
              />
            </Link>
          </div>

          {/* FORMULÁRIO DE BUSCA:
              Suavizamos a margem negativa no mobile para mt-[-1.5rem] (era -2.5rem).
              Isso impede o "esmagamento" visual entre a barra e o nome da marca no celular.
          */}
          <div className="w-full mb-8 mt-[-1.5rem] md:mt-[-4rem]">
            <SearchForm
              busca={busca}
              setBusca={setBusca}
              onSubmit={dispararBusca}
              temErro={erro}
            />
          </div>

          {/* SUGESTÕES:
              No mobile, usamos gap-1.5 e text-[10px] para manter o bloco denso e centralizado, 
              sem expandir para as bordas.
          */}
          {sugestoes.length > 0 && (
            <div className="flex flex-col items-center gap-3 md:gap-4 animate-in slide-in-from-bottom-4 duration-500">
              <span className="text-[9px] md:text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] opacity-80">
                {busca.length > 0 ? 'Encontramos para você' : 'Sugestões de serviços'}
              </span>
              
              <div className="flex flex-wrap justify-center gap-1.5 md:gap-2 max-w-[280px] md:max-w-none">
                {sugestoes.map((item, index) => (
                  <button
                    key={index}
                    onClick={() => dispararBusca(null, item)}
                    className="bg-white text-slate-600 px-3 py-1.5 md:px-4 md:py-2 rounded-2xl text-[10px] md:text-[11px] font-semibold border border-slate-100 hover:border-blue-500 hover:text-blue-600 transition-all active:scale-95 shadow-sm"
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>
          )}
        </section>

        <footer className="mt-auto py-8">
           <p className="text-[9px] md:text-[10px] font-medium text-slate-300 uppercase tracking-widest">
             Londrina e Região Metropolitana
           </p>
        </footer>
      </div>
    </main>
  )
}