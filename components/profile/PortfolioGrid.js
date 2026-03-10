'use client'
import { useState } from 'react'
import ProjetoModal from './ProjetoModal'
import { Camera } from 'lucide-react'

export default function PortfolioGrid({ projetos = [] }) {
  const [projetoSelecionado, setProjetoSelecionado] = useState(null)

  if (projetos.length === 0) {
    return (
      <div className="bg-slate-50 border-2 border-dashed border-slate-100 rounded-[3rem] p-12 text-center">
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-300 italic">
          Nenhum registro de atividade ainda
        </p>
      </div>
    )
  }

  // Grid adaptativo — 1 projeto não fica solitário à esquerda
  const gridClass =
    projetos.length === 1 ? 'grid grid-cols-1 max-w-[220px]' :
    projetos.length === 2 ? 'grid grid-cols-2 gap-3 md:gap-6' :
                            'grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-6'

  return (
    <>
      <div className={gridClass}>
        {projetos.map((projeto) => {
          const fotos = projeto.portfolio_fotos || []

          // Number() garante comparação correta quando ordem vem como string do banco
          const isConcluido = fotos.some(f => Number(f.ordem) === 3)

          // Capa = foto de maior ordem (Depois > Durante > Antes)
          const fotoCapa = [...fotos].sort((a, b) => Number(b.ordem) - Number(a.ordem))[0]?.url_foto

          return (
            <div
              key={projeto.id}
              onClick={() => setProjetoSelecionado(projeto)}
              className="group relative aspect-square bg-white rounded-[2.5rem] overflow-hidden border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-500 cursor-pointer"
            >
              {/* Foto de capa */}
              <img
                src={fotoCapa || '/placeholder-job.png'}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                alt={projeto.titulo}
                onError={e => { e.target.src = '/placeholder-job.png' }}
              />

              {/* Indicador de status
                  Concluído → sem indicador (estado esperado, silêncio visual)
                  Em execução → bolinha pulsante "ao vivo" no canto superior direito */}
              {!isConcluido && (
                <div className="absolute top-3 right-3">
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500 border-2 border-white shadow-sm" />
                  </span>
                </div>
              )}

              {/* Hover overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 p-5 flex flex-col justify-end">
                <h4 className="text-white font-black italic uppercase text-[10px] mb-1 leading-tight">
                  {projeto.titulo}
                </h4>
                <p className="text-blue-300 text-[8px] font-bold uppercase tracking-widest flex items-center gap-1">
                  <Camera size={10} /> Ver registros
                </p>
              </div>
            </div>
          )
        })}
      </div>

      {projetoSelecionado && (
        <ProjetoModal
          projeto={projetoSelecionado}
          onClose={() => setProjetoSelecionado(null)}
        />
      )}
    </>
  )
}