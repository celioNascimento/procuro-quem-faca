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
      <div className="px-5 py-4 md:py-6 md:px-7 flex items-center gap-4 min-h-[100px] md:min-h-[110px]">

        {/* Foto */}
        <div className="w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-slate-50 overflow-hidden border border-slate-100 flex items-center justify-center shrink-0">
          {prestador.foto_perfil && !imgError ? (
            <img
              src={prestador.foto_perfil}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              alt={prestador.nome}
              onError={() => setImgError(true)}
            />
          ) : (
            <span className="text-base font-black text-slate-300">
              {getIniciais(prestador.nome)}
            </span>
          )}
        </div>

        {/* Textos */}
        <div className="flex-1 min-w-0 flex flex-col gap-1">
          <h3 className="font-black text-slate-900 text-[15px] leading-snug tracking-tight line-clamp-2">
            {prestador.nome}
          </h3>
          <span className="text-blue-600 text-[10px] font-black uppercase tracking-widest leading-none">
            {prestador.categoria}
          </span>

          {/* Sempre renderiza — reserva espaço mesmo sem habilidades */}
          <div className="flex flex-wrap gap-1 mt-0.5 min-h-[20px]">
            {habilidades.map(hab => (
              <span key={hab} className="text-[8px] font-semibold text-slate-500 bg-slate-50 border border-slate-100 px-1.5 py-0.5 rounded-full uppercase tracking-wide">
                {hab}
              </span>
            ))}
            {extras > 0 && (
              <span className="text-[8px] font-semibold text-slate-400 px-1">+{extras}</span>
            )}
          </div>

          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            {localizacao && (
              <div className="flex items-center gap-1">
                <MapPin size={9} className="shrink-0 text-slate-300" />
                <p className="text-[10px] font-medium text-slate-400 tracking-tight">
                  {localizacao}
                </p>
              </div>
            )}
            {isPublico && (
              <span className="flex items-center gap-1 text-[8px] font-semibold text-slate-400 bg-slate-50 border border-slate-200 px-1.5 py-0.5 rounded-full">
                <Globe size={7} /> Perfil público
              </span>
            )}
          </div>
        </div>

        {/* Botão direito */}
        <div className="shrink-0 flex flex-col items-end gap-2">
          <span className="flex items-center gap-1 bg-blue-600 text-white px-3 py-2 rounded-xl font-black text-[10px] uppercase tracking-wider group-hover:bg-blue-700 transition-all shadow-sm shadow-blue-200 whitespace-nowrap">
            Ver perfil <ChevronRight size={10} strokeWidth={3} />
          </span>
          {isPublico && (
            <span
              onClick={e => {
                e.preventDefault()
                e.stopPropagation()
                router.push(`/reivindicar?id=${prestador.id}&nome=${encodeURIComponent(prestador.nome)}`)
              }}
              className="text-[8px] font-semibold text-slate-400 hover:text-blue-600 transition-colors cursor-pointer whitespace-nowrap"
            >
              👋 É você?
            </span>
          )}
        </div>

      </div>
    </Link>
  )
}