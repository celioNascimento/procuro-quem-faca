//components/dashboard/PrestadorSideCard.tsx

import { UserCircle2, MapPin, Phone, Star, Wrench, ExternalLink } from 'lucide-react'
import Link from 'next/link'

export interface PrestadorSideCardProps {
  nome?: string | null
  slug?: string | null
  foto_perfil?: string | null
  categoria?: string | null
  subcategoria?: string | null
  cidade_nome?: string | null
  whatsapp?: string | null
  media_nota?: number | null
  total_avals?: number
}

export function PrestadorSideCard({
  nome,
  slug,
  foto_perfil,
  categoria,
  subcategoria,
  cidade_nome,
  whatsapp,
  media_nota,
  total_avals = 0,
}: PrestadorSideCardProps) {
  const hasDetails =
    categoria || subcategoria || cidade_nome || whatsapp ||
    (media_nota !== null && media_nota !== undefined && total_avals > 0)

  return (
    <div className="w-full md:w-56 shrink-0 flex flex-col gap-3">

      {/* ── Card: foto + nome + slug ── */}
      <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
        <div className="aspect-square bg-slate-50 flex items-center justify-center">
          {foto_perfil ? (
            <img
              src={foto_perfil}
              alt={nome ?? ''}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="flex flex-col items-center gap-2 text-slate-300">
              <UserCircle2 size={48} strokeWidth={1.5} />
            </div>
          )}
        </div>
        <div className="px-4 py-4 border-t border-slate-100">
          <p className="font-black text-[17px] text-slate-800 leading-tight tracking-tight">
            {nome ?? '—'}
          </p>
          {slug && (
            <p className="text-[11px] text-blue-400 font-bold truncate mt-1 tracking-wide">
              @{slug}
            </p>
          )}
        </div>
      </div>

      {/* ── Card: dados profissionais ── */}
      {hasDetails && (
        <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm divide-y divide-slate-100">

          {(categoria || subcategoria) && (
            <div className="flex gap-3 items-start px-4 py-3">
              <Wrench size={14} className="text-slate-400 mt-0.5 shrink-0" />
              <div className="min-w-0">
                <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-0.5">Categoria</p>
                {categoria && <p className="text-[12px] font-bold text-slate-700 truncate">{categoria}</p>}
                {subcategoria && <p className="text-[11px] text-slate-400 truncate">{subcategoria}</p>}
              </div>
            </div>
          )}

          {cidade_nome && (
            <div className="flex gap-3 items-start px-4 py-3">
              <MapPin size={14} className="text-slate-400 mt-0.5 shrink-0" />
              <div className="min-w-0">
                <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-0.5">Cidade</p>
                <p className="text-[12px] font-bold text-slate-700 truncate">{cidade_nome}</p>
              </div>
            </div>
          )}

          {whatsapp && (
            <div className="flex gap-3 items-start px-4 py-3">
              <Phone size={14} className="text-slate-400 mt-0.5 shrink-0" />
              <div className="min-w-0">
                <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-0.5">WhatsApp</p>
                <p className="text-[12px] font-bold text-slate-700 truncate">{whatsapp}</p>
              </div>
            </div>
          )}

          {media_nota !== null && media_nota !== undefined && total_avals > 0 && (
            <div className="flex gap-3 items-start px-4 py-3">
              <Star size={14} className="text-slate-400 mt-0.5 shrink-0" />
              <div className="min-w-0">
                <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-0.5">Avaliação</p>
                <p className="text-[12px] font-bold text-slate-700">
                  {media_nota.toFixed(1)}
                  <span className="font-normal text-slate-400 ml-1">
                    · {total_avals} avaliação{total_avals > 1 ? 'ões' : ''}
                  </span>
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Link: ver perfil público ── */}
      {slug && (
        <Link
          href={`/${slug}`}
          className="flex items-center gap-2 px-4 py-3 bg-slate-50 hover:bg-blue-50 border border-slate-100 hover:border-blue-200 rounded-[1.5rem] text-[11px] font-black uppercase tracking-widest text-slate-400 hover:text-blue-500 transition-all active:scale-95 group"
        >
          <ExternalLink size={13} className="shrink-0" />
          <span>Ver meu perfil</span>
          <span className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity text-[10px]">→</span>
        </Link>
      )}
    </div>
  )
}