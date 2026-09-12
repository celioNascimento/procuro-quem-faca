'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { ArrowRight, BookOpen, Search, X } from 'lucide-react'
import { findHelpArticle, getHelpArticles, helpCategories, searchHelpArticles, type HelpAudience } from '@/lib/help/help-content'

export function HelpCenter({ audience = 'cliente', context }: { audience?: HelpAudience; context?: string }) {
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('Todas')
  const articles = useMemo(() => {
    const source = query ? searchHelpArticles(query, audience) : getHelpArticles(audience, context)
    return category === 'Todas' ? source : source.filter((article) => article.category === category)
  }, [audience, category, context, query])

  return (
    <div className="space-y-8">
      <div className="relative">
        <Search className="absolute left-4 top-1/2 size-5 -translate-y-1/2 text-slate-400" aria-hidden="true" />
        <label htmlFor="help-search" className="sr-only">Buscar na ajuda</label>
        <input id="help-search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Busque por uma dúvida..." className="w-full rounded-2xl border border-slate-200 bg-white py-4 pl-12 pr-12 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100" />
        {query && <button type="button" onClick={() => setQuery('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" aria-label="Limpar busca"><X size={18} /></button>}
      </div>
      <div className="flex flex-wrap gap-2" aria-label="Categorias da ajuda">
        {['Todas', ...helpCategories].map((item) => <button key={item} type="button" onClick={() => setCategory(item)} className={`rounded-full px-4 py-2 text-xs font-bold transition ${category === item ? 'bg-blue-600 text-white' : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:ring-blue-200'}`}>{item}</button>)}
      </div>
      {articles.length ? <div className="grid gap-4 md:grid-cols-2">{articles.map((article) => <Link key={article.id} href={`/ajuda?artigo=${article.id}`} className="group rounded-3xl border border-slate-100 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md"><div className="mb-5 flex size-10 items-center justify-center rounded-2xl bg-blue-50 text-blue-600"><BookOpen size={18} aria-hidden="true" /></div><p className="mb-2 text-[10px] font-black uppercase tracking-widest text-blue-600">{article.category}</p><h2 className="text-lg font-black tracking-tight text-slate-900">{article.title}</h2><p className="mt-2 text-sm leading-6 text-slate-500">{article.summary}</p><span className="mt-5 inline-flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-700 group-hover:text-blue-600">Ler resposta <ArrowRight size={14} /></span></Link>)}</div> : <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-10 text-center"><p className="font-bold text-slate-700">Não encontramos essa dúvida.</p><p className="mt-2 text-sm text-slate-500">Tente outra palavra ou consulte todas as categorias.</p></div>}
    </div>
  )
}

export function ContextualHelp({ context, title = 'Precisa de ajuda?', audience = 'cliente' }: { context: string; title?: string; audience?: HelpAudience }) {
  const articles = getHelpArticles(audience, context)
  if (!articles.length) return null
  return <section className="rounded-3xl border border-blue-100 bg-blue-50/70 p-5 sm:p-6" aria-labelledby={`help-${context}`}><div className="flex items-start justify-between gap-4"><div><p className="text-[10px] font-black uppercase tracking-widest text-blue-600">Central de ajuda</p><h2 id={`help-${context}`} className="mt-1 text-lg font-black text-slate-900">{title}</h2></div><BookOpen className="mt-1 text-blue-500" size={20} aria-hidden="true" /></div><div className="mt-4 flex flex-wrap gap-2">{articles.map((article) => <Link key={article.id} href={`/ajuda?artigo=${article.id}`} className="rounded-xl bg-white px-3 py-2 text-xs font-bold text-slate-700 shadow-sm transition hover:text-blue-600">{article.title}</Link>)}</div><Link href={`/ajuda?contexto=${context}`} className="mt-5 inline-flex text-xs font-black uppercase tracking-wider text-blue-700">Ver todas as respostas <ArrowRight size={14} className="ml-2" /></Link></section>
}

export function HelpArticle({ id }: { id: string }) {
  const article = findHelpArticle(id)
  if (!article) return <div className="rounded-3xl bg-white p-8 text-center"><h1 className="text-xl font-black text-slate-900">Artigo não encontrado</h1><Link href="/ajuda" className="mt-4 inline-block text-sm font-bold text-blue-600">Voltar para a ajuda</Link></div>
  return <article className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm sm:p-10"><p className="text-[10px] font-black uppercase tracking-widest text-blue-600">{article.category}</p><h1 className="mt-3 text-3xl font-black tracking-tight text-slate-900">{article.title}</h1><p className="mt-4 text-base leading-7 text-slate-600">{article.summary}</p>{article.steps && <ol className="mt-8 space-y-4">{article.steps.map((step, index) => <li key={step} className="flex gap-4 text-sm leading-6 text-slate-700"><span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-black text-white">{index + 1}</span><span>{step}</span></li>)}</ol>}<div className="mt-10 border-t border-slate-100 pt-6"><Link href="/ajuda" className="text-xs font-black uppercase tracking-wider text-blue-600">← Voltar para central de ajuda</Link></div></article>
}
