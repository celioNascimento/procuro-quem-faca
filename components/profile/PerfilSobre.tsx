// components/profile/PerfilSobre.tsx 

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
        <p className="text-slate-600 text-[14px] leading-relaxed whitespace-pre-wrap">
          {prestador.bio || 'Este profissional ainda não escreveu sua apresentação.'}
        </p>
      </section>
    </div>
  )
}
