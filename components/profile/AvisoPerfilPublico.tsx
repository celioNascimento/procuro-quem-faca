// components/profile/AvisoPerfilPublico.tsx
//
// Faixa no topo do perfil montado com dados públicos de contato (origem "curadoria_publica").
// Deixa claro de onde vêm as informações e oferece o caminho para o dono assumir o perfil.
// Some sozinha quando o perfil é reivindicado (a origem deixa de ser curadoria).

import Link from 'next/link'
import { Info } from 'lucide-react'

interface Props {
  prestadorId: string | number
  nome: string
}

export default function AvisoPerfilPublico({ prestadorId, nome }: Props) {
  const href = `/reivindicar?id=${prestadorId}&nome=${encodeURIComponent(nome)}`

  return (
    <aside
      aria-label="Origem das informações deste perfil"
      className="flex flex-wrap items-center gap-x-4 gap-y-1 rounded-2xl border border-blue-100 bg-blue-50/60 px-4 py-2.5"
    >
      <p className="flex min-w-0 flex-1 basis-64 items-start gap-2.5 text-sm leading-snug text-slate-700">
        <Info size={18} className="mt-0.5 shrink-0 text-blue-600" aria-hidden="true" />
        <span>Perfil montado com dados públicos de contato.</span>
      </p>
      <Link
        href={href}
        className="-my-1 inline-flex min-h-11 items-center rounded-lg text-sm font-bold text-blue-600 underline-offset-4 hover:text-blue-700 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
      >
        É o seu? Assuma o perfil
      </Link>
    </aside>
  )
}
