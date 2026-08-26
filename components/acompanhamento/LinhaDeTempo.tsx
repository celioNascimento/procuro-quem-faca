// components/acompanhamento/LinhaDeTempo.tsx

import { Camera, MessageSquare } from 'lucide-react'
import type { FotoOrdenada, Comentario } from '@/types/avaliacao'
import { TimelineVertical, TimelineEstado, TimelineNo } from '@/components/shared/TimelineVertical'

const ETAPAS = [
  { ordem: 1, label: 'Antes',   sublabel: 'Estado inicial'  },
  { ordem: 2, label: 'Durante', sublabel: 'Em andamento'    },
  { ordem: 3, label: 'Depois',  sublabel: 'Resultado final' },
]

type Props = {
  fotosOrdenadas: FotoOrdenada[]
  comentarios: Comentario[]
  labelEtapaAtual: string
  status?: string
  onFotoClick: (foto: FotoOrdenada) => void
  temGarantiaAtiva?: boolean
}

export function LinhaDeTempo({
  fotosOrdenadas,
  comentarios,
  labelEtapaAtual,
  status,
  onFotoClick,
  temGarantiaAtiva = false,
}: Props) {
  const instrucao =
    fotosOrdenadas.length === 0
      ? 'Aguardando o prestador iniciar os registros.'
      : fotosOrdenadas.length === 3
      ? temGarantiaAtiva
        ? 'Serviço concluído. Acompanhe o caso de garantia abaixo.'
        : 'Todos os registros enviados. Avalie abaixo para concluir.'
      : `${3 - fotosOrdenadas.length} registro${3 - fotosOrdenadas.length > 1 ? 's' : ''} pendente${3 - fotosOrdenadas.length > 1 ? 's' : ''} — toque nas fotos para discutir.`

  // Em garantia, o badge principal vira neutro/cinza — o serviço está
  // concluído e o que está ativo agora é o fluxo de garantia (seção abaixo).
  const badgeClass = temGarantiaAtiva
    ? 'bg-slate-50 text-slate-400 border-slate-100'
    : status === 'finalizado'
    ? 'bg-green-50 text-green-600 border-green-100'
    : status === 'em_execucao'
    ? 'bg-blue-50 text-blue-600 border-blue-100 animate-pulse'
    : 'bg-yellow-50 text-yellow-600 border-yellow-100'

  // Label do badge também muda em garantia — "Serviço concluído" fica
  // confuso quando há um caso de garantia ativo logo abaixo.
  const badgeLabel = temGarantiaAtiva ? 'Registros concluídos' : labelEtapaAtual

  const nos: TimelineNo[] = ETAPAS.map((etapa) => {
    const foto = fotosOrdenadas.find((f) => f.ordem === etapa.ordem)
    const concluida = !!foto
    const atual = fotosOrdenadas.length === etapa.ordem
    const countComentarios = comentarios.filter((c) => c.foto_id === foto?.id).length

    const estado: TimelineEstado = concluida
      ? atual ? 'ativo' : 'concluido'
      : 'pendente'

    return {
      key: etapa.ordem,
      estado,
      conteudo: (
        <>
          <div className="flex items-start justify-between gap-3 mb-3">
            <div>
              <p className={`text-[11px] font-black uppercase tracking-wide leading-none ${
                concluida ? (atual ? 'text-blue-600' : 'text-green-600') : 'text-slate-300'
              }`}>
                {etapa.label}
              </p>
              <p className="text-[10px] text-slate-400 font-medium mt-0.5">
                {etapa.sublabel}
              </p>
            </div>
            {foto && countComentarios > 0 && (
              <div className="flex items-center gap-1 bg-blue-50 text-blue-600 px-2 py-1 rounded-full">
                <MessageSquare size={9} />
                <span className="text-[8px] font-black">{countComentarios}</span>
              </div>
            )}
          </div>

          <button
            onClick={() => foto && onFotoClick(foto)}
            disabled={!foto}
            className={`w-full rounded-2xl overflow-hidden border-2 transition-all active:scale-[0.98] group ${
              foto
                ? atual
                  ? 'border-blue-300 shadow-lg shadow-blue-100 ring-2 ring-blue-100 ring-offset-1'
                  : 'border-green-100 shadow-sm hover:shadow-md'
                : 'border-dashed border-slate-200 bg-slate-50'
            }`}
          >
            {foto ? (
              <div className="relative aspect-video">
                <img
                  src={foto.url_foto}
                  className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
                  alt={etapa.label}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-3">
                  <span className="text-white text-[10px] font-black uppercase tracking-widest">
                    Toque para discutir
                  </span>
                </div>
              </div>
            ) : (
              <div className="aspect-video flex flex-col items-center justify-center gap-2">
                <Camera size={24} className="text-slate-200" />
                <span className="text-[9px] font-medium text-slate-300 uppercase tracking-wider">
                  Aguardando registro
                </span>
              </div>
            )}
          </button>
        </>
      ),
    }
  })

  return (
    <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-6 space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
          {temGarantiaAtiva ? 'Registros do Serviço' : 'Progresso da Obra'}
        </h3>
        <span className={`text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full border ${badgeClass}`}>
          {badgeLabel}
        </span>
      </div>

      <TimelineVertical nos={nos} />

      <p className="text-center text-[10px] font-medium text-slate-400 pt-1 border-t border-slate-50">
        {instrucao}
      </p>
    </div>
  )
}
