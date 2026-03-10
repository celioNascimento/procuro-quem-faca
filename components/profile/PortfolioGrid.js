'use client'
import { useState } from 'react'
import ProjetoModal from './ProjetoModal'
import { Camera, CheckCircle2, Activity } from 'lucide-react'

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

  // Grid compacto — células menores e mais organizadas
  // max-w limita para não crescer demais em telas largas
  const gridClass =
    projetos.length === 1 ? 'grid grid-cols-1 max-w-[160px]' :
    projetos.length === 2 ? 'grid grid-cols-2 gap-2.5' :
                            'grid grid-cols-3 gap-2.5'

  return (
    <>
      <div className={gridClass}>
        {projetos.map((projeto) => {
          const fotos = projeto.portfolio_fotos || []
          const isConcluido = projeto.status === 'finalizado' || fotos.some(f => Number(f.ordem) === 3)
          const fotoCapa = [...fotos].sort((a, b) => Number(b.ordem) - Number(a.ordem))[0]?.url_foto

          return (
            <div
              key={projeto.id}
              onClick={() => setProjetoSelecionado(projeto)}
              className="group relative cursor-pointer"
            >
              {/* Miniatura quadrada — tamanho controlado */}
              <div className="relative aspect-square bg-white rounded-2xl overflow-hidden border border-slate-100 shadow-sm hover:shadow-lg transition-all duration-300">

                <img
                  src={fotoCapa || '/placeholder-job.png'}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  alt={projeto.titulo}
                  onError={e => { e.target.src = '/placeholder-job.png' }}
                />

                {/* Overlay no hover */}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-2.5">
                  <p className="text-white font-black italic uppercase text-[8px] leading-tight flex items-center gap-1">
                    <Camera size={8} /> Ver
                  </p>
                </div>
              </div>

              {/* Badge de status ABAIXO da miniatura — sempre visível, não flutua sobre a foto */}
              <div className="flex items-center gap-1 mt-1.5 px-0.5">
                {isConcluido ? (
                  <>
                    <CheckCircle2 size={9} className="text-green-500 shrink-0" />
                    <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider truncate">
                      Concluído
                    </span>
                  </>
                ) : (
                  <>
                    <span className="relative flex h-2 w-2 shrink-0">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500" />
                    </span>
                    <span className="text-[8px] font-bold text-blue-500 uppercase tracking-wider truncate">
                      Em andamento
                    </span>
                  </>
                )}
              </div>

              {/* Título truncado */}
              <p className="text-[8px] font-semibold text-slate-400 truncate mt-0.5 px-0.5">
                {projeto.titulo}
              </p>
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