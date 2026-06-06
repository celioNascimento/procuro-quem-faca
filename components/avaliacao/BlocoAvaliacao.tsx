import { CheckCircle2, Loader2, Star } from 'lucide-react'

type Props = {
  nota: number
  setNota: (n: number) => void
  hoverNota: number
  setHoverNota: (n: number) => void
  comentarioGeral: string
  setComentarioGeral: (v: string) => void
  indica: boolean
  setIndica: (fn: (v: boolean) => boolean) => void
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

      {/* Toggle indicação */}
      <button
        type="button"
        onClick={() => setIndica((v) => !v)}
        className={`w-full flex items-center justify-between px-6 py-4 rounded-[2rem] border-2 transition-all duration-300 ${
          indica
            ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-100'
            : 'bg-white border-slate-200 text-slate-500 hover:border-blue-200'
        }`}
      >
        <div className="flex items-center gap-3">
          <span
            className={`text-lg leading-none transition-transform duration-300 ${
              indica ? 'scale-125' : 'scale-100'
            }`}
          >
            ✦
          </span>
          <div className="text-left">
            <p
              className={`text-[11px] font-black uppercase tracking-widest leading-none ${
                indica ? 'text-white' : 'text-slate-700'
              }`}
            >
              {indica ? 'Eu indico este profissional' : 'Indicar este profissional?'}
            </p>
            <p
              className={`text-[9px] font-medium mt-1 leading-none ${
                indica ? 'text-blue-100' : 'text-slate-400'
              }`}
            >
              {indica
                ? 'Sua indicação ficará visível no perfil'
                : 'Ajuda outras pessoas a encontrá-lo'}
            </p>
          </div>
        </div>

        <div
          className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
            indica ? 'bg-white border-white' : 'border-slate-300'
          }`}
        >
          {indica && <span className="text-blue-600 font-black text-[10px]">✓</span>}
        </div>
      </button>

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