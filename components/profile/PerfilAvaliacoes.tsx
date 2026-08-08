//components/profile/PerfilAvaliacoes.tsx

import type { AvaliacaoPerfil } from '@/types/perfil'

interface Props {
  avaliacoes: AvaliacaoPerfil[]
}

export default function PerfilAvaliacoes({ avaliacoes }: Props) {
  if (avaliacoes.length === 0) return null

  const totalIndica = avaliacoes.filter(a => a.indica).length
  
  // A variável mediaNotas foi mantida na lógica para preservação estrutural, 
  // mas foi removida da renderização visual conforme solicitado.
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
        </div>
      </div>

      <div className="space-y-3">
        {avaliacoes.map(av => (
          <div key={av.id} className="bg-white rounded-[2rem] p-5 border border-slate-100 shadow-sm space-y-3">
            {av.indica && (
              <div className="flex items-start justify-end">
                <span className="flex items-center gap-1 bg-blue-600 text-white text-[8px] font-black tracking-wide px-2.5 py-1 rounded-full shrink-0">
                  ✦ Indico
                </span>
              </div>
            )}
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
