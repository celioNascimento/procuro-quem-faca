'use client'

import Link from 'next/link'
import { BookOpen, Code2, ExternalLink, Search } from 'lucide-react'

const sections = [
  { title: 'Arquitetura', description: 'Organização das rotas, componentes, hooks e serviços.', href: '/documentacao/docs/02-arquitetura.md' },
  { title: 'Catálogo de funções', description: 'Índice de funções, callbacks e correlações do projeto.', href: '/documentacao/docs/15-catalogo-funcoes.md' },
  { title: 'Operação administrativa', description: 'Fluxos e responsabilidades da área administrativa.', href: '/documentacao/docs/12-admin.md' },
]

export default function AdminDocumentacaoPage() {
  return <div className="space-y-8"><header><p className="text-[10px] font-black uppercase tracking-[0.25em] text-blue-600">Base interna</p><h1 className="mt-2 text-3xl font-black tracking-tight text-slate-900">Documentação do projeto</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">Consulte arquitetura, funções e fluxos sem sair do console. Os documentos técnicos completos permanecem versionados na pasta <code className="rounded bg-slate-100 px-1">documentacao/</code>.</p></header><div className="relative max-w-2xl"><Search className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-slate-400" aria-hidden="true" /><input aria-label="Buscar documentação" placeholder="Busque por arquitetura, função ou fluxo..." className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-11 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100" /></div><div className="grid gap-4 md:grid-cols-3">{sections.map((section) => <Link key={section.title} href={section.href} className="group rounded-3xl border border-slate-100 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md"><div className="mb-5 flex size-10 items-center justify-center rounded-2xl bg-blue-50 text-blue-600"><BookOpen size={18} /></div><h2 className="font-black text-slate-900">{section.title}</h2><p className="mt-2 text-sm leading-6 text-slate-500">{section.description}</p><span className="mt-5 inline-flex items-center gap-2 text-xs font-black uppercase tracking-wider text-blue-600">Abrir documento <ExternalLink size={13} /></span></Link>)}</div><div className="rounded-3xl border border-slate-200 bg-slate-900 p-6 text-white"><div className="flex items-start gap-4"><Code2 className="mt-1 text-blue-300" size={20} /><div><h2 className="font-black">Ajuda do usuário</h2><p className="mt-1 text-sm leading-6 text-slate-300">A central pública para clientes está disponível em <Link href="/ajuda" className="font-bold text-blue-300 underline">/ajuda</Link>. Use os artigos contextuais para orientar dúvidas sem expor detalhes internos.</p></div></div></div></div>
}
