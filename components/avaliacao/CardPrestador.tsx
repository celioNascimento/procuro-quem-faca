import { Phone, Share2, Briefcase, MapPin } from 'lucide-react'
import type { Projeto } from '@/hooks/useAvaliacao'

type Props = {
  projeto: Projeto
  onShare: () => void
}

export function CardPrestador({ projeto, onShare }: Props) {
  const prestador = projeto.prestadores

  return (
    <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">

      {/* Topo azul — fundo de vitrine */}
      <div className="h-24 bg-gradient-to-br from-blue-600 to-blue-500 relative">
        {/* Círculos decorativos */}
        <div className="absolute -bottom-8 -right-8 w-32 h-32 bg-white/10 rounded-full" />
        <div className="absolute -top-4 -left-4 w-20 h-20 bg-white/10 rounded-full" />

        {/* Botões flutuantes no canto */}
        <div className="absolute top-3 right-3 flex gap-2">
          <button
            onClick={onShare}
            className="w-8 h-8 bg-white/20 backdrop-blur-sm text-white rounded-xl flex items-center justify-center active:scale-95 transition-all border border-white/30 hover:bg-white/30"
          >
            <Share2 size={13} />
          </button>
          <a
            href={`tel:${prestador?.whatsapp}`}
            className="w-8 h-8 bg-green-500 text-white rounded-xl flex items-center justify-center shadow-md active:scale-95 transition-all"
          >
            <Phone size={13} fill="currentColor" />
          </a>
        </div>
      </div>

      {/* Foto centralizada sobrepondo o banner */}
      <div className="flex justify-center -mt-10 mb-3 relative z-10">
        <div className="w-20 h-20 rounded-2xl bg-white overflow-hidden border-4 border-white shadow-lg">
          <img
            src={prestador?.foto_perfil}
            className="w-full h-full object-cover"
            alt={prestador?.nome}
          />
        </div>
      </div>

      {/* Nome e categoria */}
      <div className="px-5 pb-5 text-center space-y-3">
        <div>
          <p className="text-[9px] font-black uppercase text-blue-600 tracking-[0.2em]">
            {prestador?.categoria?.nome}
          </p>
          <h2 className="text-base font-black text-slate-800 uppercase tracking-tight leading-tight mt-0.5">
            {prestador?.nome}
          </h2>
        </div>

        {/* Divider */}
        <div className="flex items-center gap-2">
          <div className="flex-1 h-px bg-slate-100" />
          <div className="w-1 h-1 bg-slate-200 rounded-full" />
          <div className="flex-1 h-px bg-slate-100" />
        </div>

        {/* Serviço em andamento */}
        <div className="bg-slate-50 rounded-2xl px-4 py-3 flex items-start gap-3 text-left">
          <div className="w-7 h-7 bg-blue-50 rounded-xl flex items-center justify-center shrink-0 mt-0.5">
            <Briefcase size={13} className="text-blue-500" />
          </div>
          <div className="min-w-0">
            <p className="text-[8px] font-black uppercase text-slate-400 tracking-widest leading-none">
              Serviço em andamento
            </p>
            <p className="text-[12px] font-bold text-slate-700 leading-snug mt-1 italic">
              {projeto.titulo}
            </p>
          </div>
        </div>

        {/* Whatsapp pill */}
        <a
          href={`tel:${prestador?.whatsapp}`}
          className="flex items-center justify-center gap-2 w-full py-2.5 bg-green-50 text-green-700 rounded-xl border border-green-100 text-[11px] font-black uppercase tracking-wider active:scale-95 transition-all hover:bg-green-100"
        >
          <Phone size={12} fill="currentColor" />
          {prestador?.whatsapp}
        </a>
      </div>
    </div>
  )
}