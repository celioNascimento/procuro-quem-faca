// components/filtros/FiltroBottomSheet.tsx
'use client'

import { useEffect, useRef, useState } from 'react'
import { ChevronDown, ChevronRight, Filter, X } from 'lucide-react'

type OpcaoContagem = { id: string; label: string; count: number }

function GrupoFiltro({
  titulo,
  opcoes,
  valorAtivo,
  onToggle,
  disabled,
}: {
  titulo: string
  opcoes: OpcaoContagem[]
  valorAtivo: string
  onToggle: (val: string) => void
  disabled?: boolean
}) {
  const [aberto, setAberto] = useState(false)
  const temAtivo = Boolean(valorAtivo)

  if (opcoes.length === 0) return null

  const labelAtivo = opcoes.find(o => o.id === valorAtivo)?.label

  return (
    <div className={`rounded-2xl border transition-all ${disabled ? 'border-slate-100 opacity-40' : temAtivo ? 'border-blue-200 bg-blue-50' : 'border-slate-200 bg-white'}`}>
      {/* Header da seção */}
      <button
        onClick={() => !disabled && setAberto(v => !v)}
        className="flex w-full items-center justify-between px-4 py-3.5"
        disabled={disabled}
      >
        <div className="flex items-center gap-2">
          <span className="text-[12px] font-black uppercase tracking-widest text-slate-500">{titulo}</span>
          {temAtivo && (
            <span className="rounded-full bg-blue-600 px-2 py-0.5 text-[10px] font-black text-white">
              {labelAtivo}
            </span>
          )}
        </div>
        <ChevronDown
          size={15}
          strokeWidth={2.5}
          className={`text-slate-400 transition-transform duration-200 ${aberto ? 'rotate-180' : ''}`}
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
                  onClick={() => { onToggle(op.id); setAberto(false) }}
                  className={`flex w-full items-center justify-between gap-2 rounded-xl border px-3 py-2.5 text-[13px] font-bold transition-all ${
                    ativo
                      ? 'border-blue-600 bg-blue-600 text-white'
                      : 'border-slate-100 bg-white text-slate-700 active:bg-slate-50'
                  }`}
                >
                  <span className="truncate text-left">{op.label}</span>
                  <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-black ${ativo ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'}`}>
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
  cidadesDisponiveis:    { nome: string; count: number }[]
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

  // Trava o scroll do body enquanto o sheet estiver aberto
  useEffect(() => {
    document.body.style.overflow = aberto ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [aberto])

  // Fecha ao clicar fora (backdrop)
  function fechar() { setAberto(false) }

  return (
    <>
      {/* Botão flutuante fixo no rodapé — só mobile */}
      <div className="fixed bottom-6 left-1/2 z-40 -translate-x-1/2 lg:hidden">
        <button
          onClick={() => setAberto(true)}
          className="flex items-center gap-2 rounded-full bg-slate-900 px-5 py-3 shadow-xl shadow-slate-900/20 transition-all active:scale-95"
        >
          <Filter size={15} className="text-white" />
          <span className="text-[13px] font-black uppercase tracking-wider text-white">Filtros</span>
          {totalAtivos > 0 && (
            <span className="ml-0.5 rounded-full bg-blue-500 px-2 py-0.5 text-[11px] font-black text-white">
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
        className={`fixed bottom-0 left-0 right-0 z-50 flex max-h-[85dvh] flex-col rounded-t-[2rem] bg-[#FDFDFD] shadow-2xl transition-transform duration-300 ease-out lg:hidden ${
          aberto ? 'translate-y-0' : 'translate-y-full'
        }`}
        aria-modal="true"
        role="dialog"
        aria-label="Filtros"
      >
        {/* Handle + Header */}
        <div className="flex shrink-0 flex-col items-center px-5 pb-3 pt-4">
          <div className="mb-4 h-1 w-10 rounded-full bg-slate-200" />
          <div className="flex w-full items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-[15px] font-black text-slate-800">Filtros</span>
              {totalAtivos > 0 && (
                <span className="rounded-full bg-blue-600 px-2.5 py-0.5 text-[11px] font-black text-white">
                  {totalAtivos}
                </span>
              )}
            </div>
            <div className="flex items-center gap-3">
              {totalAtivos > 0 && (
                <button
                  onClick={() => { onLimpar(); fechar() }}
                  className="text-[13px] font-bold text-slate-400 transition-colors hover:text-red-500"
                >
                  Limpar tudo
                </button>
              )}
              <button
                onClick={fechar}
                className="flex size-8 items-center justify-center rounded-full bg-slate-100 text-slate-500"
              >
                <X size={15} strokeWidth={2.5} />
              </button>
            </div>
          </div>
        </div>

        {/* Corpo scrollável */}
        <div className="flex-1 overflow-y-auto px-5 pb-8 pt-2">
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
              disabled={!filtroEstado}
            />
            <GrupoFiltro
              titulo="Cidade"
              opcoes={cidadesDisponiveis.map(c => ({ id: c.nome, label: c.nome, count: c.count }))}
              valorAtivo={filtroCidade}
              onToggle={v => onAplicar('cidade', v)}
              disabled={!filtroEstado}
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
            />
          </div>
        </div>

        {/* CTA fixo no rodapé do sheet */}
        <div className="shrink-0 border-t border-slate-100 px-5 py-4">
          <button
            onClick={fechar}
            className="w-full rounded-2xl bg-blue-600 py-3.5 text-[13px] font-black uppercase tracking-wider text-white shadow-lg shadow-blue-200 transition-all active:scale-[0.98]"
          >
            Ver resultados
          </button>
        </div>
      </div>
    </>
  )
}
