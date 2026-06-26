'use client'
import Link from 'next/link'
import Header from '@/components/Header'
import PerfilSkeleton from '@/components/skeletons/PerfilSkeleton'
import PerfilHero from '@/components/profile/PerfilHero'
import PerfilSobre from '@/components/profile/PerfilSobre'
import PerfilCTA from '@/components/profile/PerfilCTA'
import PerfilAvaliacoes from '@/components/profile/PerfilAvaliacoes'
import PortfolioGrid from '@/components/profile/PortfolioGrid'
import { AdCard } from '../../../components/ads/AdCard'
import { usePerfilPrestador } from '@/hooks/usePerfilPrestador'
import { RastreamentoAtivacaoProvider } from '@/components/RastreamentoAtivacaoProvider'
import { insertLog } from '@/hooks/useLog'
import { useCompartilharPerfil } from '@/hooks/useCompartilharPerfil'
import type { AdPage } from '@/types/ads'
import type { PrestadorPerfil, ProjetoPerfil } from '@/types/perfil'

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

  return (
    <main className="min-h-screen bg-[#F8FAFC] font-sans text-slate-800">
      <Header href={urlRetorno} />

      <div className="max-w-xl lg:max-w-6xl mx-auto pt-24 md:pt-32 pb-16 px-5">

        <div className="w-full max-w-xl lg:max-w-3xl mx-auto mb-6 flex items-center justify-center animate-in fade-in duration-500">
          <AdCard
            page={"perfil" as AdPage}
            categoria={prestador.categorias?.nome || prestador.categoria}
          />
        </div>

        {isPublico && (
          <Link
            href={`/reivindicar?id=${prestador.id}&nome=${encodeURIComponent(prestador.nome)}`}
            className="flex items-center gap-4 mb-6 bg-indigo-50 border border-indigo-100 p-5 rounded-[2rem] group hover:bg-indigo-600 transition-all duration-300 active:scale-[0.98] animate-in fade-in duration-500"
          >
            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-lg shadow-sm shrink-0 group-hover:scale-110 transition-transform">
              🤝
            </div>
            <div>
              <p className="text-indigo-900 font-black uppercase text-[10px] italic group-hover:text-white transition-colors">
                Este é o seu perfil?
              </p>
              <p className="text-indigo-600/70 text-[9px] font-semibold uppercase leading-tight group-hover:text-white/80 transition-colors">
                Reivindique agora para editar suas informações.
              </p>
            </div>
          </Link>
        )}

        <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 mt-4 relative">

          <div className="w-full lg:w-1/3 shrink-0 relative">
            <div className="lg:sticky lg:top-32 flex flex-col gap-6 animate-in fade-in duration-500">
              <PerfilHero
                prestador={prestador}
                projetos={projetos}
                compartilhando={statusCompartilhamento === 'copiado'}
                onCompartilhar={compartilhar}
              />
            </div>
          </div>

          <div className="w-full lg:w-2/3 flex flex-col gap-6 lg:gap-8 animate-in fade-in duration-500">
            <div className="space-y-4">
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

            <section className="space-y-3">
              <h2 className="text-[10px] font-black uppercase tracking-widest text-blue-600 px-1">
                Registros de Atividade
              </h2>
              <PortfolioGrid projetos={projetos} />
            </section>

            <PerfilAvaliacoes avaliacoes={avaliacoes} />
          </div>

        </div>
      </div>
    </main>
  )
}

// ── Componente raiz — só gerencia loading/erro ─────────────────────────────

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