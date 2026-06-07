'use client'

import { usePortfolioDashboard } from '@/hooks/usePortfolioDashboard'
import { DashboardHeader } from './DashboardHeader'
import { EstadoVazio } from './EstadoVazio'
import { ProjetoCard } from './ProjetoCard'
import UploadWizard from './UploadWizard'

export default function PortfolioDashboardTab() {
  const {
    projetos,
    loading,
    meuPrestadorId,
    showWizard,
    projetoParaEdicao,
    totalConcluidos,
    totalAtivos,
    abrirEdicao,
    abrirNovo,
    fecharWizard,
  } = usePortfolioDashboard()

  if (loading) {
    return (
      <div className="px-5 md:px-8 space-y-4 animate-pulse">
        {[1, 2, 3].map(i => <div key={i} className="h-28 bg-slate-100 rounded-[2rem]" />)}
      </div>
    )
  }

  // ── Wizard ──────────────────────────────────────────────────────────────
  // meuPrestadorId agora é number | null — o guard `&& meuPrestadorId` é suficiente
  if (showWizard && meuPrestadorId !== null) {
    return (
      <div className="px-5 md:px-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-black text-slate-800 uppercase italic tracking-tight">
              {projetoParaEdicao ? 'Gerenciar Serviço' : 'Novo Serviço'}
            </h2>
            <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-widest mt-0.5">
              Preencha os dados abaixo
            </p>
          </div>
          <button
            onClick={fecharWizard}
            className="px-4 py-2 bg-slate-50 text-slate-500 border border-slate-200 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-slate-100 transition-all active:scale-95"
          >
            ← Voltar
          </button>
        </div>
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-400">
          <UploadWizard
            key={projetoParaEdicao?.id || 'novo'}
            prestadorId={meuPrestadorId}
            projetoExistente={projetoParaEdicao}
            onComplete={fecharWizard}
          />
        </div>
      </div>
    )
  }

  // ── Lista ──────────────────────────────────────────────────────────────
  return (
    <div className="px-5 md:px-8 pb-20 space-y-6">

      <DashboardHeader
        totalProjetos={projetos.length}
        totalConcluidos={totalConcluidos}
        totalAtivos={totalAtivos}
        onNovoProjeto={abrirNovo}
      />

      {projetos.length === 0 && (
        <EstadoVazio onNovoProjeto={abrirNovo} />
      )}

      {projetos.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {projetos.map(proj => (
            <ProjetoCard
              key={proj.id}
              projeto={proj}
              onClick={abrirEdicao}
            />
          ))}
        </div>
      )}
    </div>
  )
}