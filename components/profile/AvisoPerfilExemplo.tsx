// components/profile/AvisoPerfilExemplo.tsx
//
// Faixa no topo do perfil de exemplo (divulgação): deixa claro que é uma demonstração e que as
// imagens são ilustrativas, e convida o profissional a criar o próprio perfil.

import Link from 'next/link'
import { Sparkles } from 'lucide-react'

export function AvisoPerfilExemplo() {
  return (
    <div
      data-testid="aviso-perfil-exemplo"
      className="flex flex-col gap-3 rounded-2xl border border-blue-100 bg-blue-50/70 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
    >
      <p className="flex items-start gap-2 text-sm font-semibold text-blue-900">
        <Sparkles className="mt-0.5 size-4 shrink-0 text-blue-600" aria-hidden="true" />
        <span>
          Perfil de exemplo. Os trabalhos e as imagens são ilustrativos: é assim que o seu perfil pode ficar.
        </span>
      </p>
      <Link
        href="/cadastro"
        className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-xl bg-blue-600 px-4 text-sm font-bold text-white transition-colors hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-200"
      >
        Criar meu perfil grátis
      </Link>
    </div>
  )
}
