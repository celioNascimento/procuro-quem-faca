//components/profile/ProjetoModal.tsx

'use client'
import { X, Share2, CheckCircle2, Activity, User, Camera, ShieldCheck, ShieldOff, XCircle, ShieldAlert } from 'lucide-react'
import type { ProjetoPerfil, GarantiaPublica } from '@/types/perfil'
import { useSlides } from '@/hooks/useSlides'
import { useComentariosFoto } from '@/hooks/useComentariosFoto'
import { ModalFotoBase } from '@/components/shared/ModalFotoBase'

interface Props {
  projeto: ProjetoPerfil
  onClose: () => void
}

const CONFIG_GARANTIA: Record<string, {
  icon: React.ElementType
  cor: string
  titulo: string
  descricao: string
}> = {
  resolvida: {
    icon: ShieldCheck,
    cor: 'bg-green-50 border-green-200 text-green-700',
    titulo: 'Garantia honrada',
    descricao: 'O prestador retornou e resolveu o problema relatado pelo cliente.',
  },
  sem_resposta: {
    icon: ShieldOff,
    cor: 'bg-red-50 border-red-200 text-red-700',
    titulo: 'Garantia sem resposta',
    descricao: 'O prazo de resposta expirou sem retorno do prestador.',
  },
  recusada: {
    icon: XCircle,
    cor: 'bg-slate-50 border-slate-200 text-slate-500',
    titulo: 'Oferta de reparo recusada',
    descricao: 'O cliente optou por não aceitar a oferta de reparo do prestador.',
  },
}

function GarantiaCard({ garantia }: { garantia: GarantiaPublica }) {
  const config = CONFIG_GARANTIA[garantia.status]
  if (!config) return null
  const Icon = config.icon

  return (
    <div className={`rounded-2xl border p-4 space-y-3 ${config.cor}`}>
      <div className="flex items-center gap-2">
        <Icon size={14} className="shrink-0" />
        <p className="text-[10px] font-black uppercase tracking-widest leading-none">
          {config.titulo}
        </p>
      </div>
      <p className="text-[11px] font-medium leading-snug opacity-80">
        {config.descricao}
      </p>

      {garantia.descricao_problema && (
        <div className="bg-white/60 rounded-xl p-3 space-y-1">
          <p className="text-[9px] font-black uppercase tracking-widest opacity-60">Problema relatado</p>
          <p className="text-[11px] font-medium leading-snug">{garantia.descricao_problema}</p>
        </div>
      )}

      {garantia.resposta_prestador_garantia && (
        <div className="bg-white/60 rounded-xl p-3 space-y-1">
          <p className="text-[9px] font-black uppercase tracking-widest opacity-60">Proposta do prestador</p>
          <p className="text-[11px] font-medium leading-snug">{garantia.resposta_prestador_garantia}</p>
        </div>
      )}

      {garantia.resolucao_descricao && (
        <div className="bg-white/60 rounded-xl p-3 space-y-1">
          <p className="text-[9px] font-black uppercase tracking-widest opacity-60">Como foi resolvido</p>
          <p className="text-[11px] font-medium leading-snug">{garantia.resolucao_descricao}</p>
        </div>
      )}

      {garantia.fotos && garantia.fotos.length > 0 && (
        <div className="space-y-2">
          <p className="text-[9px] font-black uppercase tracking-widest opacity-60">Fotos da resolução</p>
          <div className="grid grid-cols-3 gap-2">
            {garantia.fotos.map(foto => (
              <div key={foto.id} className="aspect-square rounded-xl overflow-hidden bg-white/40">
                <img
                  src={foto.url_foto}
                  alt={foto.legenda ?? 'Foto da resolução'}
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default function ProjetoModal({ projeto, onClose }: Props) {
  const { sorted: fotos, fotoAtual, current, next, prev } = useSlides(projeto.portfolio_fotos)
  const comentarios = useComentariosFoto(fotoAtual?.id)

  const isConcluido = projeto.status === 'finalizado' || fotos.some(f => f.ordem === 3)
  const garantias   = projeto.solicitacoes_garantia ?? []

  const handleShare = async () => {
    const url   = typeof window !== 'undefined' ? window.location.href : ''
    const texto = `Confira este trabalho no Procuro Quem Faça: ${projeto.titulo}`
    try {
      if (navigator.share) await navigator.share({ title: projeto.titulo, text: texto, url })
      else await navigator.clipboard.writeText(url)
    } catch { /* usuário cancelou */ }
  }

  if (!fotoAtual) {
    return (
      <div className="fixed inset-0 z-[200] bg-slate-900/95 flex items-center justify-center p-4 animate-in fade-in duration-300">
        <button onClick={onClose} className="absolute top-6 right-6 text-white/50 hover:text-white z-[210]">
          <X size={32} />
        </button>
        <div className="bg-white rounded-[3rem] p-12 flex flex-col items-center gap-3 text-slate-300">
          <Camera size={40} />
          <p className="text-[10px] font-black uppercase tracking-widest italic">Sem imagens</p>
        </div>
      </div>
    )
  }

  const ordemLabel = fotoAtual.ordem != null
    ? `Fase ${String(fotoAtual.ordem).padStart(2, '0')}`
    : 'Registro'

  return (
    <ModalFotoBase
      fotoUrl={fotoAtual.url_foto}
      ordemLabel={ordemLabel}
      onClose={onClose}
      navegacao={fotos.length > 1 ? { onPrev: prev, onNext: next } : undefined}
    >
      <div className="p-5 flex items-center justify-between border-b border-slate-50 shrink-0">
        <div>
          <h3 className="text-[11px] font-black text-slate-800 uppercase italic leading-none tracking-tight truncate max-w-[200px]">
            {projeto.titulo}
          </h3>
          <div className="flex items-center gap-1.5 mt-1">
            {isConcluido
              ? <CheckCircle2 size={10} className="text-green-500" />
              : <Activity size={10} className="text-blue-500 animate-pulse" />
            }
            <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest leading-none">
              {isConcluido ? 'Finalizado' : 'Em andamento'}
            </p>
            {garantias.length > 0 && (
              <span className="flex items-center gap-0.5 ml-1">
                <ShieldAlert size={9} className={
                  garantias[0].status === 'resolvida'    ? 'text-green-500' :
                  garantias[0].status === 'sem_resposta' ? 'text-red-400'   : 'text-slate-400'
                } />
                <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Garantia</span>
              </span>
            )}
          </div>
        </div>
        <button onClick={onClose} className="p-3 text-slate-300 hover:text-slate-600 transition-colors md:hidden">
          <X size={20} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-8" style={{ scrollbarWidth: 'thin' }}>

        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-4 bg-blue-600 rounded-full" />
            <span className="font-black text-slate-900 uppercase text-[10px] tracking-widest italic">Nota Técnica</span>
          </div>
          <p className="text-[14px] text-slate-600 leading-relaxed italic pl-4 border-l-2 border-slate-100 font-medium">
            {fotoAtual.legenda || 'Acompanhamento técnico em andamento.'}
          </p>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-50 pb-2">
            <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-widest italic">Interações da Fase</h4>
            <div className="flex gap-1">
              {fotos.map((_, i) => (
                <div key={i} className={`h-1 rounded-full transition-all duration-300 ${current === i ? 'w-4 bg-blue-600' : 'w-1 bg-slate-200'}`} />
              ))}
            </div>
          </div>

          {comentarios.length === 0 ? (
            <p className="text-[10px] text-slate-300 italic">Sem registros de feedback nesta fase.</p>
          ) : (
            comentarios.map(com => (
              <div key={com.id} className="flex gap-3 animate-in fade-in slide-in-from-left-2 duration-300">
                <div className="w-8 h-8 rounded-xl bg-slate-50 shrink-0 flex items-center justify-center border border-slate-100">
                  <User size={14} className="text-slate-400" />
                </div>
                <div className="max-w-[85%] p-3 rounded-2xl rounded-tl-none text-[11px] font-bold leading-tight bg-slate-50 text-slate-600 border border-slate-100 italic">
                  {com.texto}
                </div>
              </div>
            ))
          )}
        </div>

        {projeto.avaliacoes && projeto.avaliacoes.length > 0 && (
          <div className="pt-2 border-t border-slate-50 space-y-4 animate-in fade-in duration-500">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-4 bg-blue-600 rounded-full" />
              <span className="font-black text-slate-900 uppercase text-[10px] tracking-widest italic">Avaliação do Cliente</span>
            </div>
            {projeto.avaliacoes.map(av => (
              <div key={av.id} className="bg-white rounded-[1.5rem] p-5 border border-slate-100 shadow-sm flex flex-col gap-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-center shrink-0">
                      <User size={14} className="text-slate-300" />
                    </div>
                    <p className="text-[11px] font-bold text-slate-800 tracking-tight">Cliente Verificado</p>
                  </div>
                  {av.indica && (
                    <span className="flex items-center gap-1 bg-blue-600 text-white text-[9px] font-black tracking-wide px-2.5 py-1.5 rounded-xl shrink-0 shadow-sm shadow-blue-200">
                      ✦ Indico
                    </span>
                  )}
                </div>
                {av.comentario && (
                  <p className="text-[12px] font-medium text-slate-600 leading-relaxed italic bg-slate-50/50 p-4 rounded-xl border border-slate-50">
                    "{av.comentario}"
                  </p>
                )}
              </div>
            ))}
          </div>
        )}

        {garantias.length > 0 && (
          <div className="pt-2 border-t border-slate-50 space-y-4 animate-in fade-in duration-500">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-4 bg-orange-500 rounded-full" />
              <span className="font-black text-slate-900 uppercase text-[10px] tracking-widest italic">Pós-serviço</span>
            </div>
            {garantias.map(g => <GarantiaCard key={g.id} garantia={g} />)}
          </div>
        )}

      </div>

      <div className="p-5 px-8 border-t border-slate-50 flex items-center justify-between bg-white shrink-0">
        <button
          onClick={handleShare}
          className="text-slate-400 hover:text-blue-600 transition-all active:scale-95 flex items-center gap-2 group"
        >
          <Share2 size={22} className="group-hover:scale-110 transition-transform" />
          <span className="text-[10px] font-black uppercase tracking-widest italic">Compartilhar</span>
        </button>
        <span className="text-[9px] font-black text-slate-200 uppercase tracking-[0.2em] italic">
          #{String(projeto.id).split('-')[0]}
        </span>
      </div>
    </ModalFotoBase>
  )
}