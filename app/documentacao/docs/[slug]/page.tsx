import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, BookOpen } from 'lucide-react'
import { readFile } from 'node:fs/promises'
import path from 'node:path'

const documentosPermitidos = new Set([
  '02-arquitetura',
  '15-catalogo-funcoes',
  '12-admin',
])

function renderMarkdown(conteudo: string) {
  const blocos: React.ReactNode[] = []
  let emCodigo = false
  let codigo: string[] = []
  let lista: string[] = []

  const descarregarLista = () => {
    if (lista.length > 0) {
      blocos.push(
        <ul key={`list-${blocos.length}`} className="list-disc space-y-2 pl-5 text-sm leading-7 text-slate-600">
          {lista.map((item, index) => <li key={`${item}-${index}`}>{item}</li>)}
        </ul>,
      )
      lista = []
    }
  }

  conteudo.split('\n').forEach((linha, index) => {
    if (linha.trim().startsWith('```')) {
      descarregarLista()
      if (emCodigo) {
        blocos.push(<pre key={`code-${index}`} className="overflow-x-auto rounded-2xl bg-slate-950 p-5 text-xs leading-6 text-slate-200"><code>{codigo.join('\n')}</code></pre>)
        codigo = []
      }
      emCodigo = !emCodigo
      return
    }

    if (emCodigo) {
      codigo.push(linha)
      return
    }

    if (linha.startsWith('- ')) {
      lista.push(linha.slice(2))
      return
    }

    descarregarLista()
    if (!linha.trim()) return
    if (linha.startsWith('# ')) blocos.push(<h1 key={index} className="text-3xl font-black tracking-tight text-slate-900">{linha.slice(2)}</h1>)
    else if (linha.startsWith('## ')) blocos.push(<h2 key={index} className="border-b border-slate-200 pb-2 pt-6 text-xl font-black text-slate-900">{linha.slice(3)}</h2>)
    else if (linha.startsWith('### ')) blocos.push(<h3 key={index} className="pt-4 text-base font-black text-slate-900">{linha.slice(4)}</h3>)
    else blocos.push(<p key={index} className="text-sm leading-7 text-slate-600">{linha}</p>)
  })

  descarregarLista()
  return blocos
}

export default async function DocumentoAdminPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  if (!documentosPermitidos.has(slug)) notFound()

  const arquivo = path.join(process.cwd(), 'documentacao', 'docs', `${slug}.md`)
  let conteudo: string
  try {
    conteudo = await readFile(arquivo, 'utf8')
  } catch {
    notFound()
  }

  return (
    <article className="mx-auto max-w-4xl space-y-6">
      <Link href="/admin/documentacao" className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-wider text-blue-600 hover:text-blue-800">
        <ArrowLeft size={14} aria-hidden="true" /> Voltar para documentação
      </Link>
      <header className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
        <div className="mb-4 flex size-10 items-center justify-center rounded-2xl bg-blue-50 text-blue-600"><BookOpen size={18} /></div>
        <div className="flex flex-col gap-4">{renderMarkdown(conteudo)}</div>
      </header>
    </article>
  )
}
