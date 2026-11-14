//components/profile/ProjetoModal.tsx
//
// Trabalho aberto a partir da capa do portfólio no perfil público. Abre na foto da capa (a última, em geral
// o "Depois"); as abas Antes / Durante / Depois (e o arrastar com o dedo) levam às outras. Mostra a descrição
// da foto, o que o cliente comentou, a avaliação, o resultado de uma garantia e, no rodapé, o contato.
// O cliente aparece só pelo primeiro nome: a plataforma não verifica quem avalia.
'use client'
import { useState } from 'react'
import { Share2, Check, CheckCircle2, Activity, User, ShieldCheck, ShieldOff, XCircle, Camera, X } from 'lucide-react'
import type { ProjetoPerfil, GarantiaPublica } from '@/types/perfil'
import { useSlides } from '@/hooks/useSlides'
import { useComentariosFoto } from '@/hooks/useComentariosFoto'
import { ModalFotoBase } from '@/components/shared/ModalFotoBase'
import { descricaoOuPadrao, NOME_DA_ETAPA, type EtapaFoto } from '@/lib/trabalho/descricaoFotos'
import { buildLinkWhatsapp } from '@/lib/utils/whatsapp'
import { primeiroNomeDoCliente, CLIENTE_SEM_NOME } from '@/lib/nomeDoCliente'

/** Contato do profissional, para o botão do rodapé. Sem WhatsApp válido, o botão não aparece. */
export interface ContatoDoModal {
  nome: string
  whatsapp: string
  onClique: () => Promise<void>
}

interface Props {
  projeto: ProjetoPerfil
  onClose: () => void
  contato?: ContatoDoModal
}

const CONFIG_GARANTIA: Record<string, {
  icon: React.ElementType
  cor: string
  titulo: string
  descricao: string
}> = {
  resolvida: {
    icon: ShieldCheck,
    cor: 'bg-green-50 border-green-200 text-green-800',
    titulo: 'Garantia honrada',
    descricao: 'O profissional voltou e resolveu o problema relatado pelo cliente.',
  },
  sem_resposta: {
    icon: ShieldOff,
    cor: 'bg-red-50 border-red-200 text-red-800',
    titulo: 'Garantia sem resposta',
    descricao: 'O prazo de resposta acabou sem retorno do profissional.',
  },
  recusada: {
    icon: XCircle,
    cor: 'bg-slate-50 border-slate-200 text-slate-700',
    titulo: 'Oferta de reparo recusada',
    descricao: 'O cliente preferiu não aceitar a oferta de reparo do profissional.',
  },
}

function nomeDaFoto(ordem: number | null | undefined): string {
  return ordem != null && ordem in NOME_DA_ETAPA ? NOME_DA_ETAPA[ordem as EtapaFoto] : 'Foto do serviço'
}

function GarantiaCard({ garantia }: { garantia: GarantiaPublica }) {
  const config = CONFIG_GARANTIA[garantia.status]
  if (!config) return null
  const Icon = config.icon

  return (
    <section className={`space-y-4 rounded-2xl border p-4 ${config.cor}`} aria-label="Garantia do trabalho">
      <div className="flex items-start gap-2.5">
        <Icon size={18} className="mt-0.5 shrink-0" aria-hidden="true" />
        <div>
          <p className="text-sm font-bold leading-tight">{config.titulo}</p>
          <p className="mt-1 text-sm leading-snug opacity-90">{config.descricao}</p>
        </div>
      </div>

      {garantia.descricao_problema && (
        <div className="space-y-1 rounded-xl border border-orange-200/70 bg-orange-50/70 p-3 text-orange-950">
          <p className="text-xs font-bold text-orange-700">Problema relatado</p>
          <p className="text-sm leading-snug">{garantia.descricao_problema}</p>
        </div>
      )}

      {(garantia.resposta_prestador_garantia || garantia.resolucao_descricao || (garantia.fotos && garantia.fotos.length > 0)) && (
        <div className="space-y-3 rounded-xl border border-emerald-200/70 bg-emerald-50/70 p-3 text-emerald-950">
          <p className="text-xs font-bold text-emerald-800">Como foi resolvido</p>
          {garantia.resposta_prestador_garantia && (
            <div className="space-y-1 rounded-lg border border-white/70 bg-white/70 p-3">
              <p className="text-xs font-bold opacity-70">Proposta do profissional</p>
              <p className="text-sm leading-snug">{garantia.resposta_prestador_garantia}</p>
            </div>
          )}
          {garantia.resolucao_descricao && (
            <div className="space-y-1 rounded-lg border border-white/70 bg-white/70 p-3">
              <p className="text-xs font-bold opacity-70">Resolução</p>
              <p className="text-sm leading-snug">{garantia.resolucao_descricao}</p>
            </div>
          )}
          {garantia.fotos && garantia.fotos.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-bold opacity-70">Fotos da resolução</p>
              <div className="grid grid-cols-3 gap-2">
                {garantia.fotos.map(foto => (
                  <div key={foto.id} className="aspect-square overflow-hidden rounded-xl bg-white/40">
                    <img src={foto.url_foto} alt={foto.legenda ?? 'Foto da resolução'} className="h-full w-full object-cover" />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  )
}

export default function ProjetoModal({ projeto, onClose, contato }: Props) {
  const { sorted: fotos, fotoAtual, current, next, prev, ir } = useSlides(projeto.portfolio_fotos, true)
  const comentarios = useComentariosFoto(fotoAtual?.id)
  const [avisoCopiado, setAvisoCopiado] = useState(false)

  const isConcluido = projeto.status === 'finalizado' || fotos.some(f => f.ordem === 3)
  const garantias   = projeto.solicitacoes_garantia ?? []

  const linkWhatsapp = contato
    ? buildLinkWhatsapp(contato.whatsapp, `Olá ${contato.nome}, vi seu trabalho "${projeto.titulo}" no Procuro Quem Faça e gostaria de um orçamento.`)
    : undefined

  const handleShare = async () => {
    const url   = typeof window !== 'undefined' ? window.location.href : ''
    const texto = `Confira este trabalho no Procuro Quem Faça: ${projeto.titulo}`
    try {
      if (navigator.share) {
        await navigator.share({ title: projeto.titulo, text: texto, url })
      } else {
        await navigator.clipboard.writeText(url)
        setAvisoCopiado(true)
        setTimeout(() => setAvisoCopiado(false), 2500)
      }
    } catch { /* a pessoa cancelou */ }
  }

  if (!fotoAtual) {
    return (
      <div role="dialog" aria-modal="true" aria-label={projeto.titulo} className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/95 p-4 animate-in fade-in duration-300">
        <button type="button" onClick={onClose} aria-label="Fechar" className="absolute right-4 top-4 flex size-11 items-center justify-center rounded-full bg-black/55 text-white hover:bg-black/75">
          <X size={22} aria-hidden="true" />
        </button>
        <div className="flex flex-col items-center gap-3 rounded-[2rem] bg-white p-10 text-slate-500">
          <Camera size={40} aria-hidden="true" />
          <p className="text-base font-medium">Este trabalho ainda não tem fotos.</p>
        </div>
      </div>
    )
  }

  const nomeDaFase = nomeDaFoto(fotoAtual.ordem)

  return (
    <ModalFotoBase
      fotoUrl={fotoAtual.url_foto}
      ordemLabel={nomeDaFase}
      titulo={projeto.titulo}
      onClose={onClose}
      navegacao={fotos.length > 1 ? { onPrev: prev, onNext: next } : undefined}
    >
      <div className="shrink-0 border-b border-slate-100 px-5 pb-3 pt-4">
        <h3 className="text-lg font-bold leading-tight text-slate-900">{projeto.titulo}</h3>
        <p className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm font-medium text-slate-600">
          <span className="inline-flex items-center gap-1.5">
            {isConcluido
              ? <CheckCircle2 size={16} className="text-green-600" aria-hidden="true" />
              : <Activity size={16} className="text-blue-600" aria-hidden="true" />}
            {isConcluido ? 'Concluído' : 'Em andamento'}
          </span>
          {garantias.length > 0 && (
            <span className="inline-flex items-center gap-1.5">
              <ShieldCheck size={16} className="text-slate-500" aria-hidden="true" />
              Teve garantia
            </span>
          )}
        </p>

        {fotos.length > 1 && (
          <div role="tablist" aria-label="Fotos do trabalho" className="mt-3 flex gap-1 rounded-2xl bg-slate-100 p-1">
            {fotos.map((foto, i) => (
              <button
                key={foto.id}
                type="button"
                role="tab"
                aria-selected={current === i}
                onClick={() => ir(i)}
                className={`min-h-11 flex-1 rounded-xl px-2 text-sm font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 ${
                  current === i ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {nomeDaFoto(foto.ordem)}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex-1 space-y-6 overflow-y-auto px-5 py-5">

        <section className="space-y-2" aria-label="Sobre esta foto">
          <h4 className="text-sm font-bold text-slate-500">Sobre esta foto</h4>
          <p className="text-base leading-relaxed text-slate-800">
            {descricaoOuPadrao(fotoAtual.ordem, fotoAtual.legenda)}
          </p>
        </section>

        {comentarios.length > 0 && (
          <section className="space-y-3" aria-label="Comentários do cliente nesta foto">
            <h4 className="text-sm font-bold text-slate-500">O que o cliente comentou</h4>
            {comentarios.map(com => (
              <div key={com.id} className="flex gap-3 animate-in fade-in slide-in-from-left-2 duration-300">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-slate-100 bg-slate-50">
                  <User size={16} className="text-slate-400" aria-hidden="true" />
                </div>
                <div className="max-w-[85%] rounded-2xl rounded-tl-none border border-slate-100 bg-slate-50 p-3 text-sm leading-snug text-slate-700">
                  {com.texto}
                </div>
              </div>
            ))}
          </section>
        )}

        {projeto.avaliacoes && projeto.avaliacoes.length > 0 && (
          <section className="space-y-3 border-t border-slate-100 pt-5" aria-label="Avaliação do cliente">
            <h4 className="text-sm font-bold text-slate-500">Avaliação do cliente</h4>
            {projeto.avaliacoes.map(av => {
              const primeiroNome = primeiroNomeDoCliente(av.cliente_nome)
              return (
                <div key={av.id} className="flex flex-col gap-3 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-slate-100 bg-slate-50">
                        <User size={16} className="text-slate-400" aria-hidden="true" />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-slate-900">{primeiroNome ?? CLIENTE_SEM_NOME}</p>
                        {primeiroNome && <p className="text-xs text-slate-500">Cliente deste serviço</p>}
                      </div>
                    </div>
                    {av.indica && (
                      <span className="shrink-0 rounded-full bg-blue-600 px-3 py-1 text-xs font-bold text-white">
                        ✦ Indico
                      </span>
                    )}
                  </div>
                  {av.comentario && (
                    <p className="rounded-xl bg-slate-50 p-3 text-sm leading-relaxed text-slate-700">
                      &quot;{av.comentario}&quot;
                    </p>
                  )}
                </div>
              )
            })}
          </section>
        )}

        {garantias.length > 0 && (
          <section className="space-y-3 border-t border-slate-100 pt-5" aria-label="Depois do serviço">
            <h4 className="text-sm font-bold text-slate-500">Depois do serviço</h4>
            {garantias.map(g => <GarantiaCard key={g.id} garantia={g} />)}
          </section>
        )}

      </div>

      <div className="flex shrink-0 items-center gap-2 border-t border-slate-100 bg-white px-5 py-3">
        {linkWhatsapp && contato && (
          <a
            href={linkWhatsapp}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => {
              void contato.onClique().catch((error) => {
                console.error('[ProjetoModal] Falha ao registrar clique:', error)
              })
            }}
            className="flex min-h-12 min-w-0 flex-1 items-center justify-center gap-2 rounded-2xl bg-blue-600 px-4 text-base font-bold text-white transition-colors hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
          >
            <span className="truncate">Chamar no WhatsApp</span>
          </a>
        )}
        {/* Só o ícone: o "Chamar no WhatsApp" precisa do espaço. O nome fica para leitores de tela e no tooltip. */}
        <button
          type="button"
          onClick={handleShare}
          aria-label={avisoCopiado ? 'Link copiado' : 'Compartilhar'}
          title={avisoCopiado ? 'Link copiado' : 'Compartilhar este trabalho'}
          className={`flex size-12 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 transition-colors hover:border-blue-300 hover:text-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 ${linkWhatsapp ? '' : 'w-full gap-2 px-4 text-base font-bold'}`}
        >
          {avisoCopiado ? <Check size={20} className="text-green-600" aria-hidden="true" /> : <Share2 size={20} aria-hidden="true" />}
          {!linkWhatsapp && <span>{avisoCopiado ? 'Link copiado' : 'Compartilhar'}</span>}
        </button>
      </div>
    </ModalFotoBase>
  )
}
