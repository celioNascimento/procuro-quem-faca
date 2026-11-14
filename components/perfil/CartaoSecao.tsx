// components/perfil/CartaoSecao.tsx
//
// Casca única das seções de "Dados profissionais" e do /cadastro: mesmo cartão,
// mesmo título, mesmo espaçamento. Assim cada seção só cuida do seu conteúdo.

import { useId, type ReactNode } from 'react'

/** Estilo único dos campos de texto/seleção do perfil (dashboard e cadastro). */
export const estiloCampo =
  'w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-base font-medium text-slate-800 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-50 disabled:bg-slate-50 disabled:text-slate-400 sm:text-[15px]'

interface CartaoSecaoProps {
  titulo: string
  descricao?: string
  icone?: ReactNode
  children: ReactNode
  className?: string
}

export function CartaoSecao({ titulo, descricao, icone, children, className = '' }: CartaoSecaoProps) {
  const tituloId = useId()
  return (
    <section
      aria-labelledby={tituloId}
      className={`flex flex-col gap-5 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6 ${className}`}
    >
      <header className="flex items-start gap-3">
        {icone && (
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600" aria-hidden="true">
            {icone}
          </span>
        )}
        <div className="min-w-0">
          <h2 id={tituloId} className="text-base font-black tracking-tight text-slate-900 sm:text-lg">{titulo}</h2>
          {descricao && <p className="mt-0.5 text-sm leading-relaxed text-slate-500">{descricao}</p>}
        </div>
      </header>
      {children}
    </section>
  )
}

interface CampoProps {
  id: string
  rotulo: string
  dica?: string
  opcional?: boolean
  children: ReactNode
  className?: string
}

/** Rótulo sempre visível acima do campo (o texto de exemplo some quando a pessoa digita). */
export function Campo({ id, rotulo, dica, opcional = false, children, className = '' }: CampoProps) {
  return (
    <div className={`flex min-w-0 flex-col gap-1.5 ${className}`}>
      <label htmlFor={id} className="text-sm font-bold text-slate-700">
        {rotulo}
        {opcional && <span className="ml-1.5 text-xs font-semibold text-slate-400">(opcional)</span>}
      </label>
      {children}
      {dica && <p className="text-xs leading-relaxed text-slate-500">{dica}</p>}
    </div>
  )
}
