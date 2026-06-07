'use client'

import { usePortfolioDashboard } from '@/hooks/usePortfolioDashboard'
import { DashboardHeader } from './DashboardHeader'
import { EstadoVazio } from './EstadoVazio'
import { ProjetoCard } from './ProjetoCard'
import UploadWizard from './UploadWizard'
import { UserCircle2, MapPin, Phone, Star, Wrench, ExternalLink } from 'lucide-react'
import Link from 'next/link'

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

  // ── Dados derivados do perfil ────────────────────────────────────────────
  const nomeCidade = perfilPrestador?.cidade_nome ?? null
  const categoria  = perfilPrestador?.categoria ?? null
  const subcategoria = perfilPrestador?.categorias?.nome ?? null
  const whatsapp   = perfilPrestador?.whatsapp ?? null
  const mediaNota  = perfilPrestador?.media_nota ?? null
  const totalAvals = perfilPrestador?.total_avals ?? 0
  const slug       = perfilPrestador?.slug ?? null

  // ── Lista ──────────────────────────────────────────────────────────────
  return (
    <div className="px-5 md:px-8 pb-20">
      <div className="flex flex-col md:flex-row gap-6 md:gap-8 items-start">

        {/* ════════════════════════════════════════
            Coluna esquerda — mini vitrine
        ════════════════════════════════════════ */}
        <div className="w-full md:w-56 shrink-0 flex flex-col gap-3">

          {/* ── Card: foto + nome + slug ── */}
          <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
            {/* Foto */}
            <div className="aspect-square bg-slate-50 flex items-center justify-center">
              {perfilPrestador?.foto_perfil ? (
                <img
                  src={perfilPrestador.foto_perfil}
                  alt={perfilPrestador.nome}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="flex flex-col items-center gap-2 text-slate-300">
                  <UserCircle2 size={48} strokeWidth={1.5} />
                </div>
              )}
            </div>

            {/* Nome + slug */}
            <div className="px-4 py-3 border-t border-slate-100">
              <p className="font-black text-[13px] text-slate-800 truncate">
                {perfilPrestador?.nome ?? '—'}
              </p>
              {slug && (
                <p className="text-[11px] text-slate-400 truncate mt-0.5">
                  @{slug}
                </p>
              )}
            </div>
          </div>

          {/* ── Card: dados profissionais ── */}
          <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm divide-y divide-slate-100">

            {/* Categoria */}
            {(categoria || subcategoria) && (
              <div className="flex gap-3 items-start px-4 py-3">
                <Wrench size={14} className="text-slate-400 mt-0.5 shrink-0" />
                <div className="min-w-0">
                  <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-0.5">
                    Categoria
                  </p>
                  {categoria && (
                    <p className="text-[12px] font-bold text-slate-700 truncate">{categoria}</p>
                  )}
                  {subcategoria && (
                    <p className="text-[11px] text-slate-400 truncate">{subcategoria}</p>
                  )}
                </div>
              </div>
            )}

            {/* Cidade */}
            {nomeCidade && (
              <div className="flex gap-3 items-start px-4 py-3">
                <MapPin size={14} className="text-slate-400 mt-0.5 shrink-0" />
                <div className="min-w-0">
                  <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-0.5">
                    Cidade
                  </p>
                  <p className="text-[12px] font-bold text-slate-700 truncate">{nomeCidade}</p>
                </div>
              </div>
            )}

            {/* WhatsApp */}
            {whatsapp && (
              <div className="flex gap-3 items-start px-4 py-3">
                <Phone size={14} className="text-slate-400 mt-0.5 shrink-0" />
                <div className="min-w-0">
                  <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-0.5">
                    WhatsApp
                  </p>
                  <p className="text-[12px] font-bold text-slate-700 truncate">{whatsapp}</p>
                </div>
              </div>
            )}

            {/* Avaliação */}
            {mediaNota !== null && totalAvals > 0 && (
              <div className="flex gap-3 items-start px-4 py-3">
                <Star size={14} className="text-slate-400 mt-0.5 shrink-0" />
                <div className="min-w-0">
                  <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-0.5">
                    Avaliação
                  </p>
                  <p className="text-[12px] font-bold text-slate-700">
                    {mediaNota.toFixed(1)}
                    <span className="font-normal text-slate-400 ml-1">· {totalAvals} avaliação{totalAvals > 1 ? 'ões' : ''}</span>
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* ── Link: ver perfil público ── */}
          {slug && (
            <Link
              href={`/p/${slug}`}
              className="flex items-center gap-2 px-4 py-3 bg-slate-50 hover:bg-blue-50 border border-slate-100 hover:border-blue-200 rounded-[1.5rem] text-[11px] font-black uppercase tracking-widest text-slate-400 hover:text-blue-500 transition-all active:scale-95 group"
            >
              <ExternalLink size={13} className="shrink-0" />
              <span>Ver meu perfil</span>
              <span className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity text-[10px]">→</span>
            </Link>
          )}
        </div>

        {/* ════════════════════════════════════════
            Coluna direita — header + projetos
        ════════════════════════════════════════ */}
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