'use client'

import Link from 'next/link'

/**
 * Componente de botão de voltar reutilizável
 * @param {string} href - O destino do link (padrão é "/")
 * @param {string} className - Classes extras para personalizar o estilo
 */
export default function BackButton({ href = "/", className = "" }) {
  return (
    <Link 
      href={href} 
      className={`w-12 h-12 bg-white border border-slate-200 rounded-2xl flex items-center justify-center text-slate-600 hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-all shadow-sm active:scale-90 ${className}`}
      aria-label="Voltar para a página anterior"
    >
      <svg 
        xmlns="http://www.w3.org/2000/svg" 
        className="h-6 w-6" 
        fill="none" 
        viewBox="0 0 24 24" 
        stroke="currentColor"
      >
        <path 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          strokeWidth={3} 
          d="M15 19l-7-7 7-7" 
        />
      </svg>
    </Link>
  )
}