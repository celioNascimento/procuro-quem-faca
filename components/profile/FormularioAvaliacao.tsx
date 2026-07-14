//components/profile/FormularioAvaliacao.tsx

'use client'
import { useState } from 'react'
import { useSubmitAvaliacao } from '@/hooks/useSubmitAvaliacao'
import FotosEvidenciaPicker from './FotosEvidenciaPicker'

interface FormularioAvaliacaoProps {
  projetoId: string
  prestadorId: number
  clienteId: string
  onComplete: () => void
}

const STATUS_LABEL: Record<string, string> = {
  uploading: 'ENVIANDO FOTOS...',
  saving: 'SALVANDO...',
  idle: '',
  done: '',
  error: '',
}

export default function FormularioAvaliacao({
  projetoId,
  prestadorId,
  clienteId,
  onComplete,
}: FormularioAvaliacaoProps) {
  const [nota, setNota] = useState(5)
  const [comentario, setComentario] = useState('')
  const [isContestacao, setIsContestacao] = useState(false)
  const [fotosEvidencia, setFotosEvidencia] = useState<File[]>([])

  const { status, erro, submit } = useSubmitAvaliacao(onComplete)

  const loading = status === 'uploading' || status === 'saving'
  const labelBtn = STATUS_LABEL[status] ||
    (isContestacao ? 'ABRIR CHAMADO DE ASSISTÊNCIA' : 'PUBLICAR AVALIAÇÃO')

  function handleSubmit() {
    submit({ projetoId, prestadorId, clienteId, nota, comentario, isContestacao, fotosEvidencia })
  }

  return (
    <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-xl space-y-6">
      <div className="text-center">
        <h3 className="text-xl font-black uppercase italic text-slate-800">
          Sua opinião é fundamental
        </h3>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
          {isContestacao ? 'Relate o problema para suporte' : 'Como foi sua experiência?'}
        </p>
      </div>

      {/* Seletor de nota — oculto em contestação */}
      {!isContestacao && (
        <div className="flex justify-center gap-2">
          {[1, 2, 3, 4, 5].map((num) => (
            <button
              key={num}
              type="button"
              onClick={() => setNota(num)}
              className="text-2xl transition-transform active:scale-90"
            >
              {num <= nota ? '⭐' : '☆'}
            </button>
          ))}
        </div>
      )}

      <textarea
        className="w-full bg-slate-50 rounded-3xl p-6 text-sm text-slate-600 outline-none focus:ring-2 focus:ring-blue-100 min-h-[120px] resize-none"
        placeholder={
          isContestacao
            ? 'Descreva o que aconteceu (ex: vazamento, rachadura)...'
            : 'Escreva seu depoimento aqui...'
        }
        value={comentario}
        onChange={(e) => setComentario(e.target.value)}
      />

      {/* Upload de fotos — só em contestação */}
      {isContestacao && (
        <FotosEvidenciaPicker fotos={fotosEvidencia} onChange={setFotosEvidencia} />
      )}

      {/* Erro de upload parcial */}
      {erro && (
        <p className="text-[10px] font-bold text-red-400 uppercase tracking-wide">{erro}</p>
      )}

      <div className="flex flex-col gap-4">
        <label className="flex items-center gap-3 cursor-pointer group">
          <input
            type="checkbox"
            checked={isContestacao}
            onChange={(e) => {
              setIsContestacao(e.target.checked)
              // Limpa fotos ao desmarcar
              if (!e.target.checked) setFotosEvidencia([])
            }}
            className="w-5 h-5 rounded-lg border-slate-200 text-red-500 focus:ring-red-100"
          />
          <span className="text-[10px] font-black uppercase text-slate-400 group-hover:text-red-500 transition-colors">
            Reportar problema / Solicitar Garantia
          </span>
        </label>

        <button
          type="button"
          onClick={handleSubmit}
          disabled={loading || !comentario.trim()}
          className={`w-full py-5 rounded-[2rem] font-black uppercase tracking-widest text-[10px] transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed ${
            isContestacao
              ? 'bg-red-500 text-white shadow-red-100 hover:bg-red-600'
              : 'bg-blue-600 text-white shadow-blue-100 hover:bg-blue-700'
          }`}
        >
          {loading ? labelBtn : (isContestacao ? 'ABRIR CHAMADO DE ASSISTÊNCIA' : 'PUBLICAR AVALIAÇÃO')}
        </button>
      </div>
    </div>
  )
}