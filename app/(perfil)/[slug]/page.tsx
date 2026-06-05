'use client'
import { useState } from 'react'
import Link from 'next/link'
import Header from '@/components/Header'
import PerfilSkeleton from '@/components/skeletons/PerfilSkeleton'
import PerfilHero from '@/components/profile/PerfilHero'
import PerfilSobre from '@/components/profile/PerfilSobre'
import PerfilCTA from '@/components/profile/PerfilCTA'
import PerfilAvaliacoes from '@/components/profile/PerfilAvaliacoes'
import PortfolioGrid from '@/components/profile/PortfolioGrid'
import { usePerfilPrestador } from '@/hooks/usePerfilPrestador'
import { useRastreamentoAtivacao } from '@/hooks/useRastreamentoAtivacao'
import { useLog } from '@/hooks/useLog'

export default function PerfilPublico() {
  const { data, loading, erro } = usePerfilPrestador()
  const { registrarLog }        = useLog()
  const [compartilhando, setCompartilhando] = useState(false)

  useRastreamentoAtivacao(data?.prestador ?? null)

  const handleCompartilhar = async () => {
    if (!data) return
    registrarLog('COMPARTILHAR_PERFIL_CLIQUE', { nome_prestador: data.prestador.nome }, data.prestador.id)

    const url   = window.location.href
    const texto = `Confira o trabalho de ${data.prestador.nome} no Procuro Quem Faça.`

    if (navigator.share) {
      try { await navigator.share({ title: data.prestador.nome, text: texto, url }) } catch {}
    } else {
      try { await navigator.clipboard.writeText(url) } catch {}
    }

    setCompartilhando(true)
    setTimeout(() => setCompartilhando(false), 1500)
  }

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

  const { prestador, projetos, avaliacoes, urlRetorno } = data
  const isPublico = prestador.origem_tipo === 'curadoria_publica'

  return (
    <main className="min-h-screen bg-[#F8FAFC] font-sans text-slate-800">
      <Header href={urlRetorno} />

      <div className="max-w-xl lg:max-w-6xl mx-auto pt-24 md:pt-32 pb-16 px-5 animate-in fade-in duration-500">

        {isPublico && (
          <Link
            href={`/reivindicar?id=${prestador.id}&nome=${encodeURIComponent(prestador.nome)}`}
            className="flex items-center gap-4 mb-6 bg-indigo-50 border border-indigo-100 p-5 rounded-[2rem] group hover:bg-indigo-600 transition-all duration-300 active:scale-[0.98]"
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

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 mt-4">
          
          {/* Coluna da Esquerda (Identidade Fixa no Desktop) */}
          <div className="lg:col-span-4 lg:sticky lg:top-32 self-start flex flex-col">
            <PerfilHero
              prestador={prestador}
              projetos={projetos}
              compartilhando={compartilhando}
              onCompartilhar={handleCompartilhar}
            />
          </div>

          {/* Coluna da Direita (Conteúdo de Leitura) */}
          <div className="lg:col-span-8 flex flex-col gap-6 lg:gap-8">
            <div className="space-y-4">
              <PerfilSobre prestador={prestador} />

              <PerfilCTA
                nome={prestador.nome}
                whatsapp={prestador.whatsapp}
                onClique={() => registrarLog('CLIQUE_WHATSAPP_ORCAMENTO', { nome_prestador: prestador.nome }, prestador.id)}
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