//components/dashboard/PortfolioDashboardTab.tsx

'use client'

import { usePortfolioDashboard } from '@/hooks/usePortfolioDashboard'
import Link from 'next/link'
import { ExternalLink } from 'lucide-react'
import { DashboardHeader } from './DashboardHeader'
import { EstadoVazio } from './EstadoVazio'
import { ProjetoCard } from './ProjetoCard'
import { UploadWizardContainer } from './wizard/UploadWizardContainer'

export default function PortfolioDashboardTab() {
  const {
    projetos, loading, meuPrestadorId, perfilPrestador,
    showWizard, projetoParaEdicao, totalConcluidos, totalAtivos,
    abrirEdicao, abrirNovo, fecharWizard,
  } = usePortfolioDashboard()

  if (loading) {
    return (
      <div className="grid animate-pulse gap-6 lg:grid-cols-[17rem_minmax(0,1fr)]">
        <div className="h-48 rounded-[2rem] bg-slate-100 lg:h-[28rem]" />
        <div className="flex flex-col gap-4">
          <div className="h-44 rounded-[2rem] bg-slate-100" />
          <div className="grid gap-4 xl:grid-cols-2">
            {[1, 2, 3, 4].map(i => <div key={i} className="h-32 rounded-[1.75rem] bg-slate-100" />)}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="pb-12 sm:pb-16">
      <div className="min-w-0">
        {showWizard && meuPrestadorId !== null ? (
            <div className="min-h-[32rem] animate-in fade-in duration-150">
              <UploadWizardContainer
                key={projetoParaEdicao?.id || 'novo'}
                prestadorId={meuPrestadorId}
                projetoExistente={projetoParaEdicao}
                onComplete={fecharWizard}
                onVoltar={fecharWizard}
                isEdicao={!!projetoParaEdicao}
              />
            </div>
        ) : (
          <div className="flex flex-col gap-6">
            {perfilPrestador?.slug && (
              <Link
                href={`/${perfilPrestador.slug}`}
                className="flex min-h-12 items-center justify-center gap-3 rounded-2xl border-2 border-blue-600 bg-white px-5 py-3 text-sm font-bold uppercase tracking-[0.08em] text-blue-600 shadow-sm shadow-blue-100 transition-all hover:-translate-y-0.5 hover:bg-blue-50 hover:shadow-md focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-100 active:translate-y-0"
              >
                <ExternalLink size={18} aria-hidden="true" />
                Ver meu perfil público
              </Link>
            )}
            <DashboardHeader
                totalProjetos={projetos.length}
                totalConcluidos={totalConcluidos}
                totalAtivos={totalAtivos}
                onNovoProjeto={abrirNovo}
              />
              {projetos.length === 0 && <EstadoVazio onNovoProjeto={abrirNovo} />}
              {projetos.length > 0 && (
                <div className="grid gap-4 xl:grid-cols-2">
                  {projetos.map(proj => (
                    <ProjetoCard key={proj.id} projeto={proj} onClick={abrirEdicao} />
                  ))}
                  {projetos.length % 2 !== 0 && (
                    <button
                      type="button"
                      onClick={abrirNovo}
                      className="flex min-h-32 flex-col items-center justify-center gap-2 rounded-[1.75rem] border-2 border-dashed border-slate-200 bg-white text-slate-400 transition-colors hover:border-blue-300 hover:bg-blue-50/50 hover:text-blue-600 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-100"
                    >
                      <span className="text-2xl font-black leading-none" aria-hidden="true">+</span>
                      <span className="text-[10px] font-black uppercase tracking-widest">Novo projeto</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
      </div>
    </div>
  )
}
