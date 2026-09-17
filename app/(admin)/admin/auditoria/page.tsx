'use client'

import { FormEvent, useMemo, useState } from 'react'
import Link from 'next/link'

interface AuditResult {
  url: string
  status: 'ok' | 'attention'
  message: string
}

function auditUrl(value: string): AuditResult {
  try {
    const url = new URL(value)
    const secure = url.protocol === 'https:'
    const canonicalPath = url.pathname === '/' ? '/' : url.pathname.replace(/\/$/, '')

    return {
      url: value,
      status: secure ? 'ok' : 'attention',
      message: secure
        ? `URL válida para rastreamento · canonical sugerida: ${canonicalPath}`
        : 'Use HTTPS para uma versão pública indexável',
    }
  } catch {
    return {
      url: value,
      status: 'attention',
      message: 'URL inválida. Informe uma URL completa, incluindo https://',
    }
  }
}

export default function AuditoriaPage() {
  const [input, setInput] = useState('')
  const [results, setResults] = useState<AuditResult[]>([])

  const validCount = useMemo(
    () => results.filter((result) => result.status === 'ok').length,
    [results],
  )

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const urls = input
      .split('\n')
      .map((url) => url.trim())
      .filter(Boolean)
      .slice(0, 183)

    setResults(urls.map(auditUrl))
  }

  return (
    <main className="min-h-screen bg-[#f8fafc] px-4 py-8 text-slate-900 md:px-8">
      <div className="mx-auto flex max-w-5xl flex-col gap-6">
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-blue-600">Administração</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight">Auditoria de indexação</h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-500">
              Ferramenta interna para conferir rapidamente as URLs do sitemap sem alterar a home pública.
            </p>
          </div>
          <Link href="/admin" className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 hover:border-blue-300 hover:text-blue-600">
            Voltar ao admin
          </Link>
        </header>

        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm md:p-7">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <label htmlFor="audit-urls" className="text-sm font-bold text-slate-800">
              URLs para auditar
            </label>
            <textarea
              id="audit-urls"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder={'https://procuroquemfaca.com.br/eletricista-em-londrina\nhttps://procuroquemfaca.com.br/diarista-em-maringa'}
              rows={8}
              className="w-full resize-y rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 font-mono text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            />
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-xs text-slate-400">Uma URL por linha · limite de 183 URLs</p>
              <button type="submit" className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-blue-200 transition hover:bg-blue-700">
                Auditar URLs
              </button>
            </div>
          </form>
        </section>

        {results.length > 0 && (
          <section className="flex flex-col gap-4">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Resultado</p>
                <h2 className="mt-1 text-xl font-bold">{results.length} URLs auditadas</h2>
              </div>
              <p className="text-sm font-semibold text-emerald-600">{validCount} prontas para rastreamento</p>
            </div>
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
              {results.map((result) => (
                <div key={result.url} className="flex flex-col gap-2 border-b border-slate-100 p-4 last:border-b-0 md:flex-row md:items-center md:justify-between">
                  <p className="break-all font-mono text-xs text-slate-700">{result.url}</p>
                  <p className={result.status === 'ok' ? 'text-xs font-semibold text-emerald-600' : 'text-xs font-semibold text-amber-600'}>
                    {result.message}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  )
}
