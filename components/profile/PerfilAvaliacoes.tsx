import type { AvaliacaoPerfil } from '@/types/perfil'

interface Props {
  avaliacoes: AvaliacaoPerfil[]
}

export default function PerfilAvaliacoes({ avaliacoes }: Props) {
  if (avaliacoes.length === 0) return null

  const totalIndica = avaliacoes.filter(a => a.indica).length
  const mediaNotas  = (avaliacoes.reduce((s, a) => s + a.nota, 0) / avaliacoes.length).toFixed(1)

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between px-1">
        <h2 className="text-[10px] font-black uppercase tracking-widest text-blue-600">
          Avaliações
        </h2>
        <div className="flex items-center gap-3">
          {totalIndica > 0 && (
            <span className="flex items-center gap-1 bg-blue-50 text-blue-600 text-[9px] font-black tracking-wide px-2.5 py-1 rounded-full border border-blue-100">
              ✦ {totalIndica} {totalIndica === 1 ? 'indicação' : 'indicações'}
            </span>
          )}
          <span className="text-[10px] font-black text-slate-500">
            ★ {mediaNotas} · {avaliacoes.length} {avaliacoes.length === 1 ? 'avaliação' : 'avaliações'}
          </span>
        </div>
      </div>

      <div className="space-y-3">
        {avaliacoes.map(av => (
          <div key={av.id} className="bg-white rounded-[2rem] p-5 border border-slate-100 shadow-sm space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex gap-0.5">
                {[1, 2, 3, 4, 5].map(s => (
                  <span key={s} className={`text-[13px] ${av.nota >= s ? 'text-blue-600' : 'text-slate-200'}`}>
                    ★
                  </span>
                ))}
              </div>
              {av.indica && (
                <span className="flex items-center gap-1 bg-blue-600 text-white text-[8px] font-black tracking-wide px-2.5 py-1 rounded-full shrink-0">
                  ✦ Indico
                </span>
              )}
            </div>
            {av.comentario && (
              <p className="text-[12px] font-medium text-slate-600 leading-relaxed italic">
                "{av.comentario}"
              </p>
            )}
          </div>
        ))}
      </div>
    </section>
  )
}