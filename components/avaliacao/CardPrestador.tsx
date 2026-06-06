import { Phone, Share2 } from 'lucide-react'
import type { Projeto } from '@/hooks/useAvaliacao'

type Props = {
  projeto: Projeto
  onShare: () => void
}

export function CardPrestador({ projeto, onShare }: Props) {
  return (
    <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
      <div className="h-2 bg-blue-600" />

      <div className="p-5 flex items-center gap-4">
        <div className="w-14 h-14 rounded-2xl bg-slate-100 overflow-hidden shrink-0 border-2 border-slate-50 shadow-inner">
          <img
            src={projeto.prestadores?.foto_perfil}
            className="w-full h-full object-cover"
            alt="Prestador"
          />
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-[9px] font-black uppercase text-blue-600 tracking-widest mb-0.5">
            {projeto.prestadores?.categoria?.nome}
          </p>
          <h2 className="text-sm font-black text-slate-800 uppercase leading-tight">
            {projeto.prestadores?.nome}
          </h2>
          <p className="text-[11px] font-medium text-slate-400 mt-1 italic leading-snug line-clamp-2">
            {projeto.titulo}
          </p>
        </div>

        <div className="flex flex-col gap-2 shrink-0">
          <button
            onClick={onShare}
            className="w-10 h-10 bg-slate-50 text-slate-400 rounded-xl flex items-center justify-center active:scale-95 transition-all border border-slate-100"
          >
            <Share2 size={16} />
          </button>
          <a
            href={`tel:${projeto.prestadores?.whatsapp}`}
            className="w-10 h-10 bg-green-500 text-white rounded-xl flex items-center justify-center shadow-md shadow-green-100 active:scale-95 transition-all"
          >
            <Phone size={16} fill="currentColor" />
          </a>
        </div>
      </div>
    </div>
  )
}