// components/feed/FeedCard.tsx
// Um trabalho no feed. Mostra só o que é público: fotos, título, descrição curta, prestador e curtidas.
// Nunca mostra nome de cliente, WhatsApp nem endereço (o banco nem devolve esses dados).
import Link from 'next/link'
import { Heart, MapPin, UserCheck, UserPlus } from 'lucide-react'
import { textoCurtidas, type FeedItem } from '@/lib/feed/feed'

interface Props {
  item: FeedItem
  onCurtir: (projetoId: string) => void
  onSeguir: (prestadorId: number) => void
}

export function FeedCard({ item, onCurtir, onSeguir }: Props) {
  const { prestador } = item
  const local = [prestador.categoria, prestador.cidade].filter(Boolean).join(' · ')
  return (
    <article className="overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm" data-testid="feed-card">
      <header className="flex items-center justify-between gap-3 p-4">
        <Link href={`/${prestador.slug}`} className="min-w-0 flex-1" data-testid="feed-prestador">
          <p className="truncate text-sm font-black text-slate-900">{prestador.nome}</p>
          {local && (
            <p className="flex items-center gap-1 truncate text-xs font-medium text-slate-500">
              <MapPin size={12} aria-hidden="true" /> {local}
            </p>
          )}
        </Link>
        <button
          type="button" onClick={() => onSeguir(prestador.id)} aria-pressed={item.seguindo} data-testid="feed-seguir"
          className={`flex min-h-11 shrink-0 items-center gap-1.5 rounded-xl border px-3 text-xs font-black ${item.seguindo ? 'border-slate-200 bg-slate-50 text-slate-700' : 'border-blue-200 bg-blue-50 text-blue-700'}`}
        >
          {item.seguindo ? <><UserCheck size={14} aria-hidden="true" /> Seguindo</> : <><UserPlus size={14} aria-hidden="true" /> Seguir</>}
        </button>
      </header>

      <Link href={`/${prestador.slug}`} aria-label={`Ver o perfil de ${prestador.nome}`}>
        <img src={item.fotos[0]} alt={item.titulo} loading="lazy" className="aspect-[4/3] w-full object-cover" data-testid="feed-foto" />
      </Link>

      <div className="p-4">
        <h2 className="text-base font-black leading-snug text-slate-900">{item.titulo}</h2>
        {item.descricao && <p className="mt-1 line-clamp-3 text-sm text-slate-600">{item.descricao}</p>}
        <div className="mt-3 flex items-center justify-between gap-3">
          <button
            type="button" onClick={() => onCurtir(item.projetoId)} aria-pressed={item.curtidoPorMim} data-testid="feed-curtir"
            className={`flex min-h-11 items-center gap-2 rounded-xl px-3 text-sm font-bold ${item.curtidoPorMim ? 'bg-rose-50 text-rose-700' : 'bg-slate-50 text-slate-600'}`}
          >
            <Heart size={18} aria-hidden="true" fill={item.curtidoPorMim ? 'currentColor' : 'none'} />
            <span data-testid="feed-curtidas">{textoCurtidas(item.totalCurtidas)}</span>
          </button>
          <Link href={`/${prestador.slug}`} className="min-h-11 content-center text-sm font-black text-blue-700">Ver perfil</Link>
        </div>
      </div>
    </article>
  )
}
