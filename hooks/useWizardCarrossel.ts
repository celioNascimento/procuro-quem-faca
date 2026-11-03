// hooks/useWizardCarrossel.ts
//
// Carrossel das 3 etapas de fotos do wizard de projeto (início, execução,
// conclusão). O índice do slide (currentSlide) continua em useUploadWizard
// porque outros efeitos dele dependem do slide atual.

import { useMemo, type Dispatch, type SetStateAction, type MouseEvent } from 'react'

export function useWizardCarrossel(
  fotosUrls: Record<number, string | null>,
  currentSlide: number,
  setCurrentSlide: Dispatch<SetStateAction<number>>,
) {
  // Memoizado: antes era recalculado a cada render, gerando nova referência de
  // array que disparava efeitos de slide/comentários desnecessariamente.
  const fotosCarrossel = useMemo(() => [
    { etapa: 1, url: fotosUrls[1], label: 'Início' },
    { etapa: 2, url: fotosUrls[2], label: 'Execução' },
    { etapa: 3, url: fotosUrls[3], label: 'Conclusão' },
  ].filter(f => f.url), [fotosUrls])

  const fotoAtual = fotosCarrossel[currentSlide] || {}

  const nextSlide = (e?: MouseEvent) => {
    e?.stopPropagation()
    setCurrentSlide((prev) => (prev + 1) % fotosCarrossel.length)
  }

  const prevSlide = (e?: MouseEvent) => {
    e?.stopPropagation()
    setCurrentSlide((prev) => (prev - 1 + fotosCarrossel.length) % fotosCarrossel.length)
  }

  return { fotosCarrossel, fotoAtual, nextSlide, prevSlide }
}
