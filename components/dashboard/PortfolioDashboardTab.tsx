//components/dashboard/PortfolioDashboardTab.tsx

'use client'

import { usePortfolioDashboard } from '@/hooks/usePortfolioDashboard'
import { DashboardHeader } from './DashboardHeader'
import { EstadoVazio } from './EstadoVazio'
import { ProjetoCard } from './ProjetoCard'
import { PrestadorSideCard } from './PrestadorSideCard'
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
      <div className="grid items-start gap-6 lg:grid-cols-[17rem_minmax(0,1fr)] lg:gap-8 xl:grid-cols-[18rem_minmax(0,1fr)] xl:gap-10">
        <aside className="min-w-0 lg:sticky lg:top-48">
          <PrestadorSideCard
            nome={perfilPrestador?.nome}
            slug={perfilPrestador?.slug}
            foto_perfil={perfilPrestador?.foto_perfil}
            categoria={perfilPrestador?.categoria}
            subcategoria={perfilPrestador?.categorias?.nome}
            cidade_nome={perfilPrestador?.cidade_nome}
            whatsapp={perfilPrestador?.whatsapp}
            media_nota={perfilPrestador?.media_nota}
            total_avals={perfilPrestador?.total_avals}
          />
        </aside>

        <div className="min-w-0">
          {showWizard && meuPrestadorId !== null ? (
            <div className="animate-in fade-in duration-300">
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
    </div>
  )
}
