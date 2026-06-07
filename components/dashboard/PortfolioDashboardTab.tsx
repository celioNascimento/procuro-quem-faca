'use client'

import Image from 'next/image'
import { usePortfolioDashboard } from '@/hooks/usePortfolioDashboard'
import { DashboardHeader } from './DashboardHeader'
import { EstadoVazio } from './EstadoVazio'
import { ProjetoCard } from './ProjetoCard'
import UploadWizard from './UploadWizard'
import { UserCircle2 } from 'lucide-react'

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

  // ── Wizard ──────────────────────────────────────────────────────────────
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
    <div className="px-5 md:px-8 pb-20">

      {/* Layout de duas colunas — igual à aba Dados Profissionais */}
      <div className="flex flex-col md:flex-row gap-6 md:gap-8 items-start">

        {/* ── Coluna esquerda: avatar do prestador ── */}
        <div className="w-full md:w-56 shrink-0">
          <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden aspect-square flex items-center justify-center">
            {perfilPrestador?.foto_perfil ? (
              <img
                src={perfilPrestador.foto_perfil}
                alt={perfilPrestador.nome}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="flex flex-col items-center gap-2 text-slate-300">
                <UserCircle2 size={48} strokeWidth={1.5} />
                <span className="text-[9px] font-black uppercase tracking-widest text-slate-300">
                  Sua foto na vitrine
                </span>
              </div>
            )}
          </div>

          {perfilPrestador?.nome && (
            <p className="mt-3 text-center text-[11px] font-black text-slate-500 uppercase tracking-widest truncate">
              {perfilPrestador.nome}
            </p>
          )}
        </div>

        {/* ── Coluna direita: header + grid de projetos ── */}
        <div className="flex-1 min-w-0 space-y-6">
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

              {/* Slot vazio quando ímpar */}
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
      </div>
    </div>
  )
}