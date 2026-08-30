//components/meus-servicos/ServicoCard.tsx
'use client'
import { Clock, User, Phone, ChevronRight, ZoomIn, Briefcase, CheckCircle2, ShieldAlert } from 'lucide-react'
import { Servico } from '@/types/painel'
import { buildLinkWhatsapp } from '@/lib/utils/whatsapp'

interface Props {
  servico: Servico
  onZoom: (url: string) => void
  onAceitar: (servico: Servico) => void
  hidePrestador?: boolean
  modo?: 'pendente' | 'andamento' | 'concluido' | 'garantia'
  // Sinaliza garantia ativa independente da aba/modo atual — exibe a tag
  // laranja sobre a foto sem alterar o estilo geral do card. Quando
  // modo === 'garantia' já aplica o estilo completo, então a tag extra
  // só é renderizada quando modo !== 'garantia'.
  temGarantiaAtiva?: boolean
}

// Label e cor do badge da foto variam conforme o status
const BADGE = {
  pendente:  { texto: 'Aguardando Início', cor: 'text-blue-600'    },
  andamento: { texto: 'Em Andamento',      cor: 'text-amber-500'   },
  concluido: { texto: 'Concluído',         cor: 'text-emerald-600' },
  garantia:  { texto: 'Em Garantia',       cor: 'text-orange-600'  },
}

export default function ServicoCard({
  servico,
  onZoom,
  onAceitar,
  hidePrestador = false,
  modo = 'pendente',
  temGarantiaAtiva = false,
}: Props) {
  const fotoInicio = servico.portfolio_fotos?.find(f => f.ordem === 1)
  const badge = BADGE[modo]
  // Projeto sem_fotos nunca terá fotoInicio — em vez de mostrar o bloco
  // "Sem foto de capa" (que sugere pendência), omite o espaço de imagem
  // por completo, deixando o card mais compacto.
  const semFotos = servico.sem_fotos ?? false

  // Tag de garantia aparece sobre a foto quando o projeto tem garantia ativa
  // mas está sendo exibido fora da aba Garantia (modo !== 'garantia').
  // Na aba Garantia o card já usa modo='garantia' com badge próprio — sem duplicar.
  const mostrarTagGarantia = temGarantiaAtiva && modo !== 'garantia'

  return (
    <div className="bg-white rounded-[2.5rem] p-4 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.05)] border border-slate-50 group">

      {/* ── Cabeçalho do prestador (opcional) ── */}
      {!hidePrestador && (
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
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">
                Prestador
              </p>
              <h3 className="text-xs font-black uppercase text-slate-800">
                {servico.prestadores?.nome}
              </h3>
            </div>
          </div>
          <div className="px-3 py-1.5 bg-slate-50 rounded-full border border-slate-100">
            <span className="text-[9px] font-black uppercase text-slate-500 tracking-wider">
              {servico.prestadores?.categoria?.nome || 'Serviço'}
            </span>
          </div>
        </div>
      )}

      {/* ── Foto de capa — omitida por completo quando sem_fotos ── */}
      {!semFotos && (
        <div
          onClick={() => fotoInicio && onZoom(fotoInicio.url_foto)}
          className="relative aspect-[4/3] rounded-[2rem] overflow-hidden bg-slate-100 cursor-zoom-in"
        >
          {fotoInicio ? (
            <div className="relative w-full h-full">
              <img
                src={fotoInicio.url_foto}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                alt="Foto do serviço"
              />

              {/* Badge de status sobre a foto (canto superior esquerdo) */}
              <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-full shadow-sm">
                <p className={`text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 ${badge.cor}`}>
                  {modo === 'concluido'  && <CheckCircle2 size={10} />}
                  {modo === 'garantia'   && <ShieldAlert  size={10} />}
                  {(modo === 'pendente' || modo === 'andamento') && <Clock size={10} />}
                  {badge.texto}
                </p>
              </div>

              {/* Tag de garantia ativa — aparece quando o projeto tem garantia
                  mas está sendo exibido fora da aba Garantia (canto superior direito).
                  Permite ao cliente identificar o projeto com garantia em qualquer aba
                  sem sobrescrever o badge de status principal. */}
              {mostrarTagGarantia && (
                <div className="absolute top-4 right-4 bg-orange-500/90 backdrop-blur-md px-3 py-1.5 rounded-full shadow-sm">
                  <p className="text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 text-white">
                    <ShieldAlert size={10} />
                    Garantia
                  </p>
                </div>
              )}

              {/* Overlay de zoom no hover */}
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

              {/* Tag de garantia mesmo sem foto de capa */}
              {mostrarTagGarantia && (
                <div className="absolute top-4 right-4 bg-orange-500/90 backdrop-blur-md px-3 py-1.5 rounded-full shadow-sm">
                  <p className="text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 text-white">
                    <ShieldAlert size={10} />
                    Garantia
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── Badge de status + tag de garantia, quando sem_fotos (substituem
          o que normalmente fica sobre a foto) ── */}
      {semFotos && (
        <div className="flex items-center gap-2 px-2 pt-1">
          <span className={`inline-flex items-center gap-1.5 bg-slate-50 border border-slate-100 px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest ${badge.cor}`}>
            {modo === 'concluido'  && <CheckCircle2 size={10} />}
            {modo === 'garantia'   && <ShieldAlert  size={10} />}
            {(modo === 'pendente' || modo === 'andamento') && <Clock size={10} />}
            {badge.texto}
          </span>
          {mostrarTagGarantia && (
            <span className="inline-flex items-center gap-1.5 bg-orange-50 border border-orange-100 px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest text-orange-600">
              <ShieldAlert size={10} />
              Garantia
            </span>
          )}
        </div>
      )}

      {/* ── Informações e ações ── */}
      <div className="mt-5 px-2 space-y-5">
        <div>
          <h4 className="text-xl font-black italic uppercase text-slate-800 leading-tight tracking-tight line-clamp-2">
            {servico.titulo}
          </h4>
          <div className="flex items-center gap-2 mt-2 text-slate-400">
            <Clock size={12} />
            <p className="text-[10px] font-medium uppercase tracking-wide">
              Criado em {new Date(servico.created_at).toLocaleDateString('pt-BR')}
            </p>
          </div>
        </div>

        {/* ── Botões de ação ── */}
        <div className="flex gap-3">

          {/* Botão de telefone — sempre visível */}
          <a
            href={buildLinkWhatsapp(servico.prestadores?.whatsapp)}
            target="_blank"
            rel="noopener noreferrer"
            className="w-14 h-14 rounded-2xl border-2 border-slate-100 flex items-center justify-center text-slate-400 hover:text-green-600 hover:border-green-100 hover:bg-green-50 transition-all"
          >
            <Phone size={20} />
          </a>

          {/* PENDENTE — Autorizar */}
          {modo === 'pendente' && (
            <button
              onClick={() => onAceitar(servico)}
              className="flex-1 bg-blue-600 text-white rounded-2xl font-black uppercase text-[11px] tracking-[0.2em] italic flex items-center justify-center gap-2 shadow-lg shadow-blue-200 hover:bg-blue-700 active:scale-[0.98] transition-all"
            >
              Autorizar Serviço <ChevronRight size={16} />
            </button>
          )}

          {/* ANDAMENTO — Acompanhar */}
          {modo === 'andamento' && (
            <button
              onClick={() => onAceitar(servico)}
              className="flex-1 bg-slate-800 text-white rounded-2xl font-black uppercase text-[11px] tracking-[0.2em] italic flex items-center justify-center gap-2 hover:bg-slate-700 active:scale-[0.98] transition-all"
            >
              Acompanhar <ChevronRight size={16} />
            </button>
          )}

          {/* CONCLUÍDO — botão muda de cor se tiver garantia ativa,
              sinalizando que há algo pendente além da avaliação. */}
          {modo === 'concluido' && (
            <button
              onClick={() => onAceitar(servico)}
              className={`flex-1 text-white rounded-2xl font-black uppercase text-[11px] tracking-[0.2em] italic flex items-center justify-center gap-2 active:scale-[0.98] transition-all ${
                mostrarTagGarantia
                  ? 'bg-orange-500 hover:bg-orange-600 shadow-lg shadow-orange-100'
                  : 'bg-emerald-600 hover:bg-emerald-700'
              }`}
            >
              {mostrarTagGarantia ? (
                <><ShieldAlert size={14} /> Ver Garantia <ChevronRight size={16} /></>
              ) : (
                <>Ver avaliação <ChevronRight size={16} /></>
              )}
            </button>
          )}

          {/* GARANTIA — Ver caso de garantia (aberto ou em andamento) */}
          {modo === 'garantia' && (
            <button
              onClick={() => onAceitar(servico)}
              className="flex-1 bg-orange-600 text-white rounded-2xl font-black uppercase text-[11px] tracking-[0.2em] italic flex items-center justify-center gap-2 shadow-lg shadow-orange-200 hover:bg-orange-700 active:scale-[0.98] transition-all"
            >
              Ver Garantia <ChevronRight size={16} />
            </button>
          )}

        </div>
      </div>

    </div>
  )
}
