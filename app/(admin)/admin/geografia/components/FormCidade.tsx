'use client'
import { useState, useMemo } from 'react'

const inputClass = "w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800 placeholder:text-slate-400 outline-none focus:bg-white focus:border-green-500 focus:ring-4 focus:ring-green-50 transition-all text-sm"
const subLabel = "text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1 mb-1 block"

export function FormCidade({ estados, regioes, onSubmit }) {
  const [nome, setNome] = useState('')
  const [estadoSigla, setEstadoSigla] = useState('')
  const [regiaoId, setRegiaoId] = useState('')
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState(null)
  const [sucesso, setSucesso] = useState(false)

  const siglaEfetiva = estadoSigla || estados[0]?.sigla || ''

  const regioesFiltradas = useMemo(
    () => regioes.filter(r => r.estado_sigla === siglaEfetiva),
    [regioes, siglaEfetiva]
  )

  function handleEstadoChange(sigla) {
    setEstadoSigla(sigla)
    setRegiaoId('') // limpa ao trocar estado
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!nome || !siglaEfetiva) return
    setLoading(true)
    setErro(null)
    setSucesso(false)
    const err = await onSubmit(nome, siglaEfetiva, regiaoId || null)
    if (err) {
      setErro(err)
    } else {
      setNome('')
      setRegiaoId('')
      setSucesso(true)
      setTimeout(() => setSucesso(false), 3000)
    }
    setLoading(false)
  }

  return (
    <div className="bg-white rounded-[2rem] border border-slate-200 p-8 shadow-sm border-t-4 border-t-green-500">
      <span className="text-[10px] font-black uppercase tracking-widest text-green-600 mb-6 block">03. Novo Município</span>
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className={subLabel}>Estado</label>
          <select value={siglaEfetiva} onChange={e => handleEstadoChange(e.target.value)} className={inputClass}>
            {estados.map(e => <option key={e.sigla} value={e.sigla}>{e.nome}</option>)}
          </select>
        </div>
        <div>
          <label className={subLabel}>
            Região {regioesFiltradas.length === 0 && siglaEfetiva ? '— nenhuma cadastrada' : ''}
          </label>
          <select
            value={regiaoId}
            onChange={e => setRegiaoId(e.target.value)}
            className={inputClass}
            disabled={regioesFiltradas.length === 0}
          >
            <option value="">Sem Região Específica</option>
            {regioesFiltradas.map(r => <option key={r.id} value={r.id}>{r.nome}</option>)}
          </select>
        </div>
        <input value={nome} onChange={e => setNome(e.target.value)} placeholder="Nome da Cidade" className={inputClass} />
        {erro && <p className="text-red-500 text-xs font-bold">{erro}</p>}
        {sucesso && <p className="text-green-600 text-xs font-bold">✓ Cidade cadastrada!</p>}
        <button type="submit" disabled={loading || !nome} className="w-full bg-green-600 text-white p-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] disabled:opacity-50 transition-opacity">
          {loading ? 'Salvando...' : 'Cadastrar Cidade'}
        </button>
      </form>
    </div>
  )
}