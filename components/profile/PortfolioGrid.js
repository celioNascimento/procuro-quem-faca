'use client'
import { useState } from 'react'
import ProjetoModal from './ProjetoModal'
import { Camera, CheckCircle2 } from 'lucide-react'

// Normaliza portfolio_fotos independente do formato que o Supabase retornar
// (null → [], objeto único → [objeto], array → array)
function normalizarFotos(raw) {
  if (!raw) return []
  if (Array.isArray(raw)) return raw
  if (typeof raw === 'object') return [raw]
  return []
}

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

  const gridClass =
    projetos.length === 1 ? 'grid grid-cols-1 max-w-[200px]' :
    projetos.length === 2 ? 'grid grid-cols-2 gap-2' :
                            'grid grid-cols-3 gap-1.5'

  return (
    <>
      <div className={gridClass}>
        {projetos.map((projeto) => {
          // Normaliza antes de qualquer operação
          const fotos = normalizarFotos(projeto.portfolio_fotos)
            .filter(f => f && f.url_foto)

          const isConcluido = projeto.status === 'finalizado'
            || fotos.some(f => Number(f.ordem) === 3)

          // Capa = foto de maior ordem (Depois > Durante > Antes)
          const fotoCapa = fotos.length > 0
            ? [...fotos].sort((a, b) => Number(b.ordem) - Number(a.ordem))[0].url_foto
            : '/placeholder-job.png'

          // Normaliza avaliacoes da mesma forma
          const avaliacoes = normalizarFotos(projeto.avaliacoes) // reutiliza mesma lógica
          const temIndicacao = avaliacoes.some(a => a.indica === true)

          return (
            <div
              key={projeto.id}
              onClick={() => setProjetoSelecionado(projeto)}
              className="group relative cursor-pointer"
            >
              {/* Miniatura quadrada */}
              <div className="relative aspect-square bg-slate-100 rounded-xl overflow-hidden border border-slate-100 shadow-sm hover:shadow-lg transition-all duration-300">

                <img
                  src={fotoCapa}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  alt={projeto.titulo}
                  onError={e => {
                    if (e.currentTarget.src !== window.location.origin + '/placeholder-job.png') {
                      e.currentTarget.src = '/placeholder-job.png'
                    }
                  }}
                />

                {/* Badge ✦ Indico */}
                {temIndicacao && (
                  <div className="absolute top-1.5 left-1.5 bg-blue-600 text-white text-[7px] font-black tracking-wide px-1.5 py-0.5 rounded-full flex items-center gap-0.5 shadow-md">
                    ✦ Indico
                  </div>
                )}

                {/* Overlay hover */}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-2.5">
                  <p className="text-white font-black italic uppercase text-[8px] leading-tight flex items-center gap-1">
                    <Camera size={8} /> Ver
                  </p>
                </div>
              </div>

              {/* Status abaixo da miniatura */}
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

              {/* Título */}
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
          // Passa fotos normalizadas para o modal não quebrar pelo mesmo motivo
          fotosNormalizadas={normalizarFotos(projetoSelecionado.portfolio_fotos).filter(f => f?.url_foto)}
        />
      )}
    </>
  )
}