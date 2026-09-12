'use client'

import { Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { HelpArticle, HelpCenter } from '@/components/help/HelpCenter'

function AjudaContent() {
  const params = useSearchParams()
  const artigo = params.get('artigo')
  const contexto = params.get('contexto') || undefined

  return <main className="min-h-screen bg-[#F8FAFC] px-4 py-10 text-slate-900 sm:px-6 sm:py-16"><div className="mx-auto max-w-4xl"><header className="mb-10"><Link href="/" className="text-xs font-black uppercase tracking-widest text-blue-600">Procuro Quem Faça</Link><p className="mt-8 text-[10px] font-black uppercase tracking-[0.25em] text-blue-600">Ajuda para clientes</p><h1 className="mt-2 text-4xl font-black tracking-tight sm:text-5xl">Como podemos ajudar?</h1><p className="mt-4 max-w-2xl text-base leading-7 text-slate-500">Encontre respostas rápidas para buscar profissionais, acompanhar serviços e usar sua conta com segurança.</p></header>{artigo ? <HelpArticle id={artigo} /> : <HelpCenter audience="cliente" context={contexto} />}</div></main>
}

export default function AjudaPage() {
  return (
    <Suspense fallback={<main className="min-h-screen bg-[#F8FAFC]" aria-busy="true" />}>
      <AjudaContent />
    </Suspense>
  )
}
