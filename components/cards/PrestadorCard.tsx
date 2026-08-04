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

  const isPublico  = prestador.origem_tipo === 'curadoria_publica'
  const perfilHref = getPerfilHref(prestador.slug, prestador.id)
  const localizacao = getLocalizacao(prestador.bairro, prestador.cidades?.nome)
  const habilidades = (prestador.habilidades || []).slice(0, 2)
  const extras      = (prestador.habilidades?.length || 0) - 2

  return (
    <Link
      href={perfilHref}
      onClick={() => registrarLog?.('CLIQUE_PERFIL', { nome: prestador.nome })}
      className="group relative block bg-white rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden"
    >
      <div className="flex min-h-[180px] flex-col gap-4 px-5 py-5 md:min-h-[200px] md:px-7 md:py-6">
        <div className="flex min-w-0 items-center gap-4 md:gap-5">
          {/* Foto */}
          <div className="flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-slate-100 bg-slate-50 md:size-24">
            {prestador.foto_perfil && !imgError ? (
              <img
                src={prestador.foto_perfil}
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                alt={prestador.nome}
                onError={() => setImgError(true)}
              />
            ) : (
              <span className="text-xl font-black text-slate-300 md:text-2xl">
                {getIniciais(prestador.nome)}
              </span>
            )}
          </div>

          {/* Textos */}
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <h3 className="text-pretty text-base font-black leading-snug tracking-tight text-slate-900 md:text-lg">
              {prestador.nome}
            </h3>
            <span className="text-[11px] font-black uppercase leading-none tracking-widest text-blue-600">
              {prestador.categoria}
            </span>

            <div className="mt-0.5 flex min-h-[20px] flex-wrap gap-1">
              {habilidades.map(hab => (
                <span key={hab} className="rounded-full border border-slate-100 bg-slate-50 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-slate-500">
                  {hab}
                </span>
              ))}
              {extras > 0 && (
                <span className="px-1 text-[9px] font-semibold text-slate-400">+{extras}</span>
              )}
            </div>

            <div className="mt-0.5 flex flex-wrap items-center gap-2">
              {localizacao && (
                <div className="flex items-center gap-1">
                  <MapPin size={11} className="shrink-0 text-slate-300" />
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
        </div>

        {/* Ações centralizadas sem disputar espaço com o nome */}
        <div className="mt-auto flex flex-col items-center gap-2">
          <span className="flex min-h-10 w-full items-center justify-center gap-1 rounded-xl bg-blue-600 px-4 py-2.5 text-[11px] font-black uppercase tracking-wider text-white shadow-sm shadow-blue-200 transition-all group-hover:bg-blue-700 sm:w-auto sm:min-w-36">
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
    </Link>
  )
}
