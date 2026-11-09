'use client'
// components/NavegacaoTracker.tsx
//
// Marca quando a navegação veio do botão voltar/avançar do navegador (popstate),
// para que as telas possam restaurar a rolagem. Montado uma vez no layout raiz.

import { useEffect } from 'react'
import { marcarNavegacaoPorHistorico } from '@/lib/navegacao'

export default function NavegacaoTracker() {
  useEffect(() => {
    window.addEventListener('popstate', marcarNavegacaoPorHistorico)
    return () => window.removeEventListener('popstate', marcarNavegacaoPorHistorico)
  }, [])

  return null
}
