'use client'
import { useState } from 'react'

const inputClass = "w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800 placeholder:text-slate-400 outline-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-50 transition-all text-sm"

export function FormRegiao({ estados, onSubmit }) {
  const [nome, setNome] = useState('')
  const [estadoSigla, setEstadoSigla] = useState('')
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState(null)

  const siglaEfetiva = estadoSigla || estados[0]?.sigla || ''

  async function handleSubmit(e) {
    e.preventDefault()
    if (!nome || !siglaEfetiva) return
    setLoading(true)
    setErro(null)
    const err = await onSubmit(nome, siglaEfetiva)
    if (err) setErro(err)
    else setNome('')
    setLoading(false)
  }

  return (
    <div className="bg-white rounded-[2rem] border border-slate-200 p-8 shadow-sm border-t-4 border-t-blue-500">
      <span className="text-[10px] font-black uppercase tracking-widest text-blue-600 mb-6 block">02. Criar Região</span>
      <form onSubmit={handleSubmit} className="space-y-5">
        <select value={siglaEfetiva} onChange={e => setEstadoSigla(e.target.value)} className={inputClass}>
          {estados.map(e => <option key={e.sigla} value={e.sigla}>{e.nome}</option>)}
        </select>
        <input value={nome} onChange={e => setNome(e.target.value)} placeholder="Ex: Região Metropolitana de Londrina" className={inputClass} />
        {erro && <p className="text-red-500 text-xs font-bold">{erro}</p>}
        <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white p-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] disabled:opacity-50">
          {loading ? 'Salvando...' : 'Salvar Região'}
        </button>
      </form>
    </div>
  )
}