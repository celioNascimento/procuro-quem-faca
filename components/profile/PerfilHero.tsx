//components/profile/PerfilHero.tsx  

'use client'
import Link from 'next/link'
import { MapPin, ShieldCheck, Flag, Share2, CheckCircle, Wrench } from 'lucide-react'
import type { PrestadorPerfil } from '@/types/perfil'
import { visualDaArea } from '@/lib/areaVisual'
import { corDasIniciais, getIniciais } from '@/lib/prestadorUtils'

interface Props {
  prestador: PrestadorPerfil
  compartilhando: boolean
  onCompartilhar: () => void
}

export default function PerfilHero({ prestador, compartilhando, onCompartilhar }: Props) {
  const localizacao = [prestador.bairro, prestador.cidades?.nome]
    .filter(v => v?.trim())
    .join(', ')

  const categoria        = prestador.categorias?.nome || prestador.categoria
  // Sem foto (a maioria dos perfis): o ícone da área, como na lista; sem ícone conhecido, as iniciais.
  const visualArea       = visualDaArea(prestador.grupo_icone)

  return (
    <section className="flex flex-col gap-3">

      {/* ── Card principal ── */}
      <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">

        {/* Banner com avatar + nome lado a lado */}
        <div className="w-full bg-slate-50 px-5 py-5 flex items-center gap-4 lg:flex-col lg:items-stretch lg:gap-4 lg:px-6 lg:py-5">

          {/* Avatar */}
          <div className="relative shrink-0 lg:w-full">
            <div className="w-32 h-28 rounded-2xl overflow-hidden border-4 border-white shadow-lg bg-white md:h-36 md:w-44 lg:h-[clamp(6rem,19vh,13rem)] lg:w-full">
              {prestador.foto_perfil ? (
                <img
                  src={prestador.foto_perfil}
                  className="w-full h-full object-contain"
                  alt={`Logo de ${prestador.nome}`}
                />
              ) : (
                <div className={`flex h-full w-full items-center justify-center ${visualArea ? visualArea.cores : corDasIniciais(prestador.nome || '')}`}>
                  {visualArea ? (
                    <visualArea.Icone aria-hidden="true" strokeWidth={1.5} className="size-12 lg:size-16" />
                  ) : (
                    <span aria-hidden="true" className="text-3xl font-bold tracking-tight lg:text-4xl">
                      {getIniciais(prestador.nome || '')}
                    </span>
                  )}
                </div>
              )}
            </div>
            {prestador.verificado && (
              <div className="absolute -bottom-1 -right-1 bg-blue-600 text-white p-1 rounded-full shadow border-2 border-white">
                <ShieldCheck size={10} strokeWidth={3} />
              </div>
            )}
          </div>

          {/* Nome + slug + localização no banner */}
          <div className="flex-1 min-w-0 lg:text-center">
            <h1 className="break-words text-xl font-bold leading-tight tracking-tight text-slate-900 lg:text-2xl">
              {prestador.nome}
            </h1>
            {localizacao && (
              <p className="mt-1.5 flex items-center gap-1.5 text-sm font-medium text-slate-600 lg:justify-center">
                <MapPin size={14} className="shrink-0 text-slate-400" aria-hidden="true" />
                {localizacao}
              </p>
            )}
          </div>

        </div>

        {categoria && (
          <div className="flex items-center gap-4 border-t border-slate-100 px-5 py-3 text-sm lg:justify-center">
            <span className="inline-flex items-center gap-1.5 text-blue-600 font-bold uppercase tracking-wide min-w-0">
              <Wrench size={14} className="shrink-0" />
              <span className="truncate">{categoria}</span>
            </span>
          </div>
        )}
      </div>

      {/* ── Ações secundárias ── */}
      <div className="flex items-center gap-2">
        <Link
          href={`/denunciar/${prestador.id}`}
          className="flex min-h-11 flex-1 items-center justify-center gap-2 rounded-[1.5rem] border border-slate-100 bg-white px-3 text-sm font-semibold text-slate-600 shadow-sm transition-all hover:border-red-100 hover:text-red-600 active:scale-95"
        >
          <Flag size={14} aria-hidden="true" />
          Denunciar
        </Link>

        <button
          onClick={onCompartilhar}
          className="flex min-h-11 flex-1 items-center justify-center gap-2 rounded-[1.5rem] border border-slate-100 bg-white px-3 text-sm font-semibold text-slate-600 shadow-sm transition-all hover:border-blue-100 hover:text-blue-600 active:scale-95"
        >
          {compartilhando
            ? <><CheckCircle size={14} className="text-green-500" aria-hidden="true" /> Copiado!</>
            : <><Share2 size={14} aria-hidden="true" /> Compartilhar</>
          }
        </button>
      </div>

    </section>
  )
}
