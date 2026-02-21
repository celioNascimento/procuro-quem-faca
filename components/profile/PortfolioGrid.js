'use client'
import { useState } from 'react'
import ProjetoModal from './ProjetoModal'
import { MessageCircle, Camera } from 'lucide-react'

export default function PortfolioGrid({ projetos = [] }) {
  const [projetoSelecionado, setProjetoSelecionado] = useState(null)

  if (projetos.length === 0) {
    return (
      <div className="bg-slate-50 border-2 border-dashed border-slate-100 rounded-[3rem] p-12 text-center">
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-300 italic text-center">
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
                alt={projeto.titulo}
              />
              
              <div className="absolute top-3 left-3 right-3 flex justify-between items-center">
                <div className={`px-3 py-1.5 rounded-full text-[8px] font-black uppercase tracking-tighter backdrop-blur-md shadow-sm ${isConcluido ? 'bg-green-500/90 text-white' : 'bg-blue-600/90 text-white'}`}>
                  {isConcluido ? '✓ Concluído' : '🛠️ Em Execução'}
                </div>

                <div className="w-7 h-7 bg-white/90 backdrop-blur-md rounded-full flex items-center justify-center text-blue-600 shadow-sm border border-white/20 animate-pulse">
                  <MessageCircle size={12} fill="currentColor" className="opacity-20" />
                </div>
              </div>

              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-6 flex flex-col justify-end">
                <h4 className="text-white font-black italic uppercase text-[10px] mb-1">{projeto.titulo}</h4>
                <p className="text-blue-300 text-[8px] font-bold uppercase tracking-widest flex items-center gap-1">
                  <MessageCircle size={10} /> Ver histórico do serviço
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