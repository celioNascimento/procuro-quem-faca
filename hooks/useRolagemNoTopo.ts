// hooks/useRolagemNoTopo.ts
//
// Telas de acompanhamento (token) abrem sempre no topo: desliga a restauração automática do navegador
// enquanto a tela está aberta e DEVOLVE o valor anterior ao sair. Antes ficava em "manual" para o resto do
// site depois da primeira visita.
'use client'

import { useEffect } from 'react'

export function useRolagemNoTopo(chave?: unknown) {
  useEffect(() => {
    const anterior = window.history.scrollRestoration
    window.history.scrollRestoration = 'manual'

    const irParaTopo = () => window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
    irParaTopo()
    let segundo = 0
    const primeiro = requestAnimationFrame(() => {
      irParaTopo()
      segundo = requestAnimationFrame(irParaTopo)
    })

    return () => {
      cancelAnimationFrame(primeiro)
      cancelAnimationFrame(segundo)
      window.history.scrollRestoration = anterior
    }
  }, [chave])
}
