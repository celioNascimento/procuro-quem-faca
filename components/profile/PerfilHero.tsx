//components/profile/PerfilHero.tsx  

'use client'
import Link from 'next/link'
import { MapPin, ShieldCheck, Flag, Share2, CheckCircle, Wrench } from 'lucide-react'
import type { PrestadorPerfil, ProjetoPerfil } from '@/types/perfil'

interface Props {
  prestador: PrestadorPerfil
  projetos: ProjetoPerfil[]
  compartilhando: boolean
  onCompartilhar: () => void
}

export default function PerfilHero({ prestador, projetos, compartilhando, onCompartilhar }: Props) {
  const localizacao = [prestador.bairro, prestador.cidades?.nome]
    .filter(v => v?.trim())
    .join(', ')

  const totalFinalizados = projetos.filter(p => p.status === 'finalizado').length
  const slug             = prestador.slug
  const categoria        = prestador.categorias?.nome || prestador.categoria

  return (
    <section className="flex flex-col gap-3">

      {/* ── Card principal ── */}
      <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">

        {/* Banner com avatar + nome lado a lado */}
        <div className="w-full bg-slate-50 px-5 py-5 flex items-center gap-4">

          {/* Avatar */}
          <div className="relative shrink-0">
            <div className="w-32 h-28 rounded-2xl overflow-hidden border-4 border-white shadow-lg bg-white">
              {prestador.foto_perfil ? (
                <img
                  src={prestador.foto_perfil}
                  className="w-full h-full object-contain"
                  alt={`Logo de ${prestador.nome}`}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-slate-100">
                  <span className="text-slate-300 font-black text-[8px] uppercase tracking-widest text-center px-1">
                    Sem Logo
                  </span>
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
          <div className="flex-1 min-w-0">
            <h1 className="font-black text-[15px] text-slate-800 leading-tight tracking-tight uppercase italic break-words">
              {prestador.nome}
            </h1>
            {slug && (
              <p className="text-[10px] text-blue-400 font-bold truncate mt-0.5 tracking-wide">
                @{slug}
              </p>
            )}
            {localizacao && (
              <p className="flex items-center gap-1 text-[10px] font-medium text-slate-400 mt-1.5">
                <MapPin size={11} className="shrink-0" />
                {localizacao}
              </p>
            )}
          </div>

        </div>

        {(categoria || totalFinalizados > 0) && (
          <div className="flex items-center justify-between gap-4 px-5 py-3 border-t border-slate-100 text-[11px]">
            {categoria && (
              <span className="inline-flex items-center gap-1.5 text-blue-600 font-bold uppercase tracking-wide min-w-0">
                <Wrench size={13} className="shrink-0" />
                <span className="truncate">{categoria}</span>
              </span>
            )}
            {totalFinalizados > 0 && (
              <span className="text-slate-500 font-semibold whitespace-nowrap">
                {totalFinalizados} serviço{totalFinalizados > 1 ? 's' : ''} concluído{totalFinalizados > 1 ? 's' : ''}
              </span>
            )}
          </div>
        )}
      </div>

      {/* ── Ações secundárias ── */}
      <div className="flex items-center gap-2">
        <Link
          href={`/denunciar/${prestador.id}`}
          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 bg-white border border-slate-100 rounded-[1.5rem] text-[10px] font-bold text-slate-400 shadow-sm hover:text-red-500 hover:border-red-100 transition-all active:scale-95"
        >
          <Flag size={12} />
          Denunciar
        </Link>

        <button
          onClick={onCompartilhar}
          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 bg-white border border-slate-100 rounded-[1.5rem] text-[10px] font-bold text-slate-400 shadow-sm hover:text-blue-600 hover:border-blue-100 transition-all active:scale-95"
        >
          {compartilhando
            ? <><CheckCircle size={12} className="text-green-500" /> Copiado!</>
            : <><Share2 size={12} /> Compartilhar</>
          }
        </button>
      </div>

    </section>
  )
}
