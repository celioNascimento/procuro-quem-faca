'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export default function SuperGestaoGeografia() {
  const [estados, setEstados] = useState([])
  const [regioes, setRegioes] = useState([])
  const [cidades, setCidades] = useState([])
  const [loading, setLoading] = useState(true)
  
  // Estado para controle de edição inline
  const [editandoCidade, setEditandoCidade] = useState(null)

  // Estados dos formulários de cadastro
  const [nomeEstado, setNomeEstado] = useState('')
  const [siglaEstado, setSiglaEstado] = useState('')
  
  const [nomeRegiao, setNomeRegiao] = useState('')
  const [estadoRegiao, setEstadoRegiao] = useState('PR')
  
  const [nomeCidade, setNomeCidade] = useState('')
  const [regiaoSelecionada, setRegiaoSelecionada] = useState('')

  useEffect(() => {
    carregarDados()
  }, [])

  async function carregarDados() {
    setLoading(true)
    const { data: est } = await supabase.from('estados').select('*').order('sigla')
    const { data: reg } = await supabase.from('regioes').select('*').order('nome')
    const { data: cid } = await supabase.from('cidades').select('*, regioes(nome)').order('nome')
    
    setEstados(est || [])
    setRegioes(reg || [])
    setCidades(cid || [])
    setLoading(false)
  }

  // Ações de Inserção
  async function addEstado(e) {
    e.preventDefault()
    if(!siglaEstado || !nomeEstado) return
    const { error } = await supabase.from('estados').insert([{ sigla: siglaEstado.toUpperCase(), nome: nomeEstado }])
    if(!error) { setNomeEstado(''); setSiglaEstado(''); carregarDados() }
  }

  async function addRegiao(e) {
    e.preventDefault()
    if(!nomeRegiao) return
    const { error } = await supabase.from('regioes').insert([{ nome: nomeRegiao, estado_sigla: estadoRegiao }])
    if(!error) { setNomeRegiao(''); carregarDados() }
  }

  async function addCidade(e) {
    e.preventDefault()
    if(!nomeCidade) return
    const { error } = await supabase.from('cidades').insert([{ 
      nome: nomeCidade, 
      estado_sigla: estadoRegiao, 
      regiao_id: regiaoSelecionada || null 
    }])
    if(!error) { setNomeCidade(''); carregarDados() }
  }

  // Função de Edição Rápida
  async function atualizarRegiaoCidade(cidadeId, novaRegiaoId) {
    const { error } = await supabase
      .from('cidades')
      .update({ regiao_id: novaRegiaoId || null })
      .eq('id', cidadeId)

    if (!error) {
      setEditandoCidade(null)
      carregarDados()
    }
  }

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-8 bg-slate-50 min-h-screen">
      <header className="border-b border-slate-200 pb-6">
        <h1 className="text-3xl md:text-4xl font-black text-slate-900 uppercase tracking-tighter">Geografia Mestra</h1>
        <p className="text-slate-500 font-bold uppercase text-[10px] tracking-[0.3em]">Gestão de Territórios V2.0</p>
      </header>

      {/* Grid de Formulários - 3 Colunas no Desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* 1. ESTADOS */}
        <section className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 space-y-4">
          <h2 className="text-sm font-black text-blue-600 uppercase tracking-widest">1. Estados</h2>
          <form onSubmit={addEstado} className="space-y-3">
            <input 
              value={siglaEstado} onChange={e => setSiglaEstado(e.target.value)}
              placeholder="Sigla (EX: PR)" className="w-full p-3 bg-slate-100 rounded-xl font-bold text-slate-900 uppercase outline-none focus:ring-2 focus:ring-blue-500"
              maxLength={2}
            />
            <input 
              value={nomeEstado} onChange={e => setNomeEstado(e.target.value)}
              placeholder="Nome (Ex: Paraná)" className="w-full p-3 bg-slate-100 rounded-xl font-bold text-slate-900 outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button className="w-full bg-slate-900 text-white p-4 rounded-xl font-black text-[10px] uppercase hover:bg-slate-800 transition-all">Salvar Estado</button>
          </form>
        </section>

        {/* 2. REGIÕES */}
        <section className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 space-y-4">
          <h2 className="text-sm font-black text-blue-600 uppercase tracking-widest">2. Regiões</h2>
          <form onSubmit={addRegiao} className="space-y-3">
            <select 
              value={estadoRegiao} onChange={e => setEstadoRegiao(e.target.value)}
              className="w-full p-3 bg-slate-100 rounded-xl font-bold text-slate-900 outline-none focus:ring-2 focus:ring-blue-500"
            >
              {estados.map(e => <option key={e.sigla} value={e.sigla}>{e.nome}</option>)}
            </select>
            <input 
              value={nomeRegiao} onChange={e => setNomeRegiao(e.target.value)}
              placeholder="Ex: Grande Londrina" className="w-full p-3 bg-slate-100 rounded-xl font-bold text-slate-900 outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button className="w-full bg-blue-600 text-white p-4 rounded-xl font-black text-[10px] uppercase shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all">Criar Região</button>
          </form>
        </section>

        {/* 3. CIDADES */}
        <section className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 space-y-4">
          <h2 className="text-sm font-black text-blue-600 uppercase tracking-widest">3. Cidades</h2>
          <form onSubmit={addCidade} className="space-y-3">
            <select 
              value={regiaoSelecionada} onChange={e => setRegiaoSelecionada(e.target.value)}
              className="w-full p-3 bg-slate-100 rounded-xl font-bold text-slate-900 outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Sem Região Especial</option>
              {regioes.filter(r => r.estado_sigla === estadoRegiao).map(r => (
                <option key={r.id} value={r.id}>{r.nome}</option>
              ))}
            </select>
            <input 
              value={nomeCidade} onChange={e => setNomeCidade(e.target.value)}
              placeholder="Ex: Cambé" className="w-full p-3 bg-slate-100 rounded-xl font-bold text-slate-900 outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button className="w-full bg-green-600 text-white p-4 rounded-xl font-black text-[10px] uppercase shadow-lg shadow-green-100 hover:bg-green-700 transition-all">Finalizar Cidade</button>
          </form>
        </section>
      </div>

      {/* TABELA DE LISTAGEM */}
      <section className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="p-4 text-[10px] font-black text-slate-400 uppercase">Cidade</th>
                <th className="p-4 text-[10px] font-black text-slate-400 uppercase">Região / Organização</th>
                <th className="p-4 text-[10px] font-black text-slate-400 uppercase text-right">UF</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="3" className="p-10 text-center font-bold text-slate-400 animate-pulse">CARREGANDO DADOS...</td></tr>
              ) : cidades.map(c => (
                <tr key={c.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-colors">
                  <td className="p-4 font-bold text-slate-800 uppercase text-sm">{c.nome}</td>
                  <td className="p-4">
                    {editandoCidade === c.id ? (
                      <select 
                        autoFocus
                        onBlur={() => setEditandoCidade(null)}
                        onChange={(e) => atualizarRegiaoCidade(c.id, e.target.value)}
                        className="p-2 bg-blue-50 border border-blue-200 rounded-lg text-xs font-bold text-blue-700 outline-none"
                      >
                        <option value="">Sem Região</option>
                        {regioes.filter(r => r.estado_sigla === c.estado_sigla).map(r => (
                          <option key={r.id} value={r.id}>{r.nome}</option>
                        ))}
                      </select>
                    ) : (
                      <div onClick={() => setEditandoCidade(c.id)} className="cursor-pointer group flex items-center gap-2">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${c.regioes?.nome ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-400'}`}>
                          {c.regioes?.nome || "Vincular Região"}
                        </span>
                        <span className="opacity-0 group-hover:opacity-100 text-[10px] text-blue-400 font-bold">✎ editar</span>
                      </div>
                    )}
                  </td>
                  <td className="p-4 text-right">
                    <span className="bg-slate-100 px-2 py-1 rounded-md font-black text-slate-600 text-[10px] uppercase">{c.estado_sigla}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}