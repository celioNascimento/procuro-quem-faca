'use client'
import Link from 'next/link'
import { MapPin, ShieldCheck, Flag, Share2, CheckCircle, Wrench, Star } from 'lucide-react'
import type { PrestadorPerfil, ProjetoPerfil } from '@/types/perfil'
import { useAvaliacoes } from '@/hooks/useAvaliacoes'

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
  const totalEmAndamento = projetos.filter(p => p.status === 'em_execucao').length
  const slug             = prestador.slug
  const categoria        = prestador.categorias?.nome || prestador.categoria

  const { stats } = useAvaliacoes(prestador.id)

  return (
    <section className="flex flex-col gap-3">

      {/* ── Card: foto + identidade ── */}
      <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">

        {/* Banner + Avatar sobrepostos */}
        <div className="relative w-full h-32 bg-gradient-to-br from-blue-50 to-slate-100">
          <div className="absolute -bottom-14 left-6">
            <div className="w-28 h-28 rounded-2xl overflow-hidden border-4 border-white shadow-lg bg-slate-100">
              {prestador.foto_perfil ? (
                <img
                  src={prestador.foto_perfil}
                  className="w-full h-full object-cover"
                  alt={prestador.nome}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="text-slate-300 font-black text-[9px] uppercase tracking-widest text-center px-1">
                    Sem Foto
                  </span>
                </div>
              )}
            </div>

            {prestador.verificado && (
              <div className="absolute -bottom-1 -right-1 bg-blue-600 text-white p-1.5 rounded-full shadow border-2 border-white">
                <ShieldCheck size={12} strokeWidth={3} />
              </div>
            )}
          </div>
        </div>

        {/* Nome + slug + localização + chips */}
        <div className="pt-16 px-5 pb-5">
          <h1 className="font-black text-[17px] text-slate-800 leading-tight tracking-tight uppercase italic">
            {prestador.nome}
          </h1>
          {slug && (
            <p className="text-[11px] text-blue-400 font-bold truncate mt-1 tracking-wide">
              @{slug}
            </p>
          )}
          {localizacao && (
            <p className="flex items-center gap-1 text-[11px] font-medium text-slate-400 mt-2">
              <MapPin size={12} className="shrink-0" />
              {localizacao}
            </p>
          )}

          {/* ── Chips discretos ── */}
          {(categoria || totalFinalizados > 0 || totalEmAndamento > 0 || stats.exibir) && (
            <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-slate-100">

              {categoria && (
                <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-600 text-[10px] font-bold px-2.5 py-1 rounded-full border border-blue-100">
                  <Wrench size={10} className="shrink-0" />
                  {categoria}
                </span>
              )}

              {totalFinalizados > 0 && (
                <span className="inline-flex items-center gap-1 bg-green-50 text-green-700 text-[10px] font-bold px-2.5 py-1 rounded-full border border-green-100">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400 shrink-0" />
                  {totalFinalizados} concluído{totalFinalizados > 1 ? 's' : ''}
                </span>
              )}

              {totalEmAndamento > 0 && (
                <span className="inline-flex items-center gap-1 bg-slate-50 text-slate-500 text-[10px] font-bold px-2.5 py-1 rounded-full border border-slate-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse shrink-0" />
                  {totalEmAndamento} em andamento
                </span>
              )}

              {stats.exibir && (
                <span className="inline-flex items-center gap-1 bg-slate-50 text-slate-500 text-[10px] font-bold px-2.5 py-1 rounded-full border border-slate-200">
                  <Star size={10} className="text-yellow-400 fill-yellow-400 shrink-0" />
                  {stats.media} · {stats.total} avaliações
                </span>
              )}

            </div>
          )}
        </div>
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