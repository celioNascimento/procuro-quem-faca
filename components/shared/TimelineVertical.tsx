import { ReactNode } from 'react'
import { CheckCircle2 } from 'lucide-react'

export type TimelineEstado = 'concluido' | 'ativo' | 'pendente'

export interface TimelineNo {
  key: string | number
  estado: TimelineEstado
  conteudo: ReactNode   // label + sublabel + foto ou qualquer coisa
}

interface Props {
  nos: TimelineNo[]
}

/**
 * Trilho visual compartilhado por LinhaDeTempo e WizardTimeline.
 * Responsabilidade única: renderizar bolinhas + linhas conectoras.
 * Toda lógica de negócio fica nos componentes filhos — eles montam
 * os nós e passam via props.
 */
export function TimelineVertical({ nos }: Props) {
  return (
    <div className="relative space-y-0">
      {nos.map((no, idx) => {
        const isLast = idx === nos.length - 1
        return (
          <div key={no.key} className="flex gap-4">

            {/* Coluna bolinha + linha */}
            <div className="flex flex-col items-center shrink-0 w-10">
              <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 border-2 transition-all ${
                no.estado === 'concluido'
                  ? 'bg-green-50 border-green-200'
                  : no.estado === 'ativo'
                  ? 'bg-blue-600 border-blue-600 shadow-lg shadow-blue-200'
                  : 'bg-slate-50 border-dashed border-slate-200'
              }`}>
                {no.estado === 'concluido' && (
                  <CheckCircle2 size={16} className="text-green-500" strokeWidth={2.5} />
                )}
                {no.estado === 'ativo' && (
                  <div className="w-2.5 h-2.5 bg-white rounded-full animate-pulse" />
                )}
                {no.estado === 'pendente' && (
                  <span className="text-[9px] font-black text-slate-300">{idx + 1}</span>
                )}
              </div>

              {!isLast && (
                <div className={`w-0.5 flex-1 min-h-[2rem] rounded-full my-1 transition-all duration-700 ${
                  no.estado === 'concluido' ? 'bg-blue-200' : 'bg-slate-100'
                }`} />
              )}
            </div>

            {/* Conteúdo do nó — definido pelo componente pai */}
            <div className={`flex-1 ${isLast ? 'pb-0' : 'pb-6'}`}>
              {no.conteudo}
            </div>

          </div>
        )
      })}
    </div>
  )
}