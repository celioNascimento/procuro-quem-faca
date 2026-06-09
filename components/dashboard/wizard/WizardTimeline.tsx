'use client'

import { useUploadWizard } from '@/hooks/useUploadWizard'

type HookData = ReturnType<typeof useUploadWizard>

interface WizardTimelineProps {
  hookData: HookData
}

const ETAPAS = [
  { ordem: 1, label: 'Início' },
  { ordem: 2, label: 'Execução' },
  { ordem: 3, label: 'Conclusão' },
]

export function WizardTimeline({ hookData }: WizardTimelineProps) {
  const { fotosUrls, projetoStatus } = hookData.state
  const { isProjetoConcluido } = hookData.derived

  const getEstado = (ordem: number) => {
    if (fotosUrls[ordem]) return 'concluido'
    const anterior = ordem > 1 ? fotosUrls[ordem - 1] : true
    if (anterior) return 'ativo'
    return 'pendente'
  }

  return (
    <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-4 flex flex-col gap-1">
      <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2 px-1">
        Etapas
      </p>

      <div className="flex flex-col gap-0">
        {ETAPAS.map((etapa, idx) => {
          const estado = getEstado(etapa.ordem)
          const isLast = idx === ETAPAS.length - 1

          return (
            <div key={etapa.ordem} className="flex items-stretch gap-3">
              {/* Coluna do indicador + linha */}
              <div className="flex flex-col items-center w-5 shrink-0">
                {/* Círculo */}
                <div
                  className={`
                    w-5 h-5 rounded-full flex items-center justify-center shrink-0 transition-all duration-300
                    ${estado === 'concluido'
                      ? 'bg-blue-500 shadow-sm shadow-blue-200'
                      : estado === 'ativo'
                        ? 'border-2 border-blue-400 bg-blue-50'
                        : 'border-2 border-slate-200 bg-white'
                    }
                  `}
                >
                  {estado === 'concluido' && (
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                      <path d="M2 5l2.5 2.5L8 3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                  {estado === 'ativo' && (
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                  )}
                </div>

                {/* Linha vertical */}
                {!isLast && (
                  <div
                    className={`
                      w-px flex-1 mt-0.5 mb-0.5 min-h-[1.25rem] transition-all duration-500
                      ${estado === 'concluido' ? 'bg-blue-200' : 'bg-slate-100'}
                    `}
                  />
                )}
              </div>

              {/* Label */}
              <div className={`py-1 pb-${isLast ? '0' : '3'}`}>
                <span
                  className={`
                    text-[11px] font-bold leading-none transition-colors duration-300
                    ${estado === 'concluido'
                      ? 'text-blue-500'
                      : estado === 'ativo'
                        ? 'text-slate-700'
                        : 'text-slate-300'
                    }
                  `}
                >
                  {etapa.label}
                </span>
              </div>
            </div>
          )
        })}
      </div>

      {/* Status badge */}
      <div className="mt-3 pt-3 border-t border-slate-50">
        <span
          className={`
            inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest
            ${isProjetoConcluido
              ? 'bg-green-50 text-green-500'
              : projetoStatus === 'em_execucao'
                ? 'bg-blue-50 text-blue-500'
                : projetoStatus === 'pendente'
                  ? 'bg-amber-50 text-amber-500'
                  : 'bg-slate-50 text-slate-400'
            }
          `}
        >
          <span
            className={`
              w-1.5 h-1.5 rounded-full
              ${isProjetoConcluido
                ? 'bg-green-400'
                : projetoStatus === 'em_execucao'
                  ? 'bg-blue-400 animate-pulse'
                  : projetoStatus === 'pendente'
                    ? 'bg-amber-400'
                    : 'bg-slate-300'
              }
            `}
          />
          {isProjetoConcluido
            ? 'Concluído'
            : projetoStatus === 'em_execucao'
              ? 'Em execução'
              : projetoStatus === 'pendente'
                ? 'Aguardando'
                : 'Em registro'
          }
        </span>
      </div>
    </div>
  )
}