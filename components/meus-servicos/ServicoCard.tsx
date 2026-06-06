'use client'
import { Clock, User, Phone, ChevronRight, ZoomIn, Briefcase } from 'lucide-react'
import { Servico } from '@/types/painel'

interface Props {
  servico: Servico
  onZoom: (url: string) => void
  onAceitar: (servico: Servico) => void
}

export default function ServicoCard({ servico, onZoom, onAceitar }: Props) {
  const fotoInicio = servico.portfolio_fotos?.find(f => f.ordem === 1)

  return (
    <div className="bg-white rounded-[2.5rem] p-4 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.05)] border border-slate-50 group">

      {/* Prestador */}
      <div className="flex items-center justify-between px-2 mb-4">
        <div className="flex items-center gap-3">
          {servico.prestadores?.foto_perfil ? (
            <img
              src={servico.prestadores.foto_perfil}
              className="w-10 h-10 rounded-full object-cover ring-2 ring-slate-50"
              alt="Prestador"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center">
              <User size={18} className="text-slate-300" />
            </div>
          )}
          <div>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Prestador</p>
            <h3 className="text-xs font-black uppercase text-slate-800">{servico.prestadores?.nome}</h3>
          </div>
        </div>
        <div className="px-3 py-1.5 bg-slate-50 rounded-full border border-slate-100">
          <span className="text-[9px] font-black uppercase text-slate-500 tracking-wider">
            {servico.prestadores?.categoria?.nome || 'Serviço'}
          </span>
        </div>
      </div>

      {/* Foto */}
      <div
        onClick={() => fotoInicio && onZoom(fotoInicio.url_foto)}
        className="relative aspect-[4/3] rounded-[2rem] overflow-hidden bg-slate-100 cursor-zoom-in"
      >
        {fotoInicio ? (
          <div className="relative w-full h-full">
            <img
              src={fotoInicio.url_foto}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              alt="Início"
            />
            <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-full shadow-sm">
              <p className="text-[9px] font-black uppercase tracking-widest text-slate-800 flex items-center gap-1.5">
                <Clock size={10} className="text-blue-600" /> Aguardando Início
              </p>
            </div>
            <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <div className="bg-white/30 backdrop-blur-md p-4 rounded-full text-white border border-white/40">
                <ZoomIn size={24} />
              </div>
            </div>
          </div>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-3 text-slate-300">
            <Briefcase size={32} opacity={0.5} />
            <span className="text-[10px] font-bold uppercase tracking-widest">Sem foto de capa</span>
          </div>
        )}
      </div>

      {/* Info + Ações */}
      <div className="mt-5 px-2 space-y-5">
        <div>
          <h4 className="text-xl font-black italic uppercase text-slate-800 leading-tight tracking-tight line-clamp-2">
            {servico.titulo}
          </h4>
          <div className="flex items-center gap-2 mt-2 text-slate-400">
            <Clock size={12} />
            <p className="text-[10px] font-medium uppercase tracking-wide">
              Criado em {new Date(servico.created_at).toLocaleDateString()}
            </p>
          </div>
        </div>

        <div className="flex gap-3">
          <a>
            href={`tel:${servico.prestadores?.whatsapp}`}
            className="w-14 h-14 rounded-2xl border-2 border-slate-100 flex items-center justify-center text-slate-400 hover:text-green-600 hover:border-green-100 hover:bg-green-50 transition-all"
          
            <Phone size={20} />
          </a>
          <button
            onClick={() => onAceitar(servico)}
            className="flex-1 bg-blue-600 text-white rounded-2xl font-black uppercase text-[11px] tracking-[0.2em] italic flex items-center justify-center gap-2 shadow-lg shadow-blue-200 hover:bg-blue-700 active:scale-[0.98] transition-all"
          >
            Autorizar Serviço <ChevronRight size={16} />
          </button>
        </div>
      </div>

    </div>
  )
}