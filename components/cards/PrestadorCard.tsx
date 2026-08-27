'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { MapPin, ChevronRight, Globe } from 'lucide-react'
import type { Prestador } from '@/types/prestador'
import { getIniciais, getLocalizacao, getPerfilHref } from '@/lib/prestadorUtils'

type Props = {
  prestador: Prestador
  session: unknown
  registrarLog?: (acao: string, detalhes?: Record<string, unknown>) => void
}

export default function PrestadorCard({ prestador, session, registrarLog }: Props) {
  const [imgError, setImgError] = useState(false)
  const router = useRouter()

  if (!prestador) return null

  const isPublico = prestador.origem_tipo === 'curadoria_publica'
  const perfilHref = getPerfilHref(prestador.slug, prestador.id)
  const localizacao = getLocalizacao(prestador.bairro, prestador.cidades?.nome)

  // Show up to 4 skills; remainder shown as +X
  const MAX_HABILIDADES = 4
  const todasHabilidades = prestador.habilidades || []
  const habilidades = todasHabilidades.slice(0, MAX_HABILIDADES)
  const extras = todasHabilidades.length - MAX_HABILIDADES

  return (
    <Link
      href={perfilHref}
      onClick={() => registrarLog?.('CLIQUE_PERFIL', { nome: prestador.nome })}
      className="group relative block bg-white rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden"
    >
      <div className="flex min-h-[190px] flex-col gap-4 px-5 py-5 md:px-6 md:py-6">
        {/* Primeira linha: identidade do prestador */}
        <div className="flex min-w-0 items-center gap-4 md:gap-5">
          <div className="flex size-24 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-slate-100 bg-slate-50 md:size-28">
            {prestador.foto_perfil && !imgError ? (
              <img
                src={prestador.foto_perfil}
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                alt={prestador.nome}
                onError={() => setImgError(true)}
              />
            ) : (
              <h3 className="text-pretty text-base font-bold leading-snug tracking-tight text-slate-900 line-clamp-2 md:text-lg">
                {getIniciais(prestador.nome)}
              </h3>
            )}
          </div>

          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <h3 className="text-pretty text-base font-bold leading-snug tracking-tight text-slate-900 line-clamp-2 md:text-lg">
              {prestador.nome}
            </h3>
            <span className="text-[11px] font-black uppercase leading-none tracking-widest text-blue-600 md:text-xs">
              {prestador.categoria}
            </span>
          </div>
        </div>

        {/* Segunda linha: detalhes e ação */}
        <div className="mt-auto flex flex-col gap-4 border-t border-slate-100 pt-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex min-w-0 flex-1 flex-col gap-2">

            {/*
              Skills row: always rendered to keep consistent card height.
              - min-h-6 reserves space even when empty
              - overflow-hidden + flex-nowrap ensures tags that don't fit are clipped
              - Up to 4 tags shown; remainder as +X counter
            */}
            <div className="flex min-h-6 items-center overflow-hidden flex-nowrap gap-1.5">
              {habilidades.map(hab => (
                <span
                  key={hab}
                  className="shrink-0 rounded-full border border-slate-100 bg-slate-50 px-2 py-1 text-[9px] font-semibold uppercase tracking-wide text-slate-500"
                >
                  {hab}
                </span>
              ))}
              {extras > 0 && (
                <span className="shrink-0 px-1 py-1 text-[9px] font-semibold text-slate-400">
                  +{extras}
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {localizacao && (
                <div className="flex items-center gap-1">
                  <MapPin size={12} className="shrink-0 text-slate-300" />
                  <p className="text-[11px] font-medium tracking-tight text-slate-400">
                    {localizacao}
                  </p>
                </div>
              )}
              {isPublico && (
                <span className="flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[9px] font-semibold text-slate-400">
                  <Globe size={9} /> Perfil público
                </span>
              )}
            </div>
          </div>

          <div className="flex shrink-0 flex-col items-center gap-2 sm:items-end">
            <span className="flex min-h-10 w-full items-center justify-center gap-1 rounded-xl bg-blue-600 px-5 py-2.5 text-[11px] font-black uppercase tracking-wider text-white shadow-sm shadow-blue-200 transition-all group-hover:bg-blue-700 sm:w-auto sm:min-w-36">
              Ver perfil <ChevronRight size={12} strokeWidth={3} />
            </span>
            {isPublico && (
              <span
                onClick={e => {
                  e.preventDefault()
                  e.stopPropagation()
                  router.push(`/reivindicar?id=${prestador.id}&nome=${encodeURIComponent(prestador.nome)}`)
                }}
                className="cursor-pointer text-[10px] font-semibold text-slate-400 transition-colors hover:text-blue-600"
              >
                Este perfil é seu?
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  )
}
