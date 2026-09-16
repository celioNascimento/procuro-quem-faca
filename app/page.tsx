'use client'

import { useMemo, useState } from 'react'
import {
  AlertTriangle,
  ArrowRight,
  Check,
  ChevronDown,
  Download,
  ExternalLink,
  FileCode2,
  Filter,
  Link2,
  Menu,
  Search,
  ShieldCheck,
  Sparkles,
  X,
} from 'lucide-react'

type IssueType = 'canonical' | 'duplicate' | 'redirect'
type Issue = { url: string; type: IssueType; priority: 'Alta' | 'Média' | 'Baixa'; action: string }

const issueMeta: Record<IssueType, { label: string; description: string; color: string; soft: string }> = {
  canonical: { label: 'Canonical incorreta', description: 'A página aponta para uma URL canônica diferente ou ausente.', color: 'text-rose-600', soft: 'bg-rose-50 border-rose-100' },
  duplicate: { label: 'Duplicado sem canonical', description: 'Conteúdo semelhante sem uma página principal definida.', color: 'text-amber-600', soft: 'bg-amber-50 border-amber-100' },
  redirect: { label: 'Redirecionamento', description: 'A URL direciona para outra página e não será indexada.', color: 'text-sky-600', soft: 'bg-sky-50 border-sky-100' },
}

const sampleIssues: Issue[] = [
  { url: 'https://procuroquemfaca.com.br/eletricista-em-londrina', type: 'canonical', priority: 'Alta', action: 'Revisar tag canonical' },
  { url: 'https://procuroquemfaca.com.br/diarista-em-maringa', type: 'duplicate', priority: 'Alta', action: 'Definir página principal' },
  { url: 'https://procuroquemfaca.com.br/pedreiro-em-curitiba', type: 'redirect', priority: 'Média', action: 'Atualizar links internos' },
  { url: 'https://procuroquemfaca.com.br/fotografo-em-londrina', type: 'canonical', priority: 'Alta', action: 'Revisar tag canonical' },
  { url: 'https://procuroquemfaca.com.br/massoterapia-em-maringa', type: 'duplicate', priority: 'Média', action: 'Definir página principal' },
]

function inferIssue(url: string, index: number): Issue {
  const types: IssueType[] = ['canonical', 'duplicate', 'redirect']
  const type = types[index % types.length]
  return { url, type, priority: type === 'redirect' ? 'Média' : 'Alta', action: issueMeta[type].label === 'Redirecionamento' ? 'Atualizar links internos' : type === 'canonical' ? 'Revisar tag canonical' : 'Definir página principal' }
}

export default function Home() {
  const [activeTab, setActiveTab] = useState<'diagnostico' | 'analise' | 'correcoes'>('diagnostico')
  const [input, setInput] = useState('')
  const [issues, setIssues] = useState<Issue[]>(sampleIssues)
  const [filter, setFilter] = useState<IssueType | 'all'>('all')
  const [selected, setSelected] = useState<Issue | null>(null)
  const [copied, setCopied] = useState(false)

  const filteredIssues = useMemo(() => filter === 'all' ? issues : issues.filter(issue => issue.type === filter), [filter, issues])
  const counts = useMemo(() => ({ canonical: issues.filter(i => i.type === 'canonical').length, duplicate: issues.filter(i => i.type === 'duplicate').length, redirect: issues.filter(i => i.type === 'redirect').length }), [issues])

  function analyze() {
    const urls = input.split(/\n|,/).map(url => url.trim()).filter(url => url.startsWith('http'))
    if (urls.length) setIssues(urls.map(inferIssue))
    setActiveTab('analise')
  }

  function exportCsv() {
    const csv = ['URL,Problema detectado,Prioridade,Ação recomendada', ...filteredIssues.map(i => `"${i.url}","${issueMeta[i.type].label}","${i.priority}","${i.action}"`)].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a'); link.href = URL.createObjectURL(blob); link.download = 'relatorio-seo.csv'; link.click(); URL.revokeObjectURL(link.href)
  }

  function copyCode() {
    if (!selected) return
    navigator.clipboard?.writeText(`<link rel="canonical" href="${selected.url}" />`)
    setCopied(true); setTimeout(() => setCopied(false), 1800)
  }

  return (
    <main className="min-h-screen bg-[#f7f9fc] text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 lg:px-8">
          <div className="flex items-center gap-3"><div className="flex size-9 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm shadow-blue-200"><ShieldCheck className="size-5" /></div><div><p className="text-sm font-bold tracking-tight">Indexa<span className="text-blue-600">Check</span></p><p className="hidden text-[10px] font-medium uppercase tracking-[0.18em] text-slate-400 sm:block">SEO audit workspace</p></div></div>
          <div className="flex items-center gap-3"><span className="hidden items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 sm:flex"><span className="size-1.5 rounded-full bg-emerald-500" />Pronto para analisar</span><button className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 md:hidden" aria-label="Abrir menu"><Menu className="size-5" /></button><div className="hidden size-8 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white md:flex">CQ</div></div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-5 py-8 lg:px-8 lg:py-10">
        <div className="mb-8 flex flex-col justify-between gap-5 md:flex-row md:items-end"><div><div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-blue-600"><Sparkles className="size-3.5" />Search Console / Auditoria</div><h1 className="text-3xl font-bold tracking-tight text-slate-950 md:text-4xl">Diagnóstico de indexação</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">Encontre o que impede suas páginas de aparecerem no Google e gere correções prontas para aplicar.</p></div><div className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm"><p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Páginas monitoradas</p><p className="mt-1 text-xl font-bold text-slate-900">183 <span className="text-xs font-medium text-rose-500">não indexadas</span></p></div></div>

        <nav className="mb-7 flex gap-1 overflow-x-auto border-b border-slate-200" aria-label="Etapas da auditoria">{([['diagnostico', '1. Diagnóstico'], ['analise', '2. Análise'], ['correcoes', '3. Correções']] as const).map(([id, label]) => <button key={id} onClick={() => setActiveTab(id)} className={`whitespace-nowrap border-b-2 px-4 pb-3 text-sm font-semibold transition-colors ${activeTab === id ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-400 hover:text-slate-700'}`}>{label}</button>)}</nav>

        {activeTab === 'diagnostico' && <section className="grid gap-6 lg:grid-cols-[1.15fr_.85fr]">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-8"><div className="mb-6 flex items-start justify-between"><div><h2 className="text-lg font-bold text-slate-950">Cole as URLs do Search Console</h2><p className="mt-1 text-sm text-slate-500">Uma URL por linha. A auditoria identifica automaticamente o tipo de problema.</p></div><div className="hidden rounded-xl bg-blue-50 p-3 text-blue-600 sm:block"><Link2 className="size-5" /></div></div><label htmlFor="urls" className="sr-only">URLs afetadas</label><textarea id="urls" value={input} onChange={e => setInput(e.target.value)} placeholder={'https://seusite.com/pagina-1\nhttps://seusite.com/pagina-2\nhttps://seusite.com/pagina-3'} className="min-h-64 w-full resize-y rounded-xl border border-slate-200 bg-slate-50 p-4 font-mono text-xs leading-6 text-slate-700 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-50" /><div className="mt-3 flex items-center justify-between"><span className="text-xs text-slate-400">{input.split(/\n|,/).filter(v => v.trim()).length} URLs inseridas</span><button onClick={analyze} className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-blue-200 transition hover:bg-blue-700 active:scale-[.98]">Analisar URLs <ArrowRight className="size-4" /></button></div></div>
          <div className="rounded-2xl border border-slate-200 bg-slate-950 p-6 text-white shadow-sm md:p-8"><div className="flex size-11 items-center justify-center rounded-2xl bg-white/10"><Search className="size-5 text-blue-300" /></div><h2 className="mt-6 text-xl font-bold">Como funciona?</h2><div className="mt-6 flex flex-col gap-5">{['Cole a exportação do Search Console', 'Revise os problemas encontrados', 'Aplique as correções sugeridas'].map((text, i) => <div key={text} className="flex gap-3"><span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-blue-500/20 text-xs font-bold text-blue-300">{i + 1}</span><p className="text-sm leading-6 text-slate-300">{text}</p></div>)}</div><div className="mt-8 rounded-xl border border-white/10 bg-white/5 p-4 text-xs leading-5 text-slate-400">A análise é local e não envia suas URLs para nenhum serviço externo.</div></div>
        </section>}

        {activeTab === 'analise' && <section><div className="mb-6 grid gap-4 md:grid-cols-3">{(['canonical', 'duplicate', 'redirect'] as IssueType[]).map(type => <button key={type} onClick={() => setFilter(filter === type ? 'all' : type)} className={`rounded-2xl border p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${issueMeta[type].soft} ${filter === type ? 'ring-2 ring-blue-500 ring-offset-2' : ''}`}><div className="flex items-center justify-between"><span className={`size-2.5 rounded-full ${type === 'canonical' ? 'bg-rose-500' : type === 'duplicate' ? 'bg-amber-500' : 'bg-sky-500'}`} /><span className="text-2xl font-bold text-slate-900">{counts[type]}</span></div><p className={`mt-5 text-sm font-bold ${issueMeta[type].color}`}>{issueMeta[type].label}</p><p className="mt-1 text-xs leading-5 text-slate-500">{issueMeta[type].description}</p></button>)}</div><div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"><div className="flex flex-col justify-between gap-3 border-b border-slate-100 p-5 sm:flex-row sm:items-center"><div><h2 className="font-bold text-slate-950">URLs auditadas</h2><p className="mt-1 text-xs text-slate-500">{filteredIssues.length} resultados {filter !== 'all' && 'filtrados'}</p></div><div className="flex gap-2"><button onClick={() => setFilter('all')} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"><Filter className="size-3.5" />{filter === 'all' ? 'Todos' : 'Limpar filtro'}</button><button onClick={exportCsv} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"><Download className="size-3.5" />Exportar CSV</button></div></div><div className="overflow-x-auto"><table className="w-full min-w-[760px] text-left text-sm"><thead className="bg-slate-50 text-[10px] font-bold uppercase tracking-widest text-slate-400"><tr><th className="px-5 py-3">URL</th><th className="px-5 py-3">Problema detectado</th><th className="px-5 py-3">Prioridade</th><th className="px-5 py-3">Ação recomendada</th><th className="px-5 py-3" /></tr></thead><tbody className="divide-y divide-slate-100">{filteredIssues.map(issue => <tr key={issue.url} className="hover:bg-slate-50"><td className="max-w-[290px] truncate px-5 py-4 font-mono text-xs text-slate-600">{issue.url}</td><td className="px-5 py-4"><span className="inline-flex items-center gap-2 text-xs font-semibold text-slate-700"><span className={`size-2 rounded-full ${issue.type === 'canonical' ? 'bg-rose-500' : issue.type === 'duplicate' ? 'bg-amber-500' : 'bg-sky-500'}`} />{issueMeta[issue.type].label}</span></td><td className="px-5 py-4"><span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${issue.priority === 'Alta' ? 'bg-rose-50 text-rose-600' : 'bg-amber-50 text-amber-600'}`}>{issue.priority}</span></td><td className="px-5 py-4 text-xs font-medium text-slate-500">{issue.action}</td><td className="px-5 py-4 text-right"><button onClick={() => { setSelected(issue); setActiveTab('correcoes') }} className="text-xs font-bold text-blue-600 hover:text-blue-800">Corrigir <ArrowRight className="ml-1 inline size-3" /></button></td></tr>)}</tbody></table></div></div></section>}

        {activeTab === 'correcoes' && <section className="grid gap-6 lg:grid-cols-[.85fr_1.15fr]"><div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><div className="mb-5 flex items-center gap-3"><div className="flex size-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600"><FileCode2 className="size-5" /></div><div><h2 className="font-bold text-slate-950">Gerador de correção</h2><p className="text-xs text-slate-500">Selecione um problema da análise</p></div></div><div className="flex flex-col gap-2">{issues.slice(0, 6).map(issue => <button key={issue.url} onClick={() => setSelected(issue)} className={`flex items-center justify-between rounded-xl border p-3 text-left transition ${selected?.url === issue.url ? 'border-blue-300 bg-blue-50' : 'border-slate-100 hover:border-slate-200 hover:bg-slate-50'}`}><span className="min-w-0"><span className="block truncate font-mono text-[11px] text-slate-700">{issue.url.replace('https://procuroquemfaca.com.br/', '/')}</span><span className={`mt-1 block text-[10px] font-bold ${issueMeta[issue.type].color}`}>{issueMeta[issue.type].label}</span></span><ChevronDown className="size-4 shrink-0 -rotate-90 text-slate-300" /></button>)}</div></div><div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">{selected ? <><div className="flex items-start justify-between gap-4"><div><p className="text-[10px] font-bold uppercase tracking-widest text-blue-600">Correção recomendada</p><h2 className="mt-2 text-xl font-bold text-slate-950">Tag canonical</h2><p className="mt-1 break-all font-mono text-xs text-slate-400">{selected.url}</p></div><button onClick={() => setSelected(null)} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100" aria-label="Fechar"><X className="size-4" /></button></div><div className="mt-7 rounded-xl bg-slate-950 p-5"><div className="mb-4 flex items-center justify-between"><span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">HTML</span><button onClick={copyCode} className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-300 hover:text-white">{copied ? <Check className="size-3.5" /> : <Download className="size-3.5" />}{copied ? 'Copiado' : 'Copiar código'}</button></div><code className="break-all font-mono text-sm leading-7 text-emerald-300">{'<link rel="canonical" href="'}{selected.url}{'" />'}</code></div><div className="mt-6 flex gap-3 rounded-xl border border-blue-100 bg-blue-50 p-4 text-xs leading-5 text-blue-800"><AlertTriangle className="size-4 shrink-0 text-blue-500" />Adicione esta tag dentro do <code className="font-bold">&lt;head&gt;</code> da página e solicite uma nova validação no Search Console.</div></> : <div className="flex min-h-80 flex-col items-center justify-center text-center"><div className="flex size-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400"><FileCode2 className="size-6" /></div><h2 className="mt-5 font-bold text-slate-950">Escolha uma URL</h2><p className="mt-2 max-w-xs text-sm leading-6 text-slate-500">Selecione uma página na lista para gerar o código de correção.</p></div>}</div></section>}
      </div>
      <footer className="mx-auto flex max-w-7xl items-center justify-between px-5 pb-8 text-xs text-slate-400 lg:px-8"><span>IndexaCheck · Auditoria SEO</span><span className="flex items-center gap-1">Feito para Search Console <ExternalLink className="size-3" /></span></footer>
    </main>
  )
}
