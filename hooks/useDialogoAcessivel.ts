// hooks/useDialogoAcessivel.ts
//
// Comportamento de teclado e foco de uma caixa de diálogo: Esc fecha, Tab fica preso dentro, o foco vai
// para o primeiro botão ao abrir e volta para quem abriu ao fechar, e a página atrás não rola.
'use client'

import { useEffect, type RefObject } from 'react'

const FOCAVEIS = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

export function useDialogoAcessivel(
  ref: RefObject<HTMLElement | null>,
  aberto: boolean,
  aoFechar: () => void,
) {
  useEffect(() => {
    if (!aberto) return
    const anterior = document.activeElement as HTMLElement | null
    const overflowAnterior = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    ref.current?.querySelector<HTMLElement>(FOCAVEIS)?.focus()

    function aoTeclar(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.stopPropagation()
        aoFechar()
        return
      }
      if (e.key !== 'Tab' || !ref.current) return
      const itens = Array.from(ref.current.querySelectorAll<HTMLElement>(FOCAVEIS))
      if (itens.length === 0) return
      const primeiro = itens[0]
      const ultimo = itens[itens.length - 1]
      if (e.shiftKey && document.activeElement === primeiro) { e.preventDefault(); ultimo.focus() }
      else if (!e.shiftKey && document.activeElement === ultimo) { e.preventDefault(); primeiro.focus() }
    }

    document.addEventListener('keydown', aoTeclar)
    return () => {
      document.removeEventListener('keydown', aoTeclar)
      document.body.style.overflow = overflowAnterior
      anterior?.focus?.()
    }
    // aoFechar fica de fora de propósito: quem chama costuma passar uma função nova a cada render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aberto, ref])
}
