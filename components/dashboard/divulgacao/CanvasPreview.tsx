// components/dashboard/divulgacao/CanvasPreview.tsx
'use client'
import { useEffect, useRef } from 'react'

interface Props {
  desenhar: (canvas: HTMLCanvasElement) => void
  /** Recebe o canvas real (resolução total) para download/impressão. */
  onCanvas?: (canvas: HTMLCanvasElement | null) => void
  rotulo: string
  className?: string
}

export function CanvasPreview({ desenhar, onCanvas, rotulo, className = '' }: Props) {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    desenhar(canvas)
    onCanvas?.(canvas)
    return () => onCanvas?.(null)
  }, [desenhar, onCanvas])

  return (
    <canvas
      ref={ref}
      role="img"
      aria-label={rotulo}
      className={`h-auto w-full rounded-2xl border border-slate-200 bg-white shadow-sm ${className}`}
    />
  )
}
