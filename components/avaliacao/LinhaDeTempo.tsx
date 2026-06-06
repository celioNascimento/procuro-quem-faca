import { Camera, MessageSquare, CheckCircle2 } from 'lucide-react'
import type { FotoOrdenada, Comentario } from '@/hooks/useAvaliacao'

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
}

export function LinhaDeTempo({
  fotosOrdenadas,
  comentarios,
  labelEtapaAtual,
  status,
  onFotoClick,
}: Props) {
  const instrucao =
    fotosOrdenadas.length === 0
      ? 'Aguardando o prestador iniciar os registros.'
      : fotosOrdenadas.length === 3
      ? 'Todos os registros enviados. Avalie abaixo para concluir.'
      : `${3 - fotosOrdenadas.length} registro${3 - fotosOrdenadas.length > 1 ? 's' : ''} pendente${3 - fotosOrdenadas.length > 1 ? 's' : ''} — toque nas fotos para discutir.`

  return (
    <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-6 space-y-5">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
          Progresso da Obra
        </h3>
        <span
          className={`text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full border ${
            status === 'em_execucao'
              ? 'bg-blue-50 text-blue-600 border-blue-100 animate-pulse'
              : 'bg-yellow-50 text-yellow-600 border-yellow-100'
          }`}
        >
          {labelEtapaAtual}
        </span>
      </div>

      {/* Trilho vertical */}
      <div className="relative space-y-0">
        {ETAPAS.map((etapa, idx) => {
          const foto = fotosOrdenadas.find((f) => f.ordem === etapa.ordem)
          const concluida = !!foto
          const atual = fotosOrdenadas.length === etapa.ordem
          const isLast = idx === ETAPAS.length - 1
          const countComentarios = comentarios.filter((c) => c.foto_id === foto?.id).length

          return (
            <div key={etapa.ordem} className="flex gap-4">

              {/* Coluna da linha + bolinha */}
              <div className="flex flex-col items-center shrink-0 w-10">
                {/* Bolinha de status */}
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 border-2 transition-all ${
                  concluida
                    ? atual
                      ? 'bg-blue-600 border-blue-600 shadow-lg shadow-blue-200'
                      : 'bg-green-50 border-green-200'
                    : 'bg-slate-50 border-dashed border-slate-200'
                }`}>
                  {concluida ? (
                    atual
                      ? <div className="w-2.5 h-2.5 bg-white rounded-full animate-pulse" />
                      : <CheckCircle2 size={16} className="text-green-500" strokeWidth={2.5} />
                  ) : (
                    <span className="text-[9px] font-black text-slate-300">{etapa.ordem}</span>
                  )}
                </div>

                {/* Linha conectora */}
                {!isLast && (
                  <div className={`w-0.5 flex-1 min-h-[2rem] rounded-full my-1 transition-all duration-700 ${
                    concluida ? 'bg-blue-200' : 'bg-slate-100'
                  }`} />
                )}
              </div>

              {/* Conteúdo da etapa */}
              <div className={`flex-1 pb-6 ${isLast ? 'pb-0' : ''}`}>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <p className={`text-[11px] font-black uppercase tracking-wide leading-none ${
                      concluida
                        ? atual ? 'text-blue-600' : 'text-green-600'
                        : 'text-slate-300'
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

                {/* Foto em destaque (grande) ou placeholder */}
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
                      {/* Overlay de "toque para discutir" */}
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
              </div>
            </div>
          )
        })}
      </div>

      {/* Instrução contextual */}
      <p className="text-center text-[10px] font-medium text-slate-400 pt-1 border-t border-slate-50">
        {instrucao}
      </p>
    </div>
  )
}