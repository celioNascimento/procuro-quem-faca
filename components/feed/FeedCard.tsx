// components/feed/FeedCard.tsx
// Um trabalho no feed, no jeito do Instagram: fotos (desliza, toque duplo curte), curtir, compartilhar, menu ⋯.
// Mostra só o que é público: fotos, título, descrição curta, prestador e curtidas.
// Nunca mostra nome de cliente, WhatsApp nem endereço (o banco nem devolve esses dados).
// "Falar com o profissional" abre o perfil já com o trabalho aberto, onde está o botão de WhatsApp.
import Link from 'next/link'
import { Bookmark, Heart, MapPin, MessageCircle, Share2, UserCheck, UserPlus } from 'lucide-react'
import { enderecoDoTrabalho, textoCurtidas, type FeedItem } from '@/lib/feed/feed'
import { enderecoDaDenuncia } from '@/lib/feed/denuncia'
import { FotosDoTrabalho } from './FotosDoTrabalho'
import { MenuDoCard } from './MenuDoCard'

interface Props {
  item: FeedItem
  onCurtir: (projetoId: string) => void
  onSeguir: (prestadorId: number) => void
  onSalvar: (projetoId: string) => void
  onCompartilhar: (item: FeedItem) => void
  onCopiarLink: (item: FeedItem) => void
}

export function FeedCard({ item, onCurtir, onSeguir, onSalvar, onCompartilhar, onCopiarLink }: Props) {
  const { prestador } = item
  const local = [prestador.categoria, prestador.cidade].filter(Boolean).join(' · ')
  return (
    <article className="overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm" data-testid="feed-card">
      <header className="flex items-center justify-between gap-3 px-3 py-2.5">
        <Link href={`/${prestador.slug}`} className="min-w-0 flex-1" data-testid="feed-prestador">
          <p className="truncate text-sm font-black text-slate-900">{prestador.nome}</p>
          {local && (
            <p className="flex items-center gap-1 truncate text-xs font-medium text-slate-500">
              <MapPin size={12} aria-hidden="true" /> {local}
            </p>
          )}
        </Link>
        {item.meu ? (
          <span className="shrink-0 rounded-xl bg-slate-100 px-3 py-2 text-xs font-black text-slate-600" data-testid="feed-meu">Seu trabalho</span>
        ) : (
          <button
            type="button" onClick={() => onSeguir(prestador.id)} aria-pressed={item.seguindo} data-testid="feed-seguir"
            className={`flex min-h-11 shrink-0 items-center gap-1.5 rounded-xl border px-3 text-xs font-black ${item.seguindo ? 'border-slate-200 bg-slate-50 text-slate-700' : 'border-blue-200 bg-blue-50 text-blue-700'}`}
          >
            {item.seguindo ? <><UserCheck size={14} aria-hidden="true" /> Seguindo</> : <><UserPlus size={14} aria-hidden="true" /> Seguir</>}
          </button>
        )}
      </header>

      <FotosDoTrabalho
        fotos={item.fotos} titulo={item.titulo}
        onDuploToque={item.meu ? null : () => { if (!item.curtidoPorMim) onCurtir(item.projetoId) }}
      />

      <div className="px-3 pb-3 pt-2">
        <h2 className="text-[15px] font-black leading-snug text-slate-900">{item.titulo}</h2>
        {item.descricao && <p className="mt-1 line-clamp-3 text-sm text-slate-600">{item.descricao}</p>}

        <div className="mt-1 flex flex-wrap items-center justify-between gap-2">
          {item.meu ? (
            <p className="flex min-h-11 items-center gap-2 px-3 text-sm font-bold text-slate-600" data-testid="feed-curtidas-meu">
              <Heart size={18} aria-hidden="true" />
              <span data-testid="feed-curtidas">{item.totalCurtidas === 0 ? 'Nenhuma curtida ainda' : textoCurtidas(item.totalCurtidas)}</span>
            </p>
          ) : (
            <button
              type="button" onClick={() => onCurtir(item.projetoId)} aria-pressed={item.curtidoPorMim} data-testid="feed-curtir"
              className={`flex min-h-11 items-center gap-2 rounded-xl px-3 text-sm font-bold ${item.curtidoPorMim ? 'bg-rose-50 text-rose-700' : 'bg-slate-50 text-slate-600'}`}
            >
              <Heart size={18} aria-hidden="true" fill={item.curtidoPorMim ? 'currentColor' : 'none'} />
              <span data-testid="feed-curtidas">{textoCurtidas(item.totalCurtidas)}</span>
            </button>
          )}
          <div className="ml-auto flex items-center gap-1">
            <button
              type="button" onClick={() => onCompartilhar(item)} data-testid="feed-compartilhar"
              aria-label={`Compartilhar o trabalho ${item.titulo}`} title="Compartilhar"
              className="flex size-11 items-center justify-center rounded-xl text-slate-600 hover:bg-slate-50 hover:text-blue-700 active:scale-95"
            >
              <Share2 size={18} aria-hidden="true" />
            </button>
            {!item.meu && (
              <button
                type="button" onClick={() => onSalvar(item.projetoId)} aria-pressed={item.salvoPorMim} data-testid="feed-salvar"
                aria-label={item.salvoPorMim ? 'Remover dos salvos' : `Salvar o trabalho ${item.titulo}`} title={item.salvoPorMim ? 'Remover dos salvos' : 'Salvar'}
                className={`flex size-11 items-center justify-center rounded-xl active:scale-95 ${item.salvoPorMim ? 'text-blue-700' : 'text-slate-600 hover:bg-slate-50 hover:text-blue-700'}`}
              >
                <Bookmark size={18} aria-hidden="true" fill={item.salvoPorMim ? 'currentColor' : 'none'} />
              </button>
            )}
            {!item.meu && (
              <MenuDoCard hrefDenuncia={enderecoDaDenuncia(prestador.id, item.projetoId, item.titulo)} onCopiarLink={() => onCopiarLink(item)} />
            )}
          </div>
        </div>

        <div className="mt-1 flex items-center gap-2">
          {!item.meu && (
            <Link
              href={enderecoDoTrabalho(prestador.slug, item.projetoId)} data-testid="feed-falar"
              className="flex min-h-11 min-w-0 flex-1 items-center justify-center gap-2 rounded-2xl bg-blue-600 px-4 text-sm font-black text-white hover:bg-blue-700"
            >
              <MessageCircle size={18} aria-hidden="true" />
              <span className="truncate">Falar com o profissional</span>
            </Link>
          )}
          <Link href={`/${prestador.slug}`} data-testid="feed-ver-perfil" className="flex min-h-11 shrink-0 items-center rounded-2xl px-3 text-sm font-black text-blue-700 hover:bg-blue-50">
            Ver perfil
          </Link>
        </div>
      </div>
    </article>
  )
}
