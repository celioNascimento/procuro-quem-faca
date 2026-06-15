'use client'
import { useState } from 'react'
import { Camera, CheckCircle2 } from 'lucide-react'
import ProjetoModal from './ProjetoModal'
import type { ProjetoPerfil } from '@/types/perfil'

interface Props {
  projetos: ProjetoPerfil[]
}

export default function PortfolioGrid({ projetos }: Props) {
  const [projetoSelecionado, setProjetoSelecionado] = useState<ProjetoPerfil | null>(null)

  if (projetos.length === 0) {
    return (
      <div className="bg-slate-50 border-2 border-dashed border-slate-100 rounded-[3rem] p-12 text-center">
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-300 italic">
          Nenhum registro de atividade ainda
        </p>
      </div>
    )
  }

  const gridClass =
  projetos.length === 1 ? 'grid grid-cols-2 gap-2' :  
  projetos.length === 2 ? 'grid grid-cols-2 gap-2' :
                          'grid grid-cols-2 sm:grid-cols-3 gap-2''

  return (
    <>
      <div className={gridClass}>
        {projetos.map((projeto) => {
          const fotoCapa = projeto.portfolio_fotos.length > 0
            ? [...projeto.portfolio_fotos].sort((a, b) => b.ordem - a.ordem)[0].url_foto
            : '/placeholder-job.png'

          const isConcluido = projeto.status === 'finalizado'
            || projeto.portfolio_fotos.some(f => f.ordem === 3)

          const temIndicacao = projeto.avaliacoes.some(a => a.indica)

          return (
            <div
              key={projeto.id}
              onClick={() => setProjetoSelecionado(projeto)}
              className="group relative cursor-pointer"
            >
              <div className="relative aspect-square bg-slate-100 rounded-xl overflow-hidden border border-slate-100 shadow-sm hover:shadow-lg transition-all duration-300">
                <img
                  src={fotoCapa}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  alt={projeto.titulo}
                  onError={e => {
                    if (e.currentTarget.src !== window.location.origin + '/placeholder-job.png')
                      e.currentTarget.src = '/placeholder-job.png'
                  }}
                />

                {temIndicacao && (
                  <div className="absolute top-1.5 left-1.5 bg-blue-600 text-white text-[7px] font-black tracking-wide px-1.5 py-0.5 rounded-full flex items-center gap-0.5 shadow-md">
                    ✦ Indico
                  </div>
                )}

                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-2.5">
                  <p className="text-white font-black italic uppercase text-[8px] leading-tight flex items-center gap-1">
                    <Camera size={8} /> Ver
                  </p>
                </div>
              </div>

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