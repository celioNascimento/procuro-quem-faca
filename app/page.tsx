//app/page.tsx

'use client'
import { useState } from 'react'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useSugestoes } from '@/hooks/useSugestoes'
import { insertLog } from '@/lib/db/logs'
import SearchForm from '@/components/home/SearchForm'
import CTAPrestadorSkeleton from '@/components/home/CTAPrestadorSkeleton'
import { ArrowRight, Briefcase } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'

const HeroSection = dynamic(() => import('@/components/home/HeroSection'), { ssr: false })

export default function Home() {
  const router = useRouter()
  const [busca, setBusca] = useState('')
  const [erro, setErro] = useState(false)
  const { sugestoes, carregado } = useSugestoes(busca)
  const { session, role, prestadorStatus, roleLoading } = useAuth()

  let hrefCTA = '/login'
  let tituloCTA = 'É prestador de serviços?'
  let subtituloCTA = 'Cadastre-se e apareça para quem precisa de você'
  let acaoLogCTA = 'CLIQUE_CTA_PRESTADOR'

  if (session) {
    if (role === 'prestador') {
      if (prestadorStatus === 'pendente') {
        hrefCTA = '/cadastro'
        tituloCTA = 'Cadastro em andamento'
        subtituloCTA = 'Finalize seu perfil e apareça nas buscas'
        acaoLogCTA = 'CLIQUE_CTA_CONTINUAR_CADASTRO'
      } else {
        hrefCTA = '/dashboard'
        tituloCTA = 'Área do Profissional'
        subtituloCTA = 'Acesse seu painel e gerencie seus serviços'
        acaoLogCTA = 'CLIQUE_CTA_ACESSAR_PAINEL'
      }
    } else {
      hrefCTA = '/cadastro'
      tituloCTA = 'Quer oferecer serviços?'
      subtituloCTA = 'Crie seu perfil profissional agora mesmo'
      acaoLogCTA = 'CLIQUE_CTA_VIRAR_PRESTADOR'
    }
  }

  // Só faz sentido mostrar skeleton quando HÁ sessão mas o role/status
  // ainda não foi resolvido — sem sessão, o CTA padrão já é a resposta final.
  const mostrarSkeletonCTA = !!session && roleLoading

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
    insertLog({ acao: 'BUSCA_REALIZADA', detalhes: { termo: termoFinal }, entidadeTipo: 'busca' })
    router.push(`/prestadores?q=${encodeURIComponent(termoFinal)}`)
  }

  return (
    <main className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans antialiased overflow-x-hidden relative">

      <div
        className="absolute inset-0 pointer-events-none -z-0"
        style={{ background: 'radial-gradient(ellipse 90% 55% at 50% -5%, rgba(219,234,254,0.65) 0%, transparent 65%)' }}
      />

      <HeroSection />

      {/* Bloco principal */}
      <div className="relative z-10 flex flex-col items-center px-6 pt-[20vh] md:pt-[26vh]">
        <div className="w-full max-w-3xl flex flex-col items-center text-center gap-6">

          <Link href="/" className="block transition-transform active:scale-95 duration-200">
            <img
              src="/logo.png"
              alt="Procuro Quem Faça"
              className="h-14 md:h-24 w-auto object-contain drop-shadow-sm"
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
            {carregado && sugestoes.length > 0 && (
              <div className="flex flex-col items-center gap-3 w-full animate-in fade-in duration-300">
                <span className="text-[9px] md:text-[10px] font-black text-slate-300 uppercase tracking-[0.3em] italic">
                  {temBuscaReal ? 'Encontramos para você' : 'Sugestões em destaque'}
                </span>
                <div className="flex flex-wrap justify-center gap-1.5 md:gap-2">
                  {sugestoes.map(item => (
                    <button
                      key={item}
                      onClick={() => dispararBusca(null, item)}
                      className="bg-white text-slate-500 px-4 py-1.5 md:px-5 md:py-2 rounded-full text-[10px] md:text-xs font-bold border border-slate-100 hover:border-blue-400 hover:text-blue-600 transition-all active:scale-95 shadow-sm uppercase tracking-tight"
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

      {/* CTA para prestadores */}
      <div className="relative z-10 flex-1 flex items-end justify-center pb-12 px-6">
        <div className="w-full max-w-3xl">
          {mostrarSkeletonCTA ? (
            <CTAPrestadorSkeleton />
          ) : (
            <Link
              href={hrefCTA}
              onClick={() => insertLog({ acao: acaoLogCTA, entidadeTipo: 'home' })}
              className="group flex items-center justify-between gap-3 w-full px-5 py-4 md:px-8 md:py-5 rounded-[2rem] border border-slate-200/80 bg-white/60 backdrop-blur-sm hover:bg-white hover:border-blue-200 hover:shadow-lg hover:shadow-blue-50 transition-all duration-300"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 md:w-10 md:h-10 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0 group-hover:bg-blue-600 group-hover:border-blue-600 transition-all duration-300">
                  <Briefcase size={14} className="text-blue-500 group-hover:text-white transition-colors duration-300" />
                </div>
                <div className="text-left">
                  <p className="text-[10px] md:text-[11px] font-black uppercase tracking-widest text-slate-400 mb-0.5 transition-all">
                    {tituloCTA}
                  </p>
                  <p className="text-xs md:text-sm font-bold text-slate-700 transition-all">
                    {subtituloCTA}
                  </p>
                </div>
              </div>
              <ArrowRight
                size={16}
                className="text-slate-300 group-hover:text-blue-500 group-hover:translate-x-1 transition-all duration-300 shrink-0"
              />
            </Link>
          )}
        </div>
      </div>

    </main>
  )
}
