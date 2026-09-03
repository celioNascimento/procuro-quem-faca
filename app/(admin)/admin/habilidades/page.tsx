'use client'

import { useState, type FormEvent, type ReactNode } from 'react'
import { FolderPlus, Layers3, Plus, RefreshCw, Sparkles, Star, Wrench, Home, Hammer, BriefcaseBusiness, Heart, Car } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useHabilidades } from '@/hooks/useHabilidades'

function Field({ label, children }: { label: string; children: ReactNode }) {
  return <label className="flex flex-col gap-2 text-xs font-semibold text-muted-foreground"><span>{label}</span>{children}</label>
}

const inputClass = 'h-11 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground outline-none transition focus:border-foreground focus:ring-4 focus:ring-foreground/10'

const iconMap: Record<string, LucideIcon> = { sparkles: Sparkles, home: Home, hammer: Hammer, wrench: Wrench, briefcase: BriefcaseBusiness, heart: Heart, car: Car }

function GroupIcon({ name, className = '' }: { name?: string | null; className?: string }) {
  const Icon = iconMap[(name ?? '').trim().toLowerCase()] ?? Layers3
  return <Icon aria-hidden="true" className={className} />
}

export default function GestaoHabilidades() {
  const { grupos, categorias, loading, saving, error, adicionarGrupo, adicionarCategoria, recarregar } = useHabilidades()
  const [grupoNome, setGrupoNome] = useState('')
  const [grupoIcone, setGrupoIcone] = useState('')
  const [grupoOrdem, setGrupoOrdem] = useState('0')
  const [categoriaNome, setCategoriaNome] = useState('')
  const [categoriaGrupo, setCategoriaGrupo] = useState('')
  const [destaque, setDestaque] = useState(false)
  const [feedback, setFeedback] = useState<string | null>(null)

  async function submitGrupo(event: FormEvent) {
    event.preventDefault(); setFeedback(null)
    const result = await adicionarGrupo(grupoNome, grupoIcone, Number(grupoOrdem) || 0)
    if (result.ok) { setGrupoNome(''); setGrupoIcone(''); setGrupoOrdem('0'); setFeedback('Grupo cadastrado com sucesso.') } else setFeedback(result.error)
  }

  async function submitCategoria(event: FormEvent) {
    event.preventDefault(); setFeedback(null)
    const result = await adicionarCategoria(categoriaNome, categoriaGrupo, destaque)
    if (result.ok) { setCategoriaNome(''); setCategoriaGrupo(''); setDestaque(false); setFeedback('Categoria cadastrada com sucesso.') } else setFeedback(result.error)
  }

  return <main className="min-h-screen bg-background px-4 py-6 text-foreground sm:px-8 lg:px-12 lg:py-10">
    <header className="mx-auto flex w-full max-w-7xl flex-col gap-5 border-b border-border pb-7 sm:flex-row sm:items-end sm:justify-between">
      <div className="flex min-w-0 items-start gap-4"><div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-foreground text-background"><Layers3 /></div><div className="min-w-0"><p className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">Painel administrativo</p><h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">Catálogo de habilidades</h1><p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">Organize serviços em grupos e categorias para manter a busca simples e consistente.</p></div></div>
      <button onClick={recarregar} className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-xl border border-border px-4 text-sm font-semibold transition hover:bg-muted" type="button"><RefreshCw data-icon="inline-start" /> Atualizar</button>
    </header>

    <section className="mx-auto mt-7 grid w-full max-w-7xl gap-6 lg:grid-cols-[minmax(280px,340px)_minmax(0,1fr)]">
      <div className="flex min-w-0 flex-col gap-5">
        <form onSubmit={submitGrupo} className="rounded-3xl border border-border bg-card p-5 shadow-sm sm:p-6"><div className="mb-5 flex items-center gap-3"><div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted"><FolderPlus /></div><div><h2 className="font-bold">Novo grupo</h2><p className="text-xs text-muted-foreground">Ex.: Manutenção, Beleza</p></div></div><div className="flex flex-col gap-4"><Field label="Nome do grupo"><input required value={grupoNome} onChange={e => setGrupoNome(e.target.value)} className={inputClass} placeholder="Nome do grupo" /></Field><div className="grid grid-cols-[minmax(0,1fr)_76px] gap-3"><Field label="Ícone"><input value={grupoIcone} onChange={e => setGrupoIcone(e.target.value)} className={inputClass} placeholder="home" /><span className="text-[11px] font-normal text-muted-foreground">home, hammer, wrench</span></Field><Field label="Ordem"><input type="number" value={grupoOrdem} onChange={e => setGrupoOrdem(e.target.value)} className={inputClass} /></Field></div><button disabled={saving} className="mt-1 inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-foreground px-4 text-sm font-bold text-background transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"><Plus data-icon="inline-start" /> Cadastrar grupo</button></div></form>
        <form onSubmit={submitCategoria} className="rounded-3xl border border-border bg-card p-5 shadow-sm sm:p-6"><div className="mb-5 flex items-center gap-3"><div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted"><Sparkles /></div><div><h2 className="font-bold">Nova categoria</h2><p className="text-xs text-muted-foreground">Vincule ao grupo certo</p></div></div><div className="flex flex-col gap-4"><Field label="Nome da categoria"><input required value={categoriaNome} onChange={e => setCategoriaNome(e.target.value)} className={inputClass} placeholder="Ex.: Instalação elétrica" /></Field><Field label="Grupo"><select required value={categoriaGrupo} onChange={e => setCategoriaGrupo(e.target.value)} className={inputClass}><option value="">Selecione um grupo</option>{grupos.map(grupo => <option key={grupo.id} value={String(grupo.id)}>{grupo.nome}</option>)}</select></Field><label className="flex items-center gap-3 text-sm font-semibold"><input type="checkbox" checked={destaque} onChange={e => setDestaque(e.target.checked)} className="size-4 accent-foreground" /><Star aria-hidden="true" /> Marcar como destaque</label><button disabled={saving || grupos.length === 0} className="mt-1 inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-foreground bg-foreground px-4 text-sm font-bold text-background transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"><Plus data-icon="inline-start" /> Cadastrar categoria</button></div></form>
        {feedback && <p role="status" className="rounded-xl border border-border bg-muted px-4 py-3 text-sm font-medium">{feedback}</p>}
      </div>

      <div className="min-w-0 rounded-3xl border border-border bg-card p-5 shadow-sm sm:p-8"><div className="mb-6 flex items-end justify-between gap-4"><div className="min-w-0"><p className="text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">Estrutura atual</p><h2 className="mt-2 text-2xl font-bold">Grupos e categorias</h2></div><div className="shrink-0 text-right text-xs text-muted-foreground"><strong className="block text-2xl text-foreground">{categorias.length}</strong> categorias</div></div>{loading ? <div className="flex min-h-80 items-center justify-center text-sm text-muted-foreground">Carregando catálogo...</div> : error ? <div className="rounded-2xl border border-border bg-muted p-6 text-sm">{error}</div> : grupos.length === 0 ? <div className="flex min-h-80 flex-col items-center justify-center rounded-2xl border border-dashed border-border px-5 text-center"><Layers3 className="mb-3 text-muted-foreground" /><p className="font-semibold">Nenhum grupo cadastrado</p><p className="mt-1 text-sm text-muted-foreground">Comece criando o primeiro grupo ao lado.</p></div> : <div className="flex min-w-0 flex-col gap-3">{grupos.map(grupo => { const items = categorias.filter(categoria => String(categoria.grupo_id) === String(grupo.id)); return <article key={grupo.id} className="min-w-0 rounded-2xl border border-border p-4 transition hover:border-foreground/40 sm:p-5"><div className="flex min-w-0 items-start justify-between gap-3"><div className="flex min-w-0 items-center gap-3"><div className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-border bg-muted"><GroupIcon name={grupo.icone} className="size-5" /></div><div className="min-w-0"><h3 className="truncate font-bold">{grupo.nome}</h3><p className="text-xs text-muted-foreground">{items.length} {items.length === 1 ? 'categoria' : 'categorias'}</p></div></div><span className="shrink-0 rounded-full border border-border px-3 py-1 text-xs font-bold text-muted-foreground">Ordem {grupo.ordem ?? 0}</span></div>{items.length > 0 && <div className="mt-4 grid grid-cols-1 gap-2 border-t border-border pt-4 sm:grid-cols-2">{items.map(item => <div key={item.id} className="flex min-w-0 items-center gap-2 rounded-xl bg-muted px-3 py-2 text-sm"><span className="size-1.5 shrink-0 rounded-full bg-foreground" aria-hidden="true" /><span className="truncate">{item.nome}</span>{item.destaque && <Star aria-label="Categoria em destaque" className="ml-auto size-4 shrink-0" />}</div>)}</div>}</article> })}</div>}</div>
    </section>
  </main>
}
