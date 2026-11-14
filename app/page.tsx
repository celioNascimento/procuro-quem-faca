'use client'
// app/page.tsx

import { useEffect, useState, useSyncExternalStore } from 'react'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useSugestoes } from '@/hooks/useSugestoes'
import { insertLog } from '@/lib/db/logs'
import SearchForm from '@/components/home/SearchForm'
import { ConviteLocalizacao } from '@/components/busca/ConviteLocalizacao'
import CTAPrestadorSkeleton from '@/components/home/CTAPrestadorSkeleton'
import { ArrowRight, Briefcase } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useLocation } from '@/lib/contexts/LocationContext'
import Logo from '@/components/Logo'

const HeroSection = dynamic(() => import('@/components/home/HeroSection'), { ssr: false })

export default function Home() {
  const router = useRouter()
  const [busca, setBusca] = useState('')
  const [erro, setErro] = useState(false)
  const { sugestoes, carregado } = useSugestoes(busca)
  const { cidadeAtual } = useLocation()
  // A cidade salva vem de um cookie e a dispensa do convite, do navegador: nenhuma existe no servidor.
  // Só mostramos o convite depois de carregar no navegador, para não dar diferença na hidratação.
  const noNavegador = useSyncExternalStore(() => () => {}, () => true, () => false)
  const { session, role, roleLoading } = useAuth()

  let hrefCTA = '/login'
  let tituloCTA = 'É prestador de serviços?'
  let subtituloCTA = 'Cadastre-se e apareça para quem precisa de você'
  let acaoLogCTA = 'CLIQUE_CTA_PRESTADOR'

  if (session && role !== 'prestador') {
    hrefCTA = '/cadastro'
    tituloCTA = 'Quer oferecer serviços?'
    subtituloCTA = 'Crie seu perfil profissional agora mesmo'
    acaoLogCTA = 'CLIQUE_CTA_VIRAR_PRESTADOR'
  }
  const souPrestador = !!session && role === 'prestador'

  const mostrarSkeletonCTA = !!session && roleLoading
  const temBuscaReal = busca.trim().length > 0

  // O aviso de "digite algo" some sozinho; o timer é limpo se a pessoa sair da página.
  useEffect(() => {
    if (!erro) return
    const timer = setTimeout(() => setErro(false), 4000)
    return () => clearTimeout(timer)
  }, [erro])

  function dispararBusca(e: React.FormEvent | null, termoManual?: string) {
    if (e?.preventDefault) e.preventDefault()
    const termoFinal = (termoManual || busca || '').trim()
    if (!termoFinal) {
      setErro(true)
      return
    }
    setErro(false)
    if (termoManual) setBusca(termoManual)
    insertLog({ acao: 'BUSCA_REALIZADA', detalhes: { termo: termoFinal }, entidadeTipo: 'busca' })

    const params = new URLSearchParams({ q: termoFinal })
    // Uma cidade escrita na busca tem prioridade sobre a cidade salva do usuário.
    // Ex.: “massoterapia em Maringá” não deve ser sobrescrita por Londrina.
    const cidadeInformada = termoFinal.match(/^.+?\s+em\s+.+$/i)
    if (!cidadeInformada && cidadeAtual?.id) params.set('cidade', cidadeAtual.id)
    router.push(`/prestadores?${params.toString()}`)
  }

  return (
    <main className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans antialiased overflow-x-hidden relative">

      <div
        className="absolute inset-0 pointer-events-none -z-0"
        style={{ background: 'radial-gradient(ellipse 90% 55% at 50% -5%, rgba(219,234,254,0.65) 0%, transparent 65%)' }}
      />

      <HeroSection />

      {/* Bloco principal */}
      <div className="relative z-10 flex flex-col items-center px-6 pt-[12vh] md:pt-[18vh]">
        <div className="w-full max-w-3xl flex flex-col items-center text-center gap-5">

          <Logo variant="hero" priority className="drop-shadow-sm" />

          <div className="flex flex-col items-center gap-1.5">
            <h1 className="text-balance text-xl font-bold leading-snug text-slate-800 md:text-2xl">
              Encontre profissionais perto de você
            </h1>
            <p className="text-balance text-base text-slate-600">
              Veja o perfil e chame direto no WhatsApp.
            </p>
          </div>

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
                <span className="text-sm font-semibold text-slate-600">
                  {temBuscaReal ? 'Encontramos para você' : 'Sugestões em destaque'}
                </span>
                <div className="flex flex-wrap justify-center gap-2">
                  {sugestoes.map(item => (
                    <button
                      key={item}
                      onClick={() => dispararBusca(null, item)}
                      className="min-h-11 bg-white text-slate-700 px-4 md:px-5 rounded-full text-sm font-semibold border border-slate-200 hover:border-blue-400 hover:text-blue-700 transition-all active:scale-95 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {noNavegador && !cidadeAtual && (
            <div className="w-full text-left">
              <ConviteLocalizacao compacto />
            </div>
          )}
        </div>
      </div>

      {/* CTA para prestadores. Quem já é prestador tem "Meu Painel"/"Completar Cadastro" no topo,
          que leva ao mesmo lugar; repetir o cartão aqui era redundante. */}
      {!souPrestador && (
        <div className="relative z-10 flex-1 flex items-end justify-center pt-6 pb-12 px-6">
          <div className="w-full max-w-3xl">
            {mostrarSkeletonCTA ? (
              <CTAPrestadorSkeleton />
            ) : (
              <Link
                href={hrefCTA}
                onClick={() => insertLog({ acao: acaoLogCTA, entidadeTipo: 'home' })}
                className="group flex min-h-16 items-center justify-between gap-3 w-full px-5 py-4 md:px-8 md:py-5 rounded-[2rem] border border-slate-200/80 bg-white/60 backdrop-blur-sm hover:bg-white hover:border-blue-200 hover:shadow-lg hover:shadow-blue-50 transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0 group-hover:bg-blue-600 group-hover:border-blue-600 transition-all duration-300">
                    <Briefcase size={16} aria-hidden="true" className="text-blue-500 group-hover:text-white transition-colors duration-300" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-bold text-slate-800">
                      {tituloCTA}
                    </p>
                    <p className="text-sm text-slate-600">
                      {subtituloCTA}
                    </p>
                  </div>
                </div>
                <ArrowRight
                  size={18}
                  aria-hidden="true"
                  className="text-slate-400 group-hover:text-blue-500 group-hover:translate-x-1 transition-all duration-300 shrink-0"
                />
              </Link>
            )}
          </div>
        </div>
      )}

    </main>
  )
}
