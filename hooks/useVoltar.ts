'use client'
// hooks/useVoltar.ts
//
// Ação de "voltar" padrão do app: desfaz a navegação quando há histórico do app,
// senão leva ao fallback. Veja lib/navegacao.ts.

import { useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { voltarOuIr } from '@/lib/navegacao'

export function useVoltar(fallback: string = '/') {
  const router = useRouter()
  return useCallback(() => voltarOuIr(router, fallback), [router, fallback])
}
