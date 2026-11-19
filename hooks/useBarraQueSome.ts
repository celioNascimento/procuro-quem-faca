// hooks/useBarraQueSome.ts
//
// Barra fixa que SOME ao rolar para baixo e VOLTA ao rolar para cima (ou ao chegar perto do topo).
// Libera a tela para as fotos enquanto a pessoa lê e, ao subir um pouco, o filtro está de novo à mão.
// `folga` evita que um tremidinha do dedo faça a barra piscar; `mostrar` serve para o teclado (foco dentro da barra).
'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

interface Opcoes { limiteTopo?: number; folga?: number }

export function useBarraQueSome({ limiteTopo = 80, folga = 8 }: Opcoes = {}) {
  const [visivel, setVisivel] = useState(true)
  const ultimo = useRef(0)

  useEffect(() => {
    ultimo.current = window.scrollY
    function aoRolar() {
      const y = window.scrollY
      const delta = y - ultimo.current
      if (y < limiteTopo) setVisivel(true)
      else if (delta > folga) setVisivel(false)
      else if (delta < -folga) setVisivel(true)
      else return // movimento pequeno: guarda a referência e espera um movimento maior
      ultimo.current = y
    }
    window.addEventListener('scroll', aoRolar, { passive: true })
    return () => window.removeEventListener('scroll', aoRolar)
  }, [limiteTopo, folga])

  const mostrar = useCallback(() => setVisivel(true), [])
  return { visivel, mostrar }
}
