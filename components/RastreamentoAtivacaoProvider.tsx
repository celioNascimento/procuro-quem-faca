//components/RastreamentoAtivacaoProvider.tsx 

'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { useRastreamentoAtivacao } from '@/hooks/useRastreamentoAtivacao'
import type { PrestadorPerfil } from '@/types/perfil'

function RastreamentoAtivacao({ prestador }: { prestador: PrestadorPerfil | null }) {
  const searchParams = useSearchParams()
  const srcParam = searchParams?.get('src') ?? null

  useRastreamentoAtivacao(prestador, srcParam)

  return null
}

export function RastreamentoAtivacaoProvider({
  prestador,
}: {
  prestador: PrestadorPerfil | null
}) {
  return (
    <Suspense fallback={null}>
      <RastreamentoAtivacao prestador={prestador} />
    </Suspense>
  )
}