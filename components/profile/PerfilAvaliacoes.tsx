//components/profile/PerfilAvaliacoes.tsx

'use client'
import { User, Calendar, Wrench, ArrowRight } from 'lucide-react'
import type { AvaliacaoPerfil, ProjetoPerfil } from '@/types/perfil'

interface Props {
  avaliacoes: AvaliacaoPerfil[]
  projetos?: ProjetoPerfil[]
  onVerProjeto?: (projetoId: string | number) => void
}

export default function PerfilAvaliacoes({ avaliacoes, projetos, onVerProjeto }: Props) {
  if (avaliacoes.length === 0) return null

  const totalIndica = avaliacoes.filter(a => a.indica === true).length
  const totalNaoIndica = avaliacoes.filter(a => a.indica === false).length

  const formatarData = (dataIso?: string) => {
    if (!dataIso) return ''
    try {
      return new Intl.DateTimeFormat('pt-BR', {
        day: '2-digit', month: 'short', year: 'numeric',
      }).format(new Date(dataIso)).replace(' de ', '/').replace('. de ', '/')
    } catch { return '' }
  }

  return (
    <section className="space-y-4">
      {/* Cabeçalho com contadores */}
      <div className="flex items-center justify-between px-1">
        <h2 className="text-[10px] font-black uppercase tracking-widest text-blue-600">
          Avaliações
        </h2>
        <div className="flex items-center gap-2">
          {totalIndica > 0 && (
            <span className="flex items-center gap-1 bg-blue-50 text-blue-600 text-[9px] font-black tracking-wide px-2.5 py-1 rounded-full border border-blue-100">
              👍 {totalIndica} {totalIndica === 1 ? 'indicação' : 'indicações'}
            </span>
          )}
          {totalNaoIndica > 0 && (
            <span className="flex items-center gap-1 bg-slate-100 text-slate-500 text-[9px] font-black tracking-wide px-2.5 py-1 rounded-full border border-slate-200">
              👎 {totalNaoIndica} não {totalNaoIndica === 1 ? 'indica' : 'indicam'}
            </span>
          )}
        </div>
      </div>

      {/* Cards */}
      <div className="space-y-4">
        {avaliacoes.map(av => {
          const projetoTitulo =
            av.portfolio_projetos?.titulo ??
            projetos?.find(p => String(p.id) === String(av.projeto_id))?.titulo

          const temProjeto = !!(av.projeto_id && projetoTitulo)
          const handleProjeto = onVerProjeto && av.projeto_id
            ? () => onVerProjeto(av.projeto_id!)
            : undefined

          return (
            <div
              key={av.id}
              className="bg-white rounded-[2rem] p-5 sm:p-6 border border-slate-100 shadow-sm flex flex-col gap-4 transition-all hover:shadow-md"
            >
              {/* Cabeçalho */}
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  {/* Avatar */}
                  <div className="w-10 h-10 bg-slate-50 border border-slate-100 rounded-[1rem] overflow-hidden shrink-0 flex items-center justify-center">
                    // avatar:
                    {av.cliente_foto_url
                      ? <img
                        src={av.cliente_foto_url}
                        alt={av.cliente_nome ?? 'Cliente'}
                        className="w-full h-full object-cover"
                      />
                      : <User size={16} className="text-slate-300" />
                    }

// nome:
                    {av.cliente_nome ?? 'Cliente Verificado'}
                  </div>

                  <div>
                    <p className="text-[12px] font-bold text-slate-800 tracking-tight">
                      {av.cliente_nome ?? 'Cliente Verificado'}
                    </p>
                    {av.created_at && (
                      <p className="text-[10px] text-slate-400 font-medium flex items-center gap-1 mt-0.5 capitalize">
                        <Calendar size={10} /> {formatarData(av.created_at)}
                      </p>
                    )}
                  </div>
                </div>

                {av.indica === true && (
                  <span className="flex items-center gap-1 bg-blue-600 text-white text-[9px] font-black tracking-wide px-2.5 py-1.5 rounded-xl shrink-0 shadow-sm shadow-blue-200">
                    👍 Indico
                  </span>
                )}
                {av.indica === false && (
                  <span className="flex items-center gap-1 bg-slate-700 text-white text-[9px] font-black tracking-wide px-2.5 py-1.5 rounded-xl shrink-0">
                    👎 Não indico
                  </span>
                )}
              </div>

              {/* Comentário */}
              {av.comentario && (
                <p className="text-[13px] font-medium text-slate-600 leading-relaxed italic bg-slate-50/50 p-4 rounded-[1.25rem] border border-slate-50">
                  "{av.comentario}"
                </p>
              )}

              {/* Link para o projeto */}
              {temProjeto && (
                <button
                  type="button"
                  onClick={handleProjeto}
                  className="flex items-center justify-between pt-3 mt-1 border-t border-slate-50 group text-left w-full focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-100 rounded-lg"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-blue-50 rounded-lg flex items-center justify-center shrink-0 group-hover:bg-blue-600 transition-colors duration-300">
                      <Wrench size={12} className="text-blue-500 group-hover:text-white transition-colors" />
                    </div>
                    <p className="text-[10px] font-black text-slate-400 truncate uppercase tracking-widest group-hover:text-blue-600 transition-colors duration-300">
                      {projetoTitulo}
                    </p>
                  </div>
                  <ArrowRight size={14} className="text-slate-200 group-hover:text-blue-600 group-hover:translate-x-1 transition-all duration-300" />
                </button>
              )}
            </div>
          )
        })}
      </div>
    </section>
  )
}