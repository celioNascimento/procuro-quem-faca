'use client'

import { usePortfolioDashboard } from '@/hooks/usePortfolioDashboard'
import { DashboardHeader } from './DashboardHeader'
import { EstadoVazio } from './EstadoVazio'
import { ProjetoCard } from './ProjetoCard'
import { PrestadorSideCard } from './PrestadorSideCard'
import UploadWizard from './UploadWizard'

export default function PortfolioDashboardTab() {
  const {
    projetos,
    loading,
    meuPrestadorId,
    perfilPrestador,
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

  // ── Layout base: sempre side card + coluna direita ──────────────────────
  return (
    <div className="px-5 md:px-8 pb-20">
      <div className="flex flex-col md:flex-row gap-6 md:gap-8 items-start">

        {/* Side card — fixo em ambos os modos */}
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

        {/* Coluna direita */}
        <div className="flex-1 min-w-0">

          {/* ── Modo Wizard ── */}
          {showWizard && meuPrestadorId !== null ? (
            <>
              <div className="flex items-center justify-between mb-4">
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
            </>

          ) : (
            // ── Modo Lista ──
            <div className="space-y-6">
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
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                  {projetos.map(proj => (
                    <ProjetoCard
                      key={proj.id}
                      projeto={proj}
                      onClick={abrirEdicao}
                    />
                  ))}

                  {projetos.length % 2 !== 0 && (
                    <button
                      onClick={abrirNovo}
                      className="flex flex-col items-center justify-center gap-2 rounded-[2rem] border-2 border-dashed border-slate-200 text-slate-300 hover:border-blue-300 hover:text-blue-400 hover:bg-blue-50/50 transition-all active:scale-95 min-h-[7rem]"
                    >
                      <span className="text-2xl font-black leading-none">+</span>
                      <span className="text-[9px] font-black uppercase tracking-widest">Novo projeto</span>
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