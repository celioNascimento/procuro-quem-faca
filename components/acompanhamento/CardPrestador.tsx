import { Phone, Share2, Briefcase } from 'lucide-react'
import type { Projeto } from '@/types/avaliacao'

type Props = {
  projeto: Projeto
  onShare: () => void
}

export function CardPrestador({ projeto, onShare }: Props) {
  const prestador = projeto.prestadores

  return (
    <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">

      {/* Banner azul — mais alto para dar espaço à foto */}
      <div className="h-36 bg-gradient-to-br from-blue-700 via-blue-600 to-blue-400 relative">
        {/* Círculos decorativos de fundo */}
        <div className="absolute -bottom-12 -right-12 w-48 h-48 bg-white/10 rounded-full" />
        <div className="absolute -top-6 -left-6 w-28 h-28 bg-white/10 rounded-full" />
        <div className="absolute bottom-4 left-6 w-10 h-10 bg-white/10 rounded-full" />

        {/* Botões share + tel no canto superior direito */}
        <div className="absolute top-4 right-4 flex gap-2">
          <button
            onClick={onShare}
            className="w-9 h-9 bg-white/20 backdrop-blur-sm text-white rounded-xl flex items-center justify-center active:scale-95 transition-all border border-white/30 hover:bg-white/30"
          >
            <Share2 size={14} />
          </button>
          <a
            href={`tel:${prestador?.whatsapp}`}
            className="w-9 h-9 bg-green-500 text-white rounded-xl flex items-center justify-center shadow-lg shadow-green-900/30 active:scale-95 transition-all"
          >
            <Phone size={14} fill="currentColor" />
          </a>
        </div>
      </div>

      {/* Foto grande centralizada — sobrepõe o banner */}
      <div className="flex justify-center -mt-14 mb-4 relative z-10">
        <div className="w-28 h-28 rounded-3xl bg-white overflow-hidden border-4 border-white shadow-2xl shadow-blue-200/60">
          <img
            src={prestador?.foto_perfil}
            className="w-full h-full object-cover"
            alt={prestador?.nome}
          />
        </div>
      </div>

      {/* Conteúdo textual */}
      <div className="px-5 pb-5 text-center space-y-4">

        {/* Categoria + Nome */}
        <div>
          <p className="text-[9px] font-black uppercase text-blue-600 tracking-[0.25em]">
            {prestador?.categoria?.nome}
          </p>
          <h2 className="text-lg font-black text-slate-900 uppercase tracking-tight leading-none mt-1">
            {prestador?.nome}
          </h2>
        </div>

        {/* Divider elegante */}
        <div className="flex items-center gap-2 px-4">
          <div className="flex-1 h-px bg-slate-100" />
          <div className="flex gap-1">
            <div className="w-1 h-1 bg-blue-200 rounded-full" />
            <div className="w-1 h-1 bg-blue-400 rounded-full" />
            <div className="w-1 h-1 bg-blue-200 rounded-full" />
          </div>
          <div className="flex-1 h-px bg-slate-100" />
        </div>

        {/* Serviço em andamento */}
        <div className="bg-slate-50 rounded-2xl px-4 py-3 flex items-start gap-3 text-left border border-slate-100">
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
          className="flex items-center justify-center gap-2 w-full py-3 bg-green-50 text-green-700 rounded-2xl border border-green-100 text-[11px] font-black uppercase tracking-wider active:scale-95 transition-all hover:bg-green-100"
        >
          <Phone size={12} fill="currentColor" />
          {prestador?.whatsapp}
        </a>
      </div>
    </div>
  )
}