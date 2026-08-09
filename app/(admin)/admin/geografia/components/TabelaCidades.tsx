//app/(admin)/admin/geografia/components/TabelaCidades.tsx

'use client'
import { useState, useMemo } from 'react'
import type { Cidade, Regiao } from '../types/geografia'

const selectClass = "p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-700 outline-none focus:bg-white focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50 transition-all text-xs"

type Props = {
  cidades: Cidade[]
  regioes: Regiao[]
  onAtualizarRegiao: (cidadeId: string, regiaoId: string | null) => Promise<string | null>
  total: number
}

export function TabelaCidades({ cidades, regioes, onAtualizarRegiao, total }: Props) {
  const [editandoId, setEditandoId]     = useState<string | null>(null)
  const [salvando, setSalvando]         = useState<string | null>(null)
  const [filtroEstado, setFiltroEstado] = useState('')
  const [filtroRegiao, setFiltroRegiao] = useState('')

  const estados = useMemo(() => {
    const siglas = [...new Set(cidades.map(c => c.estado_sigla))].sort()
    return siglas
  }, [cidades])

  const regioesFiltradas = useMemo(() => {
    if (!filtroEstado) return regioes
    return regioes.filter(r => r.estado_sigla === filtroEstado)
  }, [regioes, filtroEstado])

  const cidadesFiltradas = useMemo(() => {
    return cidades.filter(c => {
      if (filtroEstado && c.estado_sigla !== filtroEstado) return false
      if (filtroRegiao && c.regiao_id !== filtroRegiao) return false
      return true
    })
  }, [cidades, filtroEstado, filtroRegiao])

  function handleEstadoChange(sigla: string) {
    setFiltroEstado(sigla)
    setFiltroRegiao('')
  }

  async function handleRegiaoChange(cidadeId: string, regiaoId: string) {
    setSalvando(cidadeId)
    await onAtualizarRegiao(cidadeId, regiaoId || null)
    setEditandoId(null)
    setSalvando(null)
  }

  return (
    <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">

      <div className="px-8 py-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
            Municípios Cadastrados
          </span>
          <span className="bg-slate-900 text-white px-3 py-1 rounded-lg text-[10px] font-black">
            {cidadesFiltradas.length}{cidadesFiltradas.length !== total ? ` / ${total}` : ' total'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={filtroEstado}
            onChange={e => handleEstadoChange(e.target.value)}
            className={selectClass}
          >
            <option value="">Todos os estados</option>
            {estados.map(sigla => (
              <option key={sigla} value={sigla}>{sigla}</option>
            ))}
          </select>

          {filtroEstado && (
            <select
              value={filtroRegiao}
              onChange={e => setFiltroRegiao(e.target.value)}
              className={selectClass}
            >
              <option value="">Todas as regiões</option>
              {regioesFiltradas.map(r => (
                <option key={r.id} value={r.id}>{r.nome}</option>
              ))}
            </select>
          )}

          {(filtroEstado || filtroRegiao) && (
            <button
              onClick={() => { setFiltroEstado(''); setFiltroRegiao('') }}
              className="px-3 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all"
            >
              ✕ Limpar
            </button>
          )}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-50/50 border-b border-slate-100">
              <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Município</th>
              <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Região</th>
              <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">UF</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {cidadesFiltradas.length === 0 && (
              <tr>
                <td colSpan={3} className="px-8 py-10 text-center text-slate-400 text-xs font-medium">
                  {total === 0 ? 'Nenhuma cidade cadastrada ainda.' : 'Nenhuma cidade encontrada para este filtro.'}
                </td>
              </tr>
            )}
            {cidadesFiltradas.map(c => {
              const nomeRegiao = c.regioes?.nome ?? null
              const regioesDoCidade = regioes.filter(r => r.estado_sigla === c.estado_sigla)

              return (
                <tr key={c.id} className="hover:bg-slate-50/80 transition-all">
                  <td className="px-8 py-5 font-black text-slate-800 uppercase text-xs italic">{c.nome}</td>
                  <td className="px-8 py-5 text-center">
                    {editandoId === c.id ? (
                      <select
                        autoFocus
                        disabled={salvando === c.id}
                        defaultValue={c.regiao_id ?? ''}
                        onBlur={() => setEditandoId(null)}
                        onChange={e => handleRegiaoChange(c.id, e.target.value)}
                        className="p-2 bg-indigo-50 border border-indigo-200 rounded-lg text-[10px] font-black text-indigo-700 outline-none"
                      >
                        <option value="">Sem região</option>
                        {regioesDoCidade.map(r => (
                          <option key={r.id} value={r.id}>{r.nome}</option>
                        ))}
                      </select>
                    ) : (
                      <button
                        onClick={() => setEditandoId(c.id)}
                        className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border transition-all ${
                          nomeRegiao
                            ? 'bg-indigo-50 text-indigo-600 border-indigo-100 hover:bg-indigo-100'
                            : 'bg-slate-100 text-slate-400 border-slate-200 hover:bg-slate-200'
                        }`}
                      >
                        {nomeRegiao ?? 'Vincular'}
                      </button>
                    )}
                  </td>
                  <td className="px-8 py-5 text-right">
                    <span className="bg-slate-900 text-white px-3 py-1.5 rounded-lg font-black text-[9px] italic">{c.estado_sigla}</span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}