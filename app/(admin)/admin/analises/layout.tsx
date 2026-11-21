// app/(admin)/admin/analises/layout.tsx
// Análises: uma tela só para Resumo (tráfego), Cliques no WhatsApp e Atividade (registro de eventos).
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { ReactNode } from 'react'
import { PageHeader } from '@/components/admin/ui'

const ABAS_ANALISES = [
  { href: '/admin/analises', rotulo: 'Resumo' },
  { href: '/admin/analises/cliques', rotulo: 'Cliques' },
  { href: '/admin/analises/atividade', rotulo: 'Atividade' },
  { href: '/admin/analises/historico', rotulo: 'Histórico' },
]

export default function AnalisesLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 px-4 pb-20 md:px-6">
      <PageHeader titulo="Análises" descricao="Quem visita, quem clica no WhatsApp, o que acontece na plataforma e o que a equipe fez." />
      <nav aria-label="Abas de Análises" className="flex flex-wrap gap-2">
        {ABAS_ANALISES.map((aba) => {
          const ativa = pathname === aba.href
          return (
            <Link
              key={aba.href}
              href={aba.href}
              aria-current={ativa ? 'page' : undefined}
              className={`inline-flex min-h-10 items-center rounded-lg px-4 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pqf-blue ${
                ativa ? 'bg-pqf-blue text-white' : 'border border-slate-200 bg-white text-slate-600 hover:border-pqf-blue hover:text-pqf-blue'
              }`}
            >
              {aba.rotulo}
            </Link>
          )
        })}
      </nav>
      {children}
    </div>
  )
}
