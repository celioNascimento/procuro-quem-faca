//components/acompanhamento/BlocoAvaliacao.tsx

import { CheckCircle2, Loader2, Star } from 'lucide-react'

type Props = {
  nota: number
  setNota: (n: number) => void
  hoverNota: number
  setHoverNota: (n: number) => void
  comentarioGeral: string
  setComentarioGeral: (v: string) => void
  indica: boolean | null
  setIndica: (v: boolean) => void
  submitting: boolean
  onSubmit: () => void
}

export function BlocoAvaliacao({
  nota,
  setNota,
  hoverNota,
  setHoverNota,
  comentarioGeral,
  setComentarioGeral,
  indica,
  setIndica,
  submitting,
  onSubmit,
}: Props) {
  return (
    <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-8 animate-in slide-in-from-bottom-10 duration-700">
      {/* Título */}
      <div className="text-center">
        <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 size={28} className="text-blue-600" />
        </div>
        <h3 className="text-2xl font-black text-slate-800 tracking-tighter uppercase italic">
          Assinar Entrega
        </h3>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-2">
          Sua nota oficializa a conclusão do serviço
        </p>
      </div>

      {/* Estrelas */}
      <div className="flex justify-center gap-2">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            onClick={() => setNota(star)}
            onMouseEnter={() => setHoverNota(star)}
            onMouseLeave={() => setHoverNota(0)}
            className="transition-transform active:scale-90"
          >
            <Star
              size={38}
              fill={(hoverNota || nota) >= star ? '#2563eb' : 'transparent'}
              color={(hoverNota || nota) >= star ? '#2563eb' : '#E2E8F0'}
              strokeWidth={2}
            />
          </button>
        ))}
      </div>

      {/* Textarea */}
      <textarea
        className="w-full p-6 bg-slate-50 rounded-[2rem] border border-slate-100 outline-none text-sm font-medium text-slate-700 min-h-[120px] resize-none focus:border-blue-200 focus:bg-white transition-all placeholder:text-slate-300 shadow-inner"
        placeholder="Escreva um breve depoimento..."
        value={comentarioGeral}
        onChange={(e) => setComentarioGeral(e.target.value)}
      />

      {/* Indicação — aparece somente após selecionar nota */}
      {nota > 0 && (
        <div className="space-y-3">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">
            Você indicaria este profissional?
          </p>
          <div className="flex gap-3">
            {/* Botão Indico */}
            <button
              type="button"
              onClick={() => setIndica(true)}
              className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-[2rem] border-2 font-black uppercase text-[10px] tracking-widest transition-all duration-300 ${
                indica === true
                  ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-100'
                  : 'bg-white border-slate-200 text-slate-400 hover:border-blue-200'
              }`}
            >
              👍 Indico
            </button>

            {/* Botão Não indico */}
            <button
              type="button"
              onClick={() => setIndica(false)}
              className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-[2rem] border-2 font-black uppercase text-[10px] tracking-widest transition-all duration-300 ${
                indica === false
                  ? 'bg-slate-700 border-slate-700 text-white shadow-lg shadow-slate-100'
                  : 'bg-white border-slate-200 text-slate-400 hover:border-slate-300'
              }`}
            >
              👎 Não indico
            </button>
          </div>
        </div>
      )}

      {/* Botão submit */}
      <button
        disabled={nota === 0 || submitting}
        onClick={onSubmit}
        className="w-full py-5 bg-blue-600 text-white rounded-[2rem] font-black uppercase text-[11px] tracking-[0.2em] italic flex items-center justify-center gap-3 disabled:opacity-40 shadow-xl shadow-blue-200 active:scale-[0.98] transition-all"
      >
        {submitting ? (
          <Loader2 className="animate-spin" size={20} />
        ) : (
          <>
            <CheckCircle2 size={18} strokeWidth={2.5} /> Validar e Concluir
          </>
        )}
      </button>
    </div>
  )
}
