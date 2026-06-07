'use client'

import { usePortfolioDashboard } from '@/hooks/usePortfolioDashboard'
import { DashboardHeader } from './DashboardHeader'
import { EstadoVazio } from './EstadoVazio'
import { ProjetoCard } from './ProjetoCard'
import UploadWizard from './UploadWizard'
import { ExternalLink, CheckCircle2 } from 'lucide-react'

export default function PortfolioDashboardTab() {
  const {
    projetos,
    loading,
    meuPrestadorId,
    perfilPrestador, // Trazemos o perfil completo que configuramos
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

  return (
    <div className="px-5 md:px-8 pb-20">
      {/* Container principal com Grid para as duas colunas */}
      <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] xl:grid-cols-[340px_1fr] gap-8 items-start">
        
        {/* ── Coluna Esquerda: Identidade do Prestador ── */}
        <aside className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm sticky top-32 flex flex-col items-center text-center">
          
          {/* Foto/Avatar do Banco */}
          <div className="w-32 h-32 bg-slate-50 rounded-[2rem] mb-6 border border-slate-100 shadow-inner flex items-center justify-center overflow-hidden">
             {perfilPrestador?.foto_perfil ? (
               <img src={perfilPrestador.foto_perfil} alt={perfilPrestador.nome} className="w-full h-full object-cover" />
             ) : (
               <span className="font-black text-slate-300 text-3xl italic">
                 {perfilPrestador?.nome?.charAt(0) || 'L'}
               </span>
             )}
          </div>
          
          <h2 className="text-xl font-black text-slate-800 uppercase italic tracking-tight">
            {perfilPrestador?.nome || 'Prestador'}
          </h2>
          
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1 mb-6">
            {perfilPrestador?.categorias?.nome || 'Profissional'}
          </p>
          
          {/* Tags de Habilidades do Banco */}
          <div className="flex flex-wrap gap-2 justify-center mb-8">
             {perfilPrestador?.habilidades?.slice(0, 3).map((hab, idx) => (
               <span key={idx} className="px-3 py-1 bg-slate-100 text-slate-600 text-[9px] font-black uppercase rounded-full">
                 {hab}
               </span>
             ))}
          </div>
          
          <div className="w-full h-px bg-slate-50 mb-8" />
          
          {/* Link Público Real */}
          <div className="w-full text-left bg-slate-50 p-4 rounded-3xl border border-slate-100">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center justify-between">
              Seu Perfil Público
              <CheckCircle2 size={12} className="text-green-500" />
            </p>
            <a 
              href={`/p/${perfilPrestador?.slug}`} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-[10px] font-bold text-blue-600 truncate hover:underline flex items-center gap-1"
            >
              procuroquemfaca.com.br/{perfilPrestador?.slug || 'slug'}
              <ExternalLink size={10} />
            </a>
          </div>
        </aside>

        {/* ── Coluna Direita: Gestão (Wizard ou Lista) ── */}
        <div className="space-y-6">
          {showWizard && meuPrestadorId ? (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-400">
              <div className="flex items-center justify-between mb-6 px-2">
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
              
              <UploadWizard
                key={projetoParaEdicao?.id || 'novo'}
                prestadorId={meuPrestadorId}
                projetoExistente={projetoParaEdicao}
                onComplete={fecharWizard}
              />
            </div>
          ) : (
            <>
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
                </div>
              )}
            </>
          )}
        </div>
        
      </div>
    </div>
  )
}