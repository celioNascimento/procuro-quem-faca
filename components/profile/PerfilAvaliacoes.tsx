//components/profile/PerfilAvaliacoes.tsx

import { User, Calendar, Wrench } from 'lucide-react'
import type { AvaliacaoPerfil } from '@/types/perfil'

interface Props {
  avaliacoes: AvaliacaoPerfil[]
}

export default function PerfilAvaliacoes({ avaliacoes }: Props) {
  if (avaliacoes.length === 0) return null

  const totalIndica = avaliacoes.filter(a => a.indica).length

  // Função segura para formatar a data
  const formatarData = (dataIso?: string) => {
    if (!dataIso) return ''
    try {
      return new Intl.DateTimeFormat('pt-BR', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      }).format(new Date(dataIso)).replace(' de ', '/').replace('. de ', '/')
    } catch {
      return ''
    }
  }

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between px-1">
        <h2 className="text-[10px] font-black uppercase tracking-widest text-blue-600">
          Avaliações
        </h2>
        <div className="flex items-center gap-3">
          {totalIndica > 0 && (
            <span className="flex items-center gap-1 bg-blue-50 text-blue-600 text-[9px] font-black tracking-wide px-2.5 py-1 rounded-full border border-blue-100">
              ✦ {totalIndica} {totalIndica === 1 ? 'indicação' : 'indicações'}
            </span>
          )}
        </div>
      </div>

      <div className="space-y-4">
        {avaliacoes.map(av => (
          <div key={av.id} className="bg-white rounded-[2rem] p-5 sm:p-6 border border-slate-100 shadow-sm flex flex-col gap-4 transition-all hover:shadow-md">
            
            {/* Cabeçalho do Card: Avatar, Cliente e Data */}
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-slate-50 border border-slate-100 rounded-[1rem] flex items-center justify-center shrink-0">
                  <User size={16} className="text-slate-300" />
                </div>
                <div>
                  <p className="text-[12px] font-bold text-slate-800 tracking-tight">
                    Cliente Verificado
                  </p>
                  {av.created_at && (
                    <p className="text-[10px] text-slate-400 font-medium flex items-center gap-1 mt-0.5 capitalize">
                      <Calendar size={10} /> {formatarData(av.created_at)}
                    </p>
                  )}
                </div>
              </div>
              
              {av.indica && (
                <span className="flex items-center gap-1 bg-blue-600 text-white text-[9px] font-black tracking-wide px-2.5 py-1.5 rounded-xl shrink-0 shadow-sm shadow-blue-200">
                  ✦ Indico
                </span>
              )}
            </div>

            {/* Comentário (com leve background para destacar o texto) */}
            {av.comentario && (
              <p className="text-[13px] font-medium text-slate-600 leading-relaxed italic bg-slate-50/50 p-4 rounded-[1.25rem] border border-slate-50">
                "{av.comentario}"
              </p>
            )}

            {/* Rodapé: Serviço Relacionado */}
            {av.portfolio_projetos?.titulo && (
              <div className="flex items-center gap-1.5 pt-1 mt-1">
                <Wrench size={12} className="text-slate-300 shrink-0" />
                <p className="text-[10px] font-semibold text-slate-400 truncate uppercase tracking-wider">
                  {av.portfolio_projetos.titulo}
                </p>
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  )
}
