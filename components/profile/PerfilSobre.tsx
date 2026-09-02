//components/profile/PerfilSobre.tsx 

import { ShieldCheck } from 'lucide-react'
import type { PrestadorPerfil } from '@/types/perfil'

interface Props {
  prestador: PrestadorPerfil
}

export default function PerfilSobre({ prestador }: Props) {
  const garantiaDias = prestador.garantia_dias ?? 0

  return (
    <div className="space-y-4">
      <section className="bg-white rounded-[2rem] p-6 border border-slate-100 shadow-sm">
        <h2 className="text-[10px] font-black uppercase tracking-widest text-blue-600 mb-3">
          Sobre o Profissional
        </h2>
        {(prestador.habilidades?.length ?? 0) > 0 && (
          <div className="mb-5 flex flex-wrap gap-2">
            {prestador.habilidades.map(hab => (
              <span
                key={hab}
                className="rounded-full border border-slate-100 bg-slate-50 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide text-slate-600 shadow-sm"
              >
                {hab}
              </span>
            ))}
          </div>
        )}

        <p className="text-slate-600 text-[14px] leading-relaxed">
          {prestador.bio || 'Informações coletadas via curadoria pública. Este profissional ainda não personalizou sua biografia.'}
        </p>

        {garantiaDias > 0 && (
          <div className="mt-4 pt-4 border-t border-slate-50 flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
              <ShieldCheck size={16} className="text-blue-600" />
            </div>
            <div>
              <p className="text-[12px] font-black text-slate-700 leading-none mb-1">
                {garantiaDias} dias de garantia
              </p>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Este profissional oferece garantia pós-serviço, além dos direitos
                já assegurados pelo Código de Defesa do Consumidor.
              </p>
            </div>
          </div>
        )}
      </section>

    </div>
  )
}
