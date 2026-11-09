'use client'
// hooks/useRestaurarScroll.ts
//
// Lista de resultados: guarda a rolagem enquanto o usuário navega e a devolve quando
// ele volta (botão voltar do navegador ou seta do app) de um perfil. Visita nova
// começa no topo. `pronto` = conteúdo já renderizado (sem skeleton).

import { useEffect, useRef } from 'react'
import { consumirScrollSalvo, salvarScroll } from '@/lib/navegacao'

export function useRestaurarScroll(pronto: boolean) {
  const alvo = useRef<number | null>(null)

  useEffect(() => {
    // StrictMode roda o efeito duas vezes; só aceita valor novo para não perder o primeiro.
    const salvo = consumirScrollSalvo()
    if (salvo !== null) alvo.current = salvo

    let raf = 0
    const aoRolar = () => {
      if (alvo.current !== null) return // aguardando restaurar: não sobrescreve com 0
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(salvarScroll)
    }

    window.addEventListener('scroll', aoRolar, { passive: true })
    return () => {
      window.removeEventListener('scroll', aoRolar)
      cancelAnimationFrame(raf)
    }
  }, [])

  useEffect(() => {
    if (!pronto || alvo.current === null) return
    const y = alvo.current
    alvo.current = null
    // Espera o layout dos cards antes de rolar.
    requestAnimationFrame(() => window.scrollTo({ top: y, behavior: 'instant' }))
  }, [pronto])
}
