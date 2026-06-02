'use client'
import { useState } from 'react'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useSugestoes } from '@/hooks/useSugestoes'
import { useLog } from '@/hooks/useLog'
import SearchForm from '@/components/home/SearchForm'

const HeroSection = dynamic(() => import('@/components/home/HeroSection'), { ssr: false })

export default function Home() {
  const router = useRouter()
  const [busca, setBusca] = useState('')
  const [erro, setErro] = useState(false)
  const sugestoes = useSugestoes(busca)
  const { registrarLog } = useLog()

  const temBuscaReal = busca.trim().length > 0

  function dispararBusca(e: React.FormEvent | null, termoManual?: string) {
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

  return (
    <main className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans antialiased overflow-x-hidden relative">

      <div
        className="absolute inset-0 pointer-events-none -z-0"
        style={{ background: 'radial-gradient(ellipse 90% 55% at 50% -5%, rgba(219,234,254,0.65) 0%, transparent 65%)' }}
      />

      <HeroSection onLog={registrarLog} />

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

          <div className="min-h-[72px] flex flex-col items-center justify-start gap-3 w-full">
            {sugestoes.length > 0 && (
              <div className="flex flex-col items-center gap-3 w-full animate-in fade-in duration-300">
                <span className="text-[9px] font-black text-slate-300 uppercase tracking-[0.3em] italic">
                  {temBuscaReal ? 'Encontramos para você' : 'Sugestões em destaque'}
                </span>
                <div className="flex flex-wrap justify-center gap-1.5 md:gap-2">
                  {sugestoes.map(item => (
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
