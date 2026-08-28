// components/filtros/FiltroSidebar.tsx
'use client'

import { useState } from 'react'
import { ChevronDown, Filter, X } from 'lucide-react'

type OpcaoContagem = { id?: string; sigla?: string; nome?: string; count: number }

function SecaoFiltro({
  titulo,
  opcoes,
  valorAtivo,
  labelKey,
  idKey,
  onToggle,
  disabled,
}: {
  titulo: string
  opcoes: OpcaoContagem[]
  valorAtivo: string
  labelKey: keyof OpcaoContagem
  idKey: keyof OpcaoContagem
  onToggle: (val: string) => void
  disabled?: boolean
}) {
  const [aberto, setAberto] = useState(true)

  if (opcoes.length === 0) return null

  return (
    <div className="border-b border-slate-100 pb-3">
      <button
        onClick={() => setAberto(v => !v)}
        className="flex w-full items-center justify-between py-2"
        disabled={disabled}
      >
        <span className={`text-[11px] font-black uppercase tracking-widest ${disabled ? 'text-slate-300' : 'text-slate-500'}`}>
          {titulo}
        </span>
        <ChevronDown
          size={14}
          strokeWidth={2.5}
          className={`text-slate-400 transition-transform duration-200 ${aberto ? 'rotate-180' : ''}`}
        />
      </button>

      {aberto && (
        <div className="mt-1.5 flex flex-col gap-1.5">
          {opcoes.map(op => {
            const id    = String(op[idKey]    ?? '')
            const label = String(op[labelKey] ?? '')
            const ativo = valorAtivo === id

            return (
              <button
                key={id}
                onClick={() => onToggle(id)}
                disabled={disabled}
                className={`flex w-full items-center justify-between gap-2 rounded-2xl border px-3 py-2 text-[12px] font-bold transition-all ${
                  ativo
                    ? 'border-blue-600 bg-blue-600 text-white shadow-md shadow-blue-100'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-blue-400 hover:text-blue-600'
                } ${disabled ? 'cursor-not-allowed opacity-40' : ''}`}
              >
                <span className="truncate text-left">{label}</span>
                <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-black ${
                  ativo ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
                }`}>
                  {op.count}
                </span>
              </button>
            )
          })}
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
  onAplicar:   (chave: string, valor: string) => void
  onLimpar:    () => void
}

export function FiltroSidebar({
  filtroEstado, filtroRegiao, filtroCidade,
  filtroGrupo, filtroCategoria, totalAtivos,
  estadosDisponiveis, regioesDisponiveis,
  cidadesDisponiveis, gruposDisponiveis, categoriasDisponiveis,
  onAplicar, onLimpar,
}: Props) {
  return (
    <div className="sticky top-32 space-y-1">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter size={14} className="text-slate-500" />
          <span className="text-[11px] font-black uppercase tracking-widest text-slate-600">Filtros</span>
          {totalAtivos > 0 && (
            <span className="rounded-full bg-blue-600 px-2 py-0.5 text-[10px] font-black text-white">
              {totalAtivos}
            </span>
          )}
        </div>
        {totalAtivos > 0 && (
          <button
            onClick={onLimpar}
            className="flex items-center gap-1 text-[11px] font-bold text-slate-400 transition-colors hover:text-red-500"
          >
            <X size={11} strokeWidth={3} /> Limpar
          </button>
        )}
      </div>

      <SecaoFiltro
        titulo="Estado"
        opcoes={estadosDisponiveis.map(e => ({ sigla: e.sigla, nome: e.sigla, count: e.count }))}
        valorAtivo={filtroEstado}
        labelKey="nome"
        idKey="sigla"
        onToggle={v => onAplicar('estado', v)}
      />
      <SecaoFiltro
        titulo="Região"
        opcoes={regioesDisponiveis}
        valorAtivo={filtroRegiao}
        labelKey="nome"
        idKey="id"
        onToggle={v => onAplicar('regiao', v)}
        disabled={!filtroEstado}
      />
      <SecaoFiltro
        titulo="Cidade"
        opcoes={cidadesDisponiveis.map(c => ({ id: c.nome, nome: c.nome, count: c.count }))}
        valorAtivo={filtroCidade}
        labelKey="nome"
        idKey="id"
        onToggle={v => onAplicar('cidade', v)}
        disabled={!filtroEstado}
      />
      <SecaoFiltro
        titulo="Área"
        opcoes={gruposDisponiveis}
        valorAtivo={filtroGrupo}
        labelKey="nome"
        idKey="id"
        onToggle={v => onAplicar('grupo', v)}
      />
      <SecaoFiltro
        titulo="Categoria"
        opcoes={categoriasDisponiveis}
        valorAtivo={filtroCategoria}
        labelKey="nome"
        idKey="id"
        onToggle={v => onAplicar('categoria', v)}
        disabled={!filtroGrupo}
      />
    </div>
  )
}
