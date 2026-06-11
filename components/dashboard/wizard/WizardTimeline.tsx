'use client'

import { useUploadWizard } from '@/hooks/useUploadWizard'
import { TimelineVertical, TimelineEstado, TimelineNo } from '@/components/shared/TimelineVertical'

type HookData = ReturnType<typeof useUploadWizard>

interface WizardTimelineProps {
  hookData: HookData
}

const ETAPAS = [
  { ordem: 1, label: 'Início'    },
  { ordem: 2, label: 'Execução'  },
  { ordem: 3, label: 'Conclusão' },
]

export function WizardTimeline({ hookData }: WizardTimelineProps) {
  const { fotosUrls, projetoStatus } = hookData.state
  const { isProjetoConcluido } = hookData.derived

  const nos: TimelineNo[] = ETAPAS.map((etapa) => {
    const temFoto = !!fotosUrls[etapa.ordem]
    const temAnterior = etapa.ordem > 1 ? !!fotosUrls[etapa.ordem - 1] : true

    const estado: TimelineEstado = temFoto
      ? 'concluido'
      : temAnterior ? 'ativo' : 'pendente'

    return {
      key: etapa.ordem,
      estado,
      conteudo: (
        <span className={`text-[11px] font-bold leading-none transition-colors duration-300 ${
          estado === 'concluido'
            ? 'text-blue-500'
            : estado === 'ativo'
            ? 'text-slate-700'
            : 'text-slate-300'
        }`}>
          {etapa.label}
        </span>
      ),
    }
  })

  return (
    <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-4 flex flex-col gap-1">
      <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2 px-1">
        Etapas
      </p>

      <TimelineVertical nos={nos} />

      <div className="mt-3 pt-3 border-t border-slate-50">
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
          isProjetoConcluido
            ? 'bg-green-50 text-green-500'
            : projetoStatus === 'em_execucao'
            ? 'bg-blue-50 text-blue-500'
            : projetoStatus === 'pendente'
            ? 'bg-amber-50 text-amber-500'
            : 'bg-slate-50 text-slate-400'
        }`}>
          <span className={`w-1.5 h-1.5 rounded-full ${
            isProjetoConcluido
              ? 'bg-green-400'
              : projetoStatus === 'em_execucao'
              ? 'bg-blue-400 animate-pulse'
              : projetoStatus === 'pendente'
              ? 'bg-amber-400'
              : 'bg-slate-300'
          }`} />
          {isProjetoConcluido
            ? 'Concluído'
            : projetoStatus === 'em_execucao'
            ? 'Em execução'
            : projetoStatus === 'pendente'
            ? 'Aguardando'
            : 'Em registro'}
        </span>
      </div>
    </div>
  )
}