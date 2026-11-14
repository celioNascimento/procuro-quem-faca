//components/shared/ModalFotoBase.tsx
//
// Moldura dos modais de foto: foto à esquerda (em cima no celular) e um espaço livre para o conteúdo.
// É um diálogo de verdade: anunciado como tal, fecha com Esc, com o botão (um só, sobre a foto, de 44 px)
// ou tocando fora; o foco fica dentro dele e volta para onde estava; a página atrás não rola. Com mais de
// uma foto, as setas do teclado e o arrastar com o dedo trocam de foto.
'use client'

import { X, ChevronLeft, ChevronRight } from 'lucide-react'
import { useEffect, useRef, type ReactNode, type MouseEvent, type TouchEvent } from 'react'

interface Navegacao {
  onPrev: (e?: MouseEvent) => void
  onNext: (e?: MouseEvent) => void
}

interface Props {
  fotoUrl: string
  ordemLabel: string
  /** Nome do diálogo para leitores de tela. Sem ele, usa o texto do rótulo da foto. */
  titulo?: string
  onClose?: () => void
  navegacao?: Navegacao
  compact?: boolean
  imageOnly?: boolean
  children?: ReactNode
}

const FOCAVEIS = 'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), summary, [tabindex]:not([tabindex="-1"])'
// Distância mínima (px) do arrastar para valer como troca de foto.
const DISTANCIA_DO_TOQUE = 50

export function ModalFotoBase({ fotoUrl, ordemLabel, titulo, onClose, navegacao, compact = false, imageOnly = false, children }: Props) {
  const dialogoRef = useRef<HTMLDivElement>(null)
  const botaoFecharRef = useRef<HTMLButtonElement>(null)
  const inicioDoToque = useRef<{ x: number; y: number } | null>(null)
  // Ao abrir: trava a rolagem da página e leva o foco ao botão de fechar; ao fechar, devolve tudo como estava.
  useEffect(() => {
    const anterior = document.activeElement as HTMLElement | null
    const overflowAnterior = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    botaoFecharRef.current?.focus()
    return () => {
      document.body.style.overflow = overflowAnterior
      anterior?.focus?.()
    }
  }, [])

  // Teclado: Esc fecha, setas trocam de foto e Tab fica dentro do diálogo. Sem lista de dependências de
  // propósito: refaz o ouvinte a cada renderização para usar sempre o onClose e a navegação atuais.
  useEffect(() => {
    const ouvinte = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && onClose) {
        e.stopPropagation()
        onClose()
        return
      }
      if (e.key === 'ArrowLeft' && navegacao) navegacao.onPrev()
      if (e.key === 'ArrowRight' && navegacao) navegacao.onNext()
      if (e.key === 'Tab' && dialogoRef.current) {
        const itens = Array.from(dialogoRef.current.querySelectorAll<HTMLElement>(FOCAVEIS))
        if (itens.length === 0) return
        const primeiro = itens[0]
        const ultimo = itens[itens.length - 1]
        const ativo = document.activeElement
        const dentro = dialogoRef.current.contains(ativo)
        if (e.shiftKey && (ativo === primeiro || !dentro)) {
          e.preventDefault()
          ultimo.focus()
        } else if (!e.shiftKey && (ativo === ultimo || !dentro)) {
          e.preventDefault()
          primeiro.focus()
        }
      }
    }
    document.addEventListener('keydown', ouvinte)
    return () => document.removeEventListener('keydown', ouvinte)
  })

  const aoComecarToque = (e: TouchEvent) => {
    const t = e.touches[0]
    inicioDoToque.current = t ? { x: t.clientX, y: t.clientY } : null
  }

  const aoTerminarToque = (e: TouchEvent) => {
    const inicio = inicioDoToque.current
    inicioDoToque.current = null
    const t = e.changedTouches[0]
    if (!inicio || !t || !navegacao) return
    const dx = t.clientX - inicio.x
    const dy = t.clientY - inicio.y
    if (Math.abs(dx) < DISTANCIA_DO_TOQUE || Math.abs(dx) < Math.abs(dy)) return
    if (dx < 0) navegacao.onNext()
    else navegacao.onPrev()
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={titulo ?? ordemLabel}
      className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/95 p-2 animate-in fade-in duration-300 md:p-8"
      onClick={(e) => { if (e.target === e.currentTarget) onClose?.() }}
    >
      <div
        ref={dialogoRef}
        className={`${imageOnly ? 'relative h-full w-full' : `flex w-full max-w-5xl flex-col overflow-hidden rounded-[2rem] bg-white shadow-2xl md:flex-row ${compact ? 'h-auto max-h-[92vh]' : 'h-full max-h-[92vh]'}`}`}
      >

        {/* ── Painel esquerdo: foto ── */}
        {/* shrink-0 + max-h limitada no celular: a foto não pode tomar a altura toda e deixar o conteúdo sem espaço */}
        <div
          className={`relative flex shrink-0 flex-[1.5] items-center justify-center overflow-hidden bg-slate-900 md:h-full md:max-h-none md:flex-[1.5] ${imageOnly ? 'h-full max-h-full w-full' : compact ? 'max-h-[72vh]' : 'max-h-[34vh]'}`}
          onTouchStart={navegacao ? aoComecarToque : undefined}
          onTouchEnd={navegacao ? aoTerminarToque : undefined}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-slate-800 to-slate-950 opacity-80" />
          <img
            src={fotoUrl}
            className="relative z-10 max-h-full max-w-full object-contain"
            alt={ordemLabel}
          />
          <div className="absolute left-3 top-3 z-20 rounded-full border border-blue-400/20 bg-blue-600/90 px-3.5 py-1.5 text-sm font-semibold text-white md:left-5 md:top-5">
            {ordemLabel}
          </div>

          {onClose && (
            <button
              ref={botaoFecharRef}
              type="button"
              onClick={onClose}
              aria-label="Fechar"
              className="absolute right-3 top-3 z-50 flex size-11 items-center justify-center rounded-full bg-black/55 text-white transition-colors hover:bg-black/75 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white md:right-5 md:top-5"
            >
              <X size={22} aria-hidden="true" />
            </button>
          )}

          {navegacao && (
            <div className="absolute inset-x-3 top-1/2 z-40 flex -translate-y-1/2 items-center justify-between">
              <button
                type="button"
                onClick={navegacao.onPrev}
                aria-label="Foto anterior"
                className="flex size-11 items-center justify-center rounded-full border border-white/20 bg-black/40 text-white shadow-xl transition-all hover:bg-white/90 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white active:scale-90"
              >
                <ChevronLeft size={22} aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={navegacao.onNext}
                aria-label="Próxima foto"
                className="flex size-11 items-center justify-center rounded-full border border-white/20 bg-black/40 text-white shadow-xl transition-all hover:bg-white/90 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white active:scale-90"
              >
                <ChevronRight size={22} aria-hidden="true" />
              </button>
            </div>
          )}
        </div>

        {/* ── Painel direito: slot customizável ── */}
        {/* min-h-0 é essencial: sem ele o flex item não encolhe abaixo do conteúdo e o overflow-y-auto interno nunca entra em ação */}
        {!imageOnly && (
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden border-l border-slate-50 bg-white">
            {children}
          </div>
        )}

      </div>
    </div>
  )
}
