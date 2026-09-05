//components/acompanhamento/BlocoAvaliacao.tsx

import { CheckCircle2, Loader2, Star, ThumbsDown, ThumbsUp } from 'lucide-react'

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
    <div className="overflow-hidden rounded-[2.5rem] border border-blue-100 bg-gradient-to-br from-white via-white to-blue-50/70 shadow-[0_20px_60px_-28px_rgba(37,99,235,0.35)] animate-in slide-in-from-bottom-10 duration-700">
      <div className="border-b border-blue-100/80 bg-blue-50/60 px-6 py-6 sm:px-8">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-200">
            <CheckCircle2 size={24} strokeWidth={2.5} />
          </div>
          <div>
            <p className="mb-1 text-[10px] font-black uppercase tracking-[0.24em] text-blue-600">
              Etapa final
            </p>
            <h3 className="text-2xl font-black uppercase italic tracking-tight text-slate-800">
              Assinar entrega
            </h3>
            <p className="mt-1 text-sm leading-6 text-slate-500">
              Sua avaliação oficializa a conclusão do serviço.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-7 p-6 sm:p-8">
        <div className="rounded-3xl border border-blue-100 bg-white/80 px-4 py-5 text-center shadow-sm">
          <p className="mb-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
            Como você avalia esta experiência?
          </p>
          <div className="flex justify-center gap-1.5 sm:gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                aria-label={`Dar ${star} ${star === 1 ? 'estrela' : 'estrelas'}`}
                onClick={() => setNota(star)}
                onMouseEnter={() => setHoverNota(star)}
                onMouseLeave={() => setHoverNota(0)}
                className="rounded-full p-1 transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 active:scale-90"
              >
                <Star
                  size={34}
                  fill={(hoverNota || nota) >= star ? '#2563eb' : 'transparent'}
                  color={(hoverNota || nota) >= star ? '#2563eb' : '#CBD5E1'}
                  strokeWidth={2}
                />
              </button>
            ))}
          </div>
        </div>

        <div>
          <label htmlFor="comentario-avaliacao" className="mb-2 block text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
            Seu depoimento
          </label>
          <textarea
            id="comentario-avaliacao"
            className="min-h-[120px] w-full resize-none rounded-3xl border border-slate-200 bg-white p-5 text-sm font-medium leading-6 text-slate-700 outline-none transition-all placeholder:text-slate-300 focus:border-blue-300 focus:ring-4 focus:ring-blue-100"
            placeholder="Conte brevemente como foi sua experiência..."
            value={comentarioGeral}
            onChange={(e) => setComentarioGeral(e.target.value)}
          />
        </div>

        {nota > 0 && (
          <div className="space-y-3">
            <p className="text-center text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
              Você indicaria este profissional?
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setIndica(true)}
                className={`flex flex-1 items-center justify-center gap-2 rounded-2xl border py-4 text-[10px] font-black uppercase tracking-widest transition-all ${
                  indica === true
                    ? 'border-blue-600 bg-blue-600 text-white shadow-lg shadow-blue-100'
                    : 'border-slate-200 bg-white text-slate-400 hover:border-blue-300 hover:text-blue-600'
                }`}
              >
                <ThumbsUp size={16} /> Indico
              </button>
              <button
                type="button"
                onClick={() => setIndica(false)}
                className={`flex flex-1 items-center justify-center gap-2 rounded-2xl border py-4 text-[10px] font-black uppercase tracking-widest transition-all ${
                  indica === false
                    ? 'border-slate-700 bg-slate-700 text-white shadow-lg shadow-slate-100'
                    : 'border-slate-200 bg-white text-slate-400 hover:border-slate-400 hover:text-slate-700'
                }`}
              >
                <ThumbsDown size={16} /> Não indico
              </button>
            </div>
          </div>
        )}

        <button
          disabled={nota === 0 || submitting}
          onClick={onSubmit}
          className="flex w-full items-center justify-center gap-3 rounded-2xl bg-blue-600 py-4 text-[11px] font-black uppercase italic tracking-[0.2em] text-white shadow-xl shadow-blue-200 transition-all hover:bg-blue-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
        >
          {submitting ? <Loader2 className="animate-spin" size={20} /> : <><CheckCircle2 size={18} strokeWidth={2.5} /> Validar e concluir</>}
        </button>
      </div>
    </div>
  )
}
