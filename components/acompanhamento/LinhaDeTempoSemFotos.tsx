// components/acompanhamento/LinhaDeTempoSemFotos.tsx
//
// Equivalente à LinhaDeTempo, mas para projetos no fluxo sem_fotos: sem
// blocos de foto, só os 3 marcos textuais (aceito → em execução →
// concluído/aguardando avaliação), cada um com data quando disponível.

import { TimelineVertical, TimelineEstado, TimelineNo } from '@/components/shared/TimelineVertical'

type Props = {
  status?: string
  aceitoEm?: string | null
  marcadoConcluidoEm?: string | null
}

function formatarData(iso?: string | null): string | null {
  if (!iso) return null
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
}

export function LinhaDeTempoSemFotos({ status, aceitoEm, marcadoConcluidoEm }: Props) {
  const dataAceite = formatarData(aceitoEm)
  const dataConcluido = formatarData(marcadoConcluidoEm)

  const aceito = status === 'em_execucao' || status === 'finalizado'
  const concluido = !!marcadoConcluidoEm || status === 'finalizado'
  const avaliado = status === 'finalizado'

  const instrucao = !aceito
    ? 'Aguardando você aceitar o início do serviço.'
    : !concluido
    ? 'Serviço em andamento.'
    : !avaliado
    ? 'Serviço concluído. Avalie abaixo para finalizar.'
    : 'Serviço concluído e avaliado.'

  const marcos = [
    {
      key: 'aceite',
      label: 'Aceite do serviço',
      data: dataAceite,
      estado: (aceito ? 'concluido' : 'ativo') as TimelineEstado,
    },
    {
      key: 'execucao',
      label: 'Execução do serviço',
      data: null,
      estado: (!aceito ? 'pendente' : concluido ? 'concluido' : 'ativo') as TimelineEstado,
    },
    {
      key: 'conclusao',
      label: avaliado ? 'Avaliado' : 'Aguardando sua avaliação',
      data: dataConcluido,
      estado: (!concluido ? 'pendente' : avaliado ? 'concluido' : 'ativo') as TimelineEstado,
    },
  ]

  const nos: TimelineNo[] = marcos.map((marco) => ({
    key: marco.key,
    estado: marco.estado,
    conteudo: (
      <div className="flex items-center justify-between gap-3 py-1.5">
        <p className={`text-[11px] font-black uppercase tracking-wide leading-none ${
          marco.estado === 'pendente' ? 'text-slate-300' : marco.estado === 'ativo' ? 'text-blue-600' : 'text-green-600'
        }`}>
          {marco.label}
        </p>
        {marco.data && (
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">{marco.data}</span>
        )}
      </div>
    ),
  }))

  return (
    <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-6 space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
          Status do Serviço
        </h3>
      </div>

      <TimelineVertical nos={nos} />

      <p className="text-center text-[10px] font-medium text-slate-400 pt-1 border-t border-slate-50">
        {instrucao}
      </p>
    </div>
  )
}
