// app/(perfil)/[slug]/page.tsx

'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Header from '@/components/Header'
import PerfilSkeleton from '@/components/skeletons/PerfilSkeleton'
import PerfilHero from '@/components/profile/PerfilHero'
import PerfilSobre from '@/components/profile/PerfilSobre'
import PerfilCTA from '@/components/profile/PerfilCTA'
import PerfilTabs from '@/components/profile/PerfilTabs'   // ← substitui PortfolioGrid + PerfilAvaliacoes
import { SessaoFotos } from '@/components/profile/SessaoFotos'
import { AdCard } from '@/components/ads/AdCard'
import { usePerfilPrestador } from '@/hooks/usePerfilPrestador'
import { RastreamentoAtivacaoProvider } from '@/components/RastreamentoAtivacaoProvider'
import { insertLog } from '@/lib/db/logs'
import { useCompartilharPerfil } from '@/hooks/useCompartilharPerfil'
import { BadgeCheck } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import type { PrestadorPerfil, ProjetoPerfil } from '@/types/perfil'
import type { Anuncio } from '@/types/ads'

// ── Sub-componente interno — hooks chamados após os dados estarem garantidos ──

interface PerfilCarregadoProps {
  prestador: PrestadorPerfil
  projetos: ProjetoPerfil[]
  avaliacoes: ReturnType<typeof usePerfilPrestador>['data'] extends infer D
    ? D extends { avaliacoes: infer A } ? A : never
    : never
  urlRetorno: string
}

function PerfilCarregado({ prestador, projetos, avaliacoes, urlRetorno }: PerfilCarregadoProps) {
  const { status: statusCompartilhamento, compartilhar } = useCompartilharPerfil({
    prestador,
    projetos,
    origem: 'perfil_publico',
  })

  const isPublico = prestador.origem_tipo === 'curadoria_publica'
  const [anuncioTopo, setAnuncioTopo] = useState<Anuncio | null | undefined>(undefined)

  useEffect(() => {
    let cancelado = false

    async function carregarAnuncio() {
      const { data, error } = await supabase
        .from('anuncios')
        .select('*')
        .eq('status', true)
        .eq('status_aprovacao', 'aprovado')
        .eq('posicao', 'topo_perfil')

      if (cancelado) return

      if (!error && data && data.length > 0) {
        const adAleatorio = data[Math.floor(Math.random() * data.length)]
        setAnuncioTopo(adAleatorio as Anuncio)
      } else {
        setAnuncioTopo(null)
      }
    }
    carregarAnuncio()

    return () => { cancelado = true }
  }, [])

  return (
    <main className="min-h-screen bg-[#F8FAFC] font-sans text-slate-800">
      <Header href={urlRetorno} />

      <div className="mx-auto w-full max-w-7xl px-4 pb-14 pt-20 sm:px-6 sm:pb-20 sm:pt-24 lg:px-8 lg:pt-32">
        <div className="mx-auto flex w-full max-w-3xl items-center justify-center animate-in fade-in duration-500">
          <AdCard
            page="perfil_prestador"
            anuncio={anuncioTopo}
            categoria={prestador.categorias?.nome || prestador.categoria}
          />
        </div>

        <div className="mt-5 grid items-start gap-6 lg:mt-8 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)] lg:gap-10 xl:grid-cols-[minmax(0,24rem)_minmax(0,1fr)] xl:gap-14">
          <aside className="min-w-0 lg:sticky lg:top-28">
            <div className="flex flex-col gap-4 animate-in fade-in duration-500 lg:gap-5">
              <PerfilHero
                prestador={prestador}
                projetos={projetos}
                compartilhando={statusCompartilhamento === 'copiado'}
                onCompartilhar={compartilhar}
              />

              {isPublico && (
                <Link
                  href={`/reivindicar?id=${prestador.id}&nome=${encodeURIComponent(prestador.nome)}`}
                  className="group flex items-center gap-3 rounded-[1.75rem] border border-indigo-100 bg-indigo-50 p-4 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:bg-indigo-[...]"
                >
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white text-indigo-600 shadow-sm transition-transform group-hover:scale-105">
                    <BadgeCheck size={20} aria-hidden="true" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-[11px] font-black uppercase tracking-wide text-indigo-900 transition-colors group-hover:text-white">
                      Este é o seu perfil?
                    </span>
                    <span className="mt-0.5 block text-[10px] font-semibold leading-relaxed text-indigo-600/75 transition-colors group-hover:text-white/80">
                      Reivindique para editar suas informações.
                    </span>
                  </span>
                </Link>
              )}
            </div>
          </aside>

          <div className="flex min-w-0 flex-col gap-7 animate-in fade-in duration-500 sm:gap-8 lg:gap-10">
            <div className="flex flex-col gap-4">
              <PerfilSobre prestador={prestador} />
              <PerfilCTA
                nome={prestador.nome}
                whatsapp={prestador.whatsapp}
                onClique={() => insertLog({
                  acao: 'CLIQUE_WHATSAPP_ORCAMENTO',
                  detalhes: { nome_prestador: prestador.nome },
                  entidadeId: String(prestador.id),
                })}
              />
            </div>

            {/* Portfólio + Avaliações em abas — passa portfolioObrigatorio */}
            <PerfilTabs 
              projetos={projetos} 
              avaliacoes={avaliacoes}
              portfolioObrigatorio={prestador.portfolio_obrigatorio}
            />
            <SessaoFotos sessao={prestador.sessao_fotos} />
          </div>
        </div>
      </div>
    </main>
  )
}

// ── Componente raiz — só gerencia loading/erro ──────────────────────────────

export default function PerfilPublico() {
  const { data, loading, erro } = usePerfilPrestador()

  if (loading) return <PerfilSkeleton />

  if (erro || !data) {
    return (
      <main className="min-h-screen bg-[#F8FAFC] font-sans flex flex-col items-center justify-center p-6 text-center">
        <Header href="/prestadores" />
        <div className="pt-24 space-y-6">
          <h3 className="text-2xl font-black text-slate-300 uppercase italic tracking-tighter">
            Perfil não encontrado
          </h3>
          <Link
            href="/prestadores"
            className="inline-block px-8 py-4 bg-blue-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg hover:bg-blue-700 active:scale-95 transition-all"
          >
            Ver Profissionais
          </Link>
        </div>
      </main>
    )
  }

  return (
    <>
      <RastreamentoAtivacaoProvider prestador={data.prestador} />
      <PerfilCarregado {...data} />
    </>
  )
}
