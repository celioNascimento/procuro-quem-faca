'use client'
import { useState } from 'react'
import ProjetoModal from './ProjetoModal' // Importe o componente acima

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

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-6">
        {projetos.map((projeto) => {
          const fotos = projeto.portfolio_fotos || []
          const isConcluido = fotos.some(f => f.ordem === 3)
          const fotoCapa = [...fotos].sort((a, b) => b.ordem - a.ordem)[0]?.url_foto

          return (
            <div 
              key={projeto.id} 
              onClick={() => setProjetoSelecionado(projeto)}
              className="group relative aspect-square bg-white rounded-[2.5rem] overflow-hidden border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-500 cursor-pointer"
            >
              <img 
                src={fotoCapa || '/placeholder-job.png'} 
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              />
              <div className="absolute top-4 left-4 right-4 flex justify-between">
                <div className={`px-3 py-1.5 rounded-full text-[8px] font-black uppercase tracking-tighter backdrop-blur-md ${isConcluido ? 'bg-green-500/90 text-white' : 'bg-blue-600/90 text-white'}`}>
                  {isConcluido ? '✓ Concluído' : '🛠️ Em Execução'}
                </div>
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-6 flex flex-col justify-end">
                <h4 className="text-white font-black italic uppercase text-[10px]">{projeto.titulo}</h4>
              </div>
            </div>
          )
        })}
      </div>

      {/* Modal Renderizado quando houver seleção */}
      {projetoSelecionado && (
        <ProjetoModal 
          projeto={projetoSelecionado} 
          onClose={() => setProjetoSelecionado(null)} 
        />
      )}
    </>
  )
}