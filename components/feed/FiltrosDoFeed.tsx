'use client'
// components/feed/FiltrosDoFeed.tsx — botão de filtro (ícone de ajustes) que fica ao lado das abas do feed.
// Toque → sobe do rodapé uma folha com tipo de serviço, estado e cidade. Escolher uma opção filtra na hora;
// toque fora, Esc ou "Pronto" fecham. O número no botão diz quantos filtros estão ligados (vale mesmo fechado).
// A folha é desenhada no <body> (portal): a barra do feed se move ao rolar e um "transform" no pai
// prenderia uma folha `fixed` dentro dela.
import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { SlidersHorizontal } from 'lucide-react'
import { contarFiltrosAtivos, rotuloDaCidade, type CidadeDoFeed, type FiltrosFeed } from '@/lib/feed/filtros'
import type { CategoriaDoFiltro } from '@/lib/services/feed.service'

interface Props {
  filtros: FiltrosFeed
  categorias: CategoriaDoFiltro[]
  estados: string[]
  cidades: CidadeDoFeed[]
  onMudar: (novos: Partial<FiltrosFeed>) => void
  onMudarEstado: (estado: string | null) => void
  onLimpar: () => void
}

const CAMPO = 'mt-1 block min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm'

export function FiltrosDoFeed({ filtros, categorias, estados, cidades, onMudar, onMudarEstado, onLimpar }: Props) {
  const [aberto, setAberto] = useState(false)
  const botao = useRef<HTMLButtonElement>(null)
  const folha = useRef<HTMLDivElement>(null)
  const ativos = contarFiltrosAtivos(filtros)

  useEffect(() => {
    if (!aberto) return
    const overflowAnterior = document.body.style.overflow
    document.body.style.overflow = 'hidden' // o feed não rola por trás da folha
    folha.current?.focus()
    const aoTeclar = (e: KeyboardEvent) => { if (e.key === 'Escape') setAberto(false) }
    window.addEventListener('keydown', aoTeclar)
    const botaoDeAbrir = botao.current
    return () => {
      document.body.style.overflow = overflowAnterior
      window.removeEventListener('keydown', aoTeclar)
      botaoDeAbrir?.focus()
    }
  }, [aberto])

  const rotulo = ativos > 0 ? `Filtrar trabalhos, ${ativos} ${ativos > 1 ? 'filtros ligados' : 'filtro ligado'}` : 'Filtrar trabalhos'

  return (
    <>
      <button
        ref={botao}
        type="button"
        onClick={() => setAberto(true)}
        aria-label={rotulo}
        aria-haspopup="dialog"
        aria-expanded={aberto}
        data-testid="feed-filtrar"
        className={`relative flex size-11 shrink-0 items-center justify-center rounded-xl border ${ativos > 0 ? 'border-blue-200 bg-blue-50 text-blue-700' : 'border-slate-200 bg-white text-slate-700'}`}
      >
        <SlidersHorizontal size={20} aria-hidden="true" />
        {ativos > 0 && (
          <span aria-hidden="true" data-testid="feed-filtros-contador"
            className="absolute -right-1.5 -top-1.5 flex size-5 items-center justify-center rounded-full bg-blue-600 text-xs font-black text-white">
            {ativos}
          </span>
        )}
      </button>

      {aberto && createPortal(
        <div className="fixed inset-0 z-[110]" data-testid="feed-filtros-painel">
          <button type="button" aria-label="Fechar filtros" onClick={() => setAberto(false)} data-testid="feed-filtros-fundo"
            className="absolute inset-0 cursor-default bg-slate-900/40" tabIndex={-1} />
          <div ref={folha} role="dialog" aria-modal="true" aria-label="Filtros do feed" tabIndex={-1}
            className="absolute inset-x-0 bottom-0 mx-auto max-h-[85vh] max-w-xl space-y-3 overflow-y-auto rounded-t-3xl bg-white p-5 pb-8 shadow-2xl focus:outline-none">
            <h2 className="text-lg font-black text-slate-900">Filtrar trabalhos</h2>
            <label className="block text-sm font-bold text-slate-700">
              Tipo de serviço
              <select value={filtros.categoriaId ?? ''} onChange={e => onMudar({ categoriaId: e.target.value || null })} data-testid="feed-categoria" className={CAMPO}>
                <option value="">Todos os serviços</option>
                {categorias.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
              </select>
            </label>
            <div className="grid grid-cols-3 gap-3">
              <label className="col-span-1 block text-sm font-bold text-slate-700">
                Estado
                <select value={filtros.estado ?? ''} onChange={e => onMudarEstado(e.target.value || null)} data-testid="feed-estado" className={CAMPO}>
                  <option value="">Todos</option>
                  {estados.map(uf => <option key={uf} value={uf}>{uf}</option>)}
                </select>
              </label>
              <label className="col-span-2 block text-sm font-bold text-slate-700">
                Cidade
                <select value={filtros.cidadeId ?? ''} onChange={e => onMudar({ cidadeId: e.target.value || null })} data-testid="feed-cidade" className={CAMPO}>
                  <option value="">Todas as cidades</option>
                  {cidades.map(c => <option key={c.id} value={c.id}>{rotuloDaCidade(c)}</option>)}
                </select>
              </label>
            </div>
            <div className="flex items-center justify-between gap-3 pt-1">
              <button type="button" onClick={onLimpar} disabled={ativos === 0} data-testid="feed-filtros-limpar"
                className="min-h-11 rounded-xl px-3 text-sm font-black text-blue-700 disabled:text-slate-400">
                Limpar filtros
              </button>
              <button type="button" onClick={() => setAberto(false)} data-testid="feed-filtros-fechar"
                className="min-h-11 rounded-xl bg-blue-600 px-8 text-sm font-black text-white">
                Pronto
              </button>
            </div>
          </div>
        </div>,
        document.body,
      )}
    </>
  )
}
