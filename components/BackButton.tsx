//components/BackButton.tsx

'use client'
import { useVoltar } from '@/hooks/useVoltar'

import type { BackButtonProps } from './BackButton.types'

// `href` é só o destino de segurança: usado quando não há página anterior do app
// (link aberto direto, nova aba). Com histórico, o botão volta de verdade.
export default function BackButton({ href }: BackButtonProps) {
  const voltar = useVoltar(href)

  return (
    <button
      type="button"
      onClick={voltar}
      aria-label="Voltar"
      className="size-11 flex items-center justify-center rounded-xl border border-slate-100 bg-white text-slate-500 hover:text-blue-600 hover:border-blue-100 hover:shadow-sm transition-all active:scale-95"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={3}
        stroke="currentColor"
        className="w-4 h-4 md:w-5 md:h-5"
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
      </svg>
    </button>
  )
}
