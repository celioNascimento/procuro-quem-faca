'use client'
import { useState } from 'react'

export function TabelaCidades({ cidades, regioes, onAtualizarRegiao, total }) {
  const [editandoId, setEditandoId] = useState(null)
  const [salvando, setSalvando] = useState(null)

  async function handleRegiaoChange(cidadeId, regiaoId) {
    setSalvando(cidadeId)
    await onAtualizarRegiao(cidadeId, regiaoId || null)
    setEditandoId(null)
    setSalvando(null)
  }

  return (
    <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
      <div className="px-8 py-5 border-b border-slate-100 flex items-center justify-between">
        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Municípios Cadastrados</span>
        <span className="bg-slate-900 text-white px-3 py-1 rounded-lg text-[10px] font-black">{total} total</span>
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
            {cidades.length === 0 && (
              <tr>
                <td colSpan={3} className="px-8 py-10 text-center text-slate-400 text-xs font-medium">
                  Nenhuma cidade cadastrada ainda.
                </td>
              </tr>
            )}
            {cidades.map(c => {
              // regioes já normalizados pelo hook: {nome} | null
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