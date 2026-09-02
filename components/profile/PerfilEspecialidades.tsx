import type { PrestadorPerfil } from '@/types/perfil'

interface Props {
  prestador: PrestadorPerfil
}

export default function PerfilEspecialidades({ prestador }: Props) {
  const habilidades = prestador.habilidades?.filter(Boolean) ?? []

  if (habilidades.length === 0) return null

  return (
    <section className="rounded-[2rem] border border-slate-100 bg-white p-6 shadow-sm sm:p-7" aria-labelledby="especialidades-titulo">
      <h2 id="especialidades-titulo" className="mb-5 text-[10px] font-black uppercase tracking-[0.2em] text-blue-600">
        Especialidades
      </h2>
      <div className="flex flex-wrap gap-3">
        {habilidades.map((habilidade) => (
          <span
            key={habilidade}
            className="rounded-full border border-blue-100 bg-blue-50 px-4 py-2 text-xs font-bold uppercase tracking-wide text-slate-700"
          >
            {habilidade}
          </span>
        ))}
      </div>
    </section>
  )
}
