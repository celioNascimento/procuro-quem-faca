'use client'
// components/filtros/FiltroBottomSheet.tsx

import { useEffect, useRef, useState } from 'react'
import { ChevronDown, Filter, X } from 'lucide-react'

type OpcaoBase = { id: string; label: string; count: number }

function GrupoFiltro({
  titulo,
  opcoes,
  valorAtivo,
  onToggle,
  disabled,
  dica,
}: {
  titulo: string
  opcoes: OpcaoBase[]
  valorAtivo: string
  onToggle: (val: string) => void
  disabled?: boolean
  /** Explica por que a seção está desligada. */
  dica?: string
}) {
  const [aberto, setAberto] = useState(false)
  const temAtivo = Boolean(valorAtivo)
  const labelAtivo = opcoes.find(o => o.id === valorAtivo)?.label

  if (opcoes.length === 0) return null

  return (
    <div
      className={`overflow-hidden rounded-2xl border transition-all ${
        disabled
          ? 'border-slate-100 opacity-60'
          : temAtivo
            ? 'border-blue-200 bg-blue-50'
            : 'border-slate-200 bg-white'
      }`}
    >
      {/* Header da seção */}
      <button
        onClick={() => !disabled && setAberto(v => !v)}
        disabled={disabled}
        aria-expanded={aberto}
        className="flex min-h-12 w-full items-center justify-between px-4 py-3.5"
      >
        <div className="flex min-w-0 flex-col items-start gap-0.5 sm:flex-row sm:items-center sm:gap-2">
          <span className="shrink-0 text-xs font-black uppercase tracking-widest text-slate-600">
            {titulo}
          </span>
          {temAtivo && (
            <span className="max-w-full truncate rounded-full bg-blue-600 px-2.5 py-0.5 text-xs font-black text-white">
              {labelAtivo}
            </span>
          )}
          {disabled && dica && <span className="text-xs font-normal normal-case tracking-normal text-slate-500">{dica}</span>}
        </div>
        <ChevronDown
          size={15}
          strokeWidth={2.5}
          className={`shrink-0 text-slate-400 transition-transform duration-200 ${aberto ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Opções */}
      {aberto && (
        <div className="border-t border-slate-100 px-3 pb-3 pt-2">
          <div className="flex flex-col gap-1.5">
            {opcoes.map(op => {
              const ativo = valorAtivo === op.id
              return (
                <button
                  key={op.id}
                  onClick={() => {
                    onToggle(op.id)
                    setAberto(false)
                  }}
                  className={`flex min-h-11 w-full items-center justify-between gap-2 rounded-xl border px-3 py-2.5 text-sm font-bold transition-all active:scale-[0.98] ${
                    ativo
                      ? 'border-blue-600 bg-blue-600 text-white'
                      : 'border-slate-100 bg-white text-slate-700 active:bg-slate-50'
                  }`}
                >
                  <span className="truncate text-left">{op.label}</span>
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-black ${
                      ativo ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {op.count}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

type Props = {
  filtroEstado:     string
  filtroRegiao:     string
  filtroCidade:     string
  filtroGrupo:      string
  filtroCategoria:  string
  totalAtivos:      number
  estadosDisponiveis:    { sigla: string; count: number }[]
  regioesDisponiveis:    { id: string; nome: string; count: number }[]
  cidadesDisponiveis:    { id: string; nome: string; count: number }[]
  gruposDisponiveis:     { id: string; nome: string; count: number }[]
  categoriasDisponiveis: { id: string; nome: string; count: number }[]
  onAplicar:  (chave: string, valor: string) => void
  onLimpar:   () => void
}

export function FiltroBottomSheet({
  filtroEstado, filtroRegiao, filtroCidade,
  filtroGrupo, filtroCategoria, totalAtivos,
  estadosDisponiveis, regioesDisponiveis,
  cidadesDisponiveis, gruposDisponiveis, categoriasDisponiveis,
  onAplicar, onLimpar,
}: Props) {
  const [aberto, setAberto] = useState(false)
  const sheetRef = useRef<HTMLDivElement>(null)
  const botaoAbrirRef = useRef<HTMLButtonElement>(null)

  // Trava o scroll do body enquanto o sheet estiver aberto
  useEffect(() => {
    document.body.style.overflow = aberto ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [aberto])

  // Teclado: Esc fecha; ao abrir o foco entra no painel e ao fechar volta para o botão "Filtros".
  useEffect(() => {
    if (!aberto) return
    const botao = botaoAbrirRef.current
    sheetRef.current?.focus()
    function aoTeclar(e: KeyboardEvent) {
      if (e.key === 'Escape') setAberto(false)
    }
    document.addEventListener('keydown', aoTeclar)
    return () => {
      document.removeEventListener('keydown', aoTeclar)
      botao?.focus()
    }
  }, [aberto])

  function fechar() { setAberto(false) }

  return (
    <>
      {/* Botão flutuante fixo no rodapé — só no mobile */}
      <div className="fixed bottom-6 left-1/2 z-40 -translate-x-1/2 lg:hidden">
        <button
          ref={botaoAbrirRef}
          onClick={() => setAberto(true)}
          className="flex min-h-12 items-center gap-2 rounded-full bg-slate-900 px-5 py-3 shadow-xl shadow-slate-900/20 transition-all active:scale-95"
        >
          <Filter size={15} className="text-white" />
          <span className="text-sm font-black uppercase tracking-wider text-white">
            Filtros
          </span>
          {totalAtivos > 0 && (
            <span className="ml-0.5 rounded-full bg-blue-500 px-2 py-0.5 text-xs font-black text-white">
              {totalAtivos}
            </span>
          )}
        </button>
      </div>

      {/* Backdrop */}
      {aberto && (
        <div
          onClick={fechar}
          className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-[2px] lg:hidden"
          aria-hidden="true"
        />
      )}

      {/* Bottom sheet */}
      <div
        ref={sheetRef}
        role="dialog"
        aria-modal="true"
        aria-label="Filtros"
        tabIndex={-1}
        // Fechado: fora da ordem do teclado e dos leitores de tela (antes dava para "tabular" para dentro dele escondido).
        className={`fixed bottom-0 left-0 right-0 z-50 flex max-h-[85dvh] flex-col rounded-t-[2rem] bg-[#FDFDFD] shadow-2xl outline-none transition-[transform,visibility] duration-300 ease-out lg:hidden ${
          aberto ? 'visible translate-y-0' : 'invisible translate-y-full'
        }`}
      >
        {/* Handle + cabeçalho */}
        <div className="flex shrink-0 flex-col items-center px-5 pb-3 pt-4">
          <div className="mb-4 h-1 w-10 rounded-full bg-slate-200" />
          <div className="flex w-full items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-base font-black text-slate-800">Filtros</span>
              {totalAtivos > 0 && (
                <span className="rounded-full bg-blue-600 px-2.5 py-0.5 text-xs font-black text-white">
                  {totalAtivos}
                </span>
              )}
            </div>
            <div className="flex items-center gap-3">
              {totalAtivos > 0 && (
                <button
                  onClick={() => { onLimpar(); fechar() }}
                  className="min-h-11 text-sm font-bold text-slate-500 transition-colors hover:text-red-500"
                >
                  Limpar tudo
                </button>
              )}
              <button
                onClick={fechar}
                aria-label="Fechar filtros"
                className="flex size-11 items-center justify-center rounded-full bg-slate-100 text-slate-500"
              >
                <X size={15} strokeWidth={2.5} />
              </button>
            </div>
          </div>
        </div>

        {/* Corpo scrollável */}
        <div className="flex-1 overflow-y-auto px-5 pb-4 pt-2">
          <div className="flex flex-col gap-3">
            <GrupoFiltro
              titulo="Estado"
              opcoes={estadosDisponiveis.map(e => ({ id: e.sigla, label: e.sigla, count: e.count }))}
              valorAtivo={filtroEstado}
              onToggle={v => onAplicar('estado', v)}
            />
            <GrupoFiltro
              titulo="Região"
              opcoes={regioesDisponiveis.map(r => ({ id: r.id, label: r.nome, count: r.count }))}
              valorAtivo={filtroRegiao}
              onToggle={v => onAplicar('regiao', v)}
            />
            <GrupoFiltro
              titulo="Cidade"
              opcoes={cidadesDisponiveis.map(c => ({ id: c.id, label: c.nome, count: c.count }))}
              valorAtivo={filtroCidade}
              onToggle={v => onAplicar('cidade', v)}
            />
            <GrupoFiltro
              titulo="Área"
              opcoes={gruposDisponiveis.map(g => ({ id: g.id, label: g.nome, count: g.count }))}
              valorAtivo={filtroGrupo}
              onToggle={v => onAplicar('grupo', v)}
            />
            <GrupoFiltro
              titulo="Categoria"
              opcoes={categoriasDisponiveis.map(c => ({ id: c.id, label: c.nome, count: c.count }))}
              valorAtivo={filtroCategoria}
              onToggle={v => onAplicar('categoria', v)}
              disabled={!filtroGrupo}
              dica="Escolha uma área primeiro."
            />
          </div>
        </div>

        {/* CTA fixo no rodapé do sheet */}
        <div className="shrink-0 border-t border-slate-100 px-5 py-4">
          <button
            onClick={fechar}
            className="w-full rounded-2xl bg-blue-600 py-3.5 text-sm font-black uppercase tracking-wider text-white shadow-lg shadow-blue-200 transition-all active:scale-[0.98]"
          >
            Ver resultados
          </button>
        </div>
      </div>
    </>
  )
}
