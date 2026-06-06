import { Camera, MessageSquare } from 'lucide-react'
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
  const progresso = Math.max(0, (fotosOrdenadas.length - 1) / 2) * 100

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

      {/* Trilho */}
      <div className="relative">
        <div className="absolute top-6 left-6 right-6 h-0.5 bg-slate-100 z-0" />
        <div
          className="absolute top-6 left-6 h-0.5 bg-blue-500 z-0 transition-all duration-700"
          style={{ width: `${progresso}%` }}
        />

        <div className="relative z-10 flex justify-between">
          {ETAPAS.map((etapa) => {
            const foto = fotosOrdenadas.find((f) => f.ordem === etapa.ordem)
            const concluida = !!foto
            const atual = fotosOrdenadas.length === etapa.ordem
            const countComentarios = comentarios.filter((c) => c.foto_id === foto?.id).length

            return (
              <div key={etapa.ordem} className="flex flex-col items-center gap-2 w-1/3">
                <button
                  onClick={() => foto && onFotoClick(foto)}
                  disabled={!foto}
                  className={`w-12 h-12 rounded-2xl overflow-hidden border-2 transition-all active:scale-90 ${
                    concluida
                      ? atual
                        ? 'border-blue-500 shadow-lg shadow-blue-100 ring-2 ring-blue-200 ring-offset-2'
                        : 'border-green-200 shadow-sm'
                      : 'border-dashed border-slate-200 bg-slate-50'
                  }`}
                >
                  {foto ? (
                    <img
                      src={foto.url_foto}
                      className="w-full h-full object-cover"
                      alt={etapa.label}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Camera size={18} className="text-slate-300" />
                    </div>
                  )}
                </button>

                <div className="text-center">
                  <p
                    className={`text-[10px] font-black uppercase tracking-wide leading-none ${
                      concluida
                        ? atual
                          ? 'text-blue-600'
                          : 'text-green-600'
                        : 'text-slate-300'
                    }`}
                  >
                    {etapa.label}
                  </p>
                  <p className="text-[9px] text-slate-400 font-medium mt-0.5 leading-none">
                    {etapa.sublabel}
                  </p>
                </div>

                {foto && countComentarios > 0 && (
                  <div className="flex items-center gap-1 bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">
                    <MessageSquare size={8} />
                    <span className="text-[8px] font-black">{countComentarios}</span>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      <p className="text-center text-[10px] font-medium text-slate-400 pt-1">
        {instrucao}
      </p>
    </div>
  )
}