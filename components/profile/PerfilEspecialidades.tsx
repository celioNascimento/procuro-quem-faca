import type { PrestadorPerfil } from '@/types/perfil'

interface Props {
  prestador: PrestadorPerfil
}

export default function PerfilEspecialidades({ prestador }: Props) {
  const habilidades = prestador.habilidades?.filter(Boolean) ?? []

  if (habilidades.length === 0) return null

  return (
    <section className="rounded-[2rem] border border-slate-100 bg-white px-5 py-4 shadow-sm sm:px-6" aria-labelledby="especialidades-titulo">
      <div className="flex flex-col items-start gap-x-5 gap-y-3 sm:flex-row sm:flex-wrap sm:items-center">
        <h2 id="especialidades-titulo" className="text-base font-bold text-slate-900">
          Especialidades
        </h2>
        <div className="flex min-w-0 flex-1 flex-wrap gap-2">
          {habilidades.map((habilidade) => (
            <span
              key={habilidade}
              className="rounded-full border border-slate-100 bg-slate-50/50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-600 shadow-sm transition-colors hover:border-blue-100 hover:bg-blue-50/40 hover:text-blue-600"
            >
              {habilidade}
            </span>
          ))}
        </div>
      </div>
    </section>
  )
}
