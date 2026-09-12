'use client'

import { Suspense } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { HelpArticle, HelpCenter } from '@/components/help/HelpCenter'

function AjudaContent() {
  const router = useRouter()
  const params = useSearchParams()
  const artigo = params.get('artigo')
  const contexto = params.get('contexto') || undefined
  const audience = params.get('publico') === 'prestador' ? 'prestador' : 'cliente'
  const isPrestador = audience === 'prestador'

  function voltar() {
    if (window.history.length > 1) router.back()
    else router.push('/')
  }

  return <main className="min-h-screen bg-[#F8FAFC] px-4 py-10 text-slate-900 sm:px-6 sm:py-16"><div className="mx-auto max-w-4xl"><header className="mb-10"><div className="flex flex-wrap items-center justify-between gap-4"><button type="button" onClick={voltar} className="inline-flex min-h-10 items-center rounded-xl bg-white px-4 py-2 text-xs font-black uppercase tracking-wider text-slate-600 shadow-sm ring-1 ring-slate-200 transition hover:text-blue-600 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-100">← Voltar</button><Link href="/" aria-label="Ir para a página inicial" className="inline-flex items-center"><Image src="/logo.png" alt="Procuro Quem Faça" width={164} height={42} className="h-auto w-36 object-contain sm:w-40" priority /></Link></div><p className="mt-8 text-[10px] font-black uppercase tracking-[0.25em] text-blue-600">Ajuda para {isPrestador ? 'prestadores' : 'clientes'}</p><h1 className="mt-2 text-4xl font-black tracking-tight sm:text-5xl">Como podemos ajudar?</h1><p className="mt-4 max-w-2xl text-base leading-7 text-slate-500">{isPrestador ? 'Encontre respostas para organizar seu perfil, portfólio e avaliações profissionais.' : 'Encontre respostas rápidas para buscar profissionais, acompanhar serviços e usar sua conta com segurança.'}</p></header>{artigo ? <HelpArticle id={artigo} /> : <HelpCenter audience={audience} context={contexto} />}</div></main>
}

export default function AjudaPage() {
  return (
    <Suspense fallback={<main className="min-h-screen bg-[#F8FAFC]" aria-busy="true" />}>
      <AjudaContent />
    </Suspense>
  )
}
