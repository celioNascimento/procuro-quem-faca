// app/titular/page.tsx
//
// Pedidos do titular de dados (LGPD). Aceita ?perfil=ID&nome=... para vir ligado a um perfil.

'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Header from '@/components/Header'
import { FormularioTitular } from '@/components/titular/FormularioTitular'

function Conteudo() {
  const params = useSearchParams()
  const id = Number(params.get('perfil'))
  const prestadorId = Number.isInteger(id) && id > 0 ? id : null
  const nome = prestadorId ? params.get('nome') : null

  return (
    <div className="mx-auto max-w-xl space-y-8 px-6 py-10">
      <div className="space-y-3 text-center">
        <h1 className="text-3xl font-black tracking-tight text-slate-900">Seus dados, sua decisão</h1>
        <p className="text-sm leading-relaxed text-slate-500">
          Peça para excluir, corrigir ou conhecer os dados que tratamos sobre você. Se o seu perfil foi criado pelo PQF a partir de informações públicas, veja o que acontece na{' '}
          <Link href="/privacidade" className="font-bold text-blue-600 underline">Política de Privacidade</Link>.
        </p>
      </div>
      <FormularioTitular prestadorId={prestadorId} prestadorNome={nome} tipoInicial={prestadorId ? 'correcao' : 'exclusao'} />
    </div>
  )
}

export default function PaginaTitular() {
  return (
    <main className="min-h-screen bg-[#FDFDFD] pt-32 md:pt-22 font-sans">
      <Header href="/" />
      <Suspense fallback={null}>
        <Conteudo />
      </Suspense>
    </main>
  )
}
