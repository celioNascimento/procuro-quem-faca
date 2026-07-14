//components/profile/PerfilSobre.tsx

import type { PrestadorPerfil } from '@/types/perfil'

interface Props {
  prestador: PrestadorPerfil
}

export default function PerfilSobre({ prestador }: Props) {
  return (
    <div className="space-y-4">
      <section className="bg-white rounded-[2rem] p-6 border border-slate-100 shadow-sm">
        <h2 className="text-[10px] font-black uppercase tracking-widest text-blue-600 mb-3">
          Sobre o Profissional
        </h2>
        <p className="text-slate-600 text-[14px] leading-relaxed">
          {prestador.bio || 'Informações coletadas via curadoria pública. Este profissional ainda não personalizou sua biografia.'}
        </p>
      </section>

      {(prestador.habilidades?.length ?? 0) > 0 && (
        <section className="bg-white rounded-[2rem] p-6 border border-slate-100 shadow-sm">
          <h2 className="text-[10px] font-black uppercase tracking-widest text-blue-600 mb-3">
            Especialidades
          </h2>
          <div className="flex flex-wrap gap-2">
            {prestador.habilidades.map(hab => (
              <span
                key={hab}
                className="px-3 py-1.5 bg-slate-50 border border-slate-100 text-slate-600 rounded-full text-[10px] font-bold uppercase tracking-wide shadow-sm"
              >
                {hab}
              </span>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}