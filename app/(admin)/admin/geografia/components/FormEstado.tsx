//app/(admin)/admin/geografia/components/FormEstado.tsx

'use client'
import { useState } from 'react'

const inputClass = "w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800 placeholder:text-slate-400 outline-none focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 transition-all text-sm"

export function FormEstado({ onSubmit }) {
  const [sigla, setSigla] = useState('')
  const [nome, setNome] = useState('')
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState(null)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!sigla || !nome) return
    setLoading(true)
    setErro(null)
    const err = await onSubmit(sigla, nome)
    if (err) setErro(err)
    else { setSigla(''); setNome('') }
    setLoading(false)
  }

  return (
    <div className="bg-white rounded-[2rem] border border-slate-200 p-8 shadow-sm">
      <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600 mb-6 block">01. Registrar Estado</span>
      <form onSubmit={handleSubmit} className="space-y-5">
        <input value={sigla} onChange={e => setSigla(e.target.value)} placeholder="Sigla (EX: PR)" className={inputClass} maxLength={2} />
        <input value={nome} onChange={e => setNome(e.target.value)} placeholder="Nome do Estado" className={inputClass} />
        {erro && <p className="text-red-500 text-xs font-bold">{erro}</p>}
        <button type="submit" disabled={loading} className="w-full bg-slate-900 text-white p-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] disabled:opacity-50">
          {loading ? 'Salvando...' : 'Adicionar UF'}
        </button>
      </form>
    </div>
  )
}