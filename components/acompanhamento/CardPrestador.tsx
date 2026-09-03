// components/acompanhamento/CardPrestador.tsx

import { Phone, Share2, ShieldAlert } from 'lucide-react'
import type { Projeto } from '@/types/avaliacao'
import { buildLinkWhatsapp } from '@/lib/utils/whatsapp'

type Props = {
  projeto: Projeto
  onShare?: () => void
  temGarantiaAtiva?: boolean
}

export function CardPrestador({ projeto, onShare, temGarantiaAtiva = false }: Props) {
  const prestador    = projeto.prestadores
  const linkWhatsapp = buildLinkWhatsapp(prestador?.whatsapp)

  const isConcluido = projeto.status === 'finalizado'

  // Garantia tem prioridade visual sobre "concluído" — o serviço pode estar
  // finalizado, mas há algo pendente que o cliente precisa resolver.
  const statusLabel = temGarantiaAtiva
    ? 'Garantia em andamento'
    : isConcluido
    ? 'Serviço concluído'
    : 'Serviço em andamento'

  const statusColor = temGarantiaAtiva ? 'bg-orange-500' : isConcluido ? 'bg-green-500'  : 'bg-blue-500'
  const statusBg    = temGarantiaAtiva ? 'bg-orange-50'  : isConcluido ? 'bg-green-50'   : 'bg-blue-50'
  const statusText  = temGarantiaAtiva ? 'text-orange-600' : isConcluido ? 'text-green-600' : 'text-blue-600'

  return (
    <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-4 sm:p-5 flex flex-col gap-4 transition-all hover:shadow-md">

      {/* ── Topo: Avatar e Informações ── */}
      <div className="flex items-center gap-4">
        <div className="flex size-24 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-slate-100 bg-slate-50 md:size-28">
          <img
            src={prestador?.foto_perfil || '/placeholder-avatar.png'}
            className="h-full w-full object-contain p-1 transition-transform duration-500 group-hover:scale-[1.02]"
            alt={prestador?.nome}
          />
        </div>

        <div className="flex-1 min-w-0 flex flex-col justify-center">
          <p className="text-[9px] font-black uppercase text-blue-600 tracking-[0.2em] truncate">
            {prestador?.categoria?.nome}
          </p>
          <h2 className="text-[13px] sm:text-sm font-black text-slate-900 uppercase tracking-tight truncate mt-0.5">
            {prestador?.nome}
          </h2>
          <p className="text-[11px] text-slate-500 truncate mt-0.5 italic font-medium">
            {projeto.titulo}
          </p>
        </div>
      </div>

      {/* ── Base: Status e Ações ── */}
      <div className="flex items-center justify-between gap-3 pt-4 border-t border-slate-50">

        {/* Status Badge */}
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border border-white/50 ${statusBg}`}>
          <div className="relative flex h-2 w-2 shrink-0">
            {/* Pulse só quando há algo ativo pendente (em execução ou garantia) */}
            {(!isConcluido || temGarantiaAtiva) && (
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${statusColor}`} />
            )}
            <span className={`relative inline-flex rounded-full h-2 w-2 ${statusColor}`} />
          </div>
          {temGarantiaAtiva && <ShieldAlert size={11} className="text-orange-500" />}
          <span className={`text-[9px] font-black uppercase tracking-widest ${statusText}`}>
            {statusLabel}
          </span>
        </div>

        {/* Botões de Ação */}
        <div className="flex items-center gap-2 shrink-0">
          {onShare && (
            <button
              onClick={onShare}
              className="w-10 h-10 rounded-[1rem] border border-slate-100 bg-white flex items-center justify-center text-slate-400 hover:text-blue-600 hover:border-blue-100 hover:bg-blue-50 transition-all active:scale-95"
              title="Compartilhar projeto"
            >
              <Share2 size={16} />
            </button>
          )}
          <a
            href={linkWhatsapp}
            target="_blank"
            rel="noopener noreferrer"
            className="w-10 h-10 rounded-[1rem] border border-green-100 bg-green-50 flex items-center justify-center text-green-600 hover:bg-green-100 transition-all active:scale-95 shadow-sm shadow-green-100"
            title="Contato via WhatsApp"
          >
            <Phone size={16} fill="currentColor" />
          </a>
        </div>

      </div>
    </div>
  )
}
