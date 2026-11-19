'use client'
// components/feed/FiltrosDoFeed.tsx — filtros do feed (tipo de serviço, estado, cidade) escondidos atrás de um botão.
// Fechado ocupa uma linha só; o número no botão mostra quantos filtros estão ligados. Escolher uma opção filtra na hora.
import { useState } from 'react'
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
  const ativos = contarFiltrosAtivos(filtros)

  return (
    <div className="mt-3">
      <button
        type="button"
        onClick={() => setAberto(a => !a)}
        aria-expanded={aberto}
        aria-controls="feed-filtros-painel"
        data-testid="feed-filtrar"
        className={`inline-flex min-h-11 items-center gap-2 rounded-xl border px-4 text-sm font-black ${ativos > 0 ? 'border-blue-200 bg-blue-50 text-blue-700' : 'border-slate-200 bg-white text-slate-700'}`}
      >
        <SlidersHorizontal size={16} aria-hidden="true" />
        Filtrar
        {ativos > 0 && <span className="rounded-full bg-blue-600 px-2 text-xs text-white" data-testid="feed-filtros-contador" aria-label={`${ativos} filtro${ativos > 1 ? 's' : ''} ligado${ativos > 1 ? 's' : ''}`}>{ativos}</span>}
      </button>

      {aberto && (
        <div id="feed-filtros-painel" data-testid="feed-filtros-painel" className="mt-3 space-y-3 rounded-2xl border border-slate-200 bg-white p-4">
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
              className="min-h-11 rounded-xl bg-blue-600 px-6 text-sm font-black text-white">
              Pronto
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
