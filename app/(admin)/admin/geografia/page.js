'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export default function SuperGestaoGeografia() {
  const [estados, setEstados] = useState([])
  const [regioes, setRegioes] = useState([])
  const [cidades, setCidades] = useState([])
  const [loading, setLoading] = useState(true)
  const [editandoCidade, setEditandoCidade] = useState(null)

  // Estados dos formulários
  const [nomeEstado, setNomeEstado] = useState('')
  const [siglaEstado, setSiglaEstado] = useState('')
  const [nomeRegiao, setNomeRegiao] = useState('')
  const [estadoRegiao, setEstadoRegiao] = useState('PR') // Estado "Pai" da operação
  const [nomeCidade, setNomeCidade] = useState('')
  const [regiaoSelecionada, setRegiaoSelecionada] = useState('')

  async function carregarDados() {
    setLoading(true)
    // Buscas paralelas para performance de elite
    const [est, reg, cid] = await Promise.all([
      supabase.from('estados').select('*').order('sigla'),
      supabase.from('regioes').select('*').order('nome'),
      supabase.from('cidades').select('*, regioes(nome)').order('nome')
    ])

    setEstados(est.data || [])
    setRegioes(reg.data || [])
    setCidades(cid.data || [])
    setLoading(false)
  }

  useEffect(() => { carregarDados() }, [])

  async function addEstado(e) {
    e.preventDefault()
    if (!siglaEstado || !nomeEstado) return
    const { error } = await supabase.from('estados').insert([{
      sigla: siglaEstado.toUpperCase(),
      nome: nomeEstado
    }])
    if (!error) { setNomeEstado(''); setSiglaEstado(''); carregarDados() }
  }

  async function addRegiao(e) {
    e.preventDefault()
    if (!nomeRegiao) return
    const { error } = await supabase.from('regioes').insert([{
      nome: nomeRegiao,
      estado_sigla: estadoRegiao
    }])
    if (!error) { setNomeRegiao(''); carregarDados() }
  }

  async function addCidade(e) {
    e.preventDefault()
    if (!nomeCidade) return
    // CORREÇÃO: Inserindo estado_sigla obrigatoriamente conforme sua tabela cidades
    const { error } = await supabase.from('cidades').insert([{
      nome: nomeCidade,
      estado_sigla: estadoRegiao,
      regiao_id: regiaoSelecionada || null,
      ativa: true
    }])
    if (!error) { setNomeCidade(''); setRegiaoSelecionada(''); carregarDados() }
    else { alert("Erro ao inserir: " + error.message) }
  }

  async function atualizarRegiaoCidade(cidadeId, novaRegiaoId) {
    const { error } = await supabase.from('cidades').update({
      regiao_id: novaRegiaoId || null
    }).eq('id', cidadeId)
    if (!error) { setEditandoCidade(null); carregarDados() }
  }

  const inputClass = "w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800 placeholder:text-slate-400 outline-none focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 transition-all text-sm";
  const labelClass = "text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1 mb-1 block";

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans antialiased pb-20">

      {/* GLOSSY HEADER */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm shadow-slate-200/50">
        <div className="max-w-7xl mx-auto px-6 py-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-indigo-200 shadow-lg">
                <span className="text-white font-black text-xs italic">G</span>
              </div>
              <h1 className="text-xl font-black tracking-tight text-slate-900 uppercase italic">GeoMestra<span className="text-indigo-600 not-italic">.OS</span></h1>
            </div>
            <p className="text-slate-500 font-medium text-[10px] uppercase tracking-[0.2em] flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" /> Sincronização em Tempo Real
            </p>
          </div>
          <div className="bg-slate-100 px-4 py-2 rounded-xl border border-slate-200">
            <p className="text-[9px] font-black text-slate-400 uppercase leading-none mb-1">Municípios Ativos</p>
            <p className="text-sm font-black text-slate-700 leading-none">{cidades.length}</p>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto p-6 space-y-8 mt-4">

        {/* FORM GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* ESTADO */}
          <div className="bg-white rounded-[2rem] border border-slate-200 p-8 shadow-sm">
            <h2 className={labelClass + " text-indigo-600 mb-6"}>01. Registrar Estado</h2>
            <form onSubmit={addEstado} className="space-y-5">
              <input value={siglaEstado} onChange={e => setSiglaEstado(e.target.value)} placeholder="Sigla (EX: PR)" className={inputClass} maxLength={2} />
              <input value={nomeEstado} onChange={e => setNomeEstado(e.target.value)} placeholder="Nome do Estado" className={inputClass} />
              <button className="w-full bg-slate-900 text-white p-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em]">Adicionar UF</button>
            </form>
          </div>

          {/* REGIÃO */}
          <div className="bg-white rounded-[2rem] border border-slate-200 p-8 shadow-sm border-t-4 border-t-blue-500">
            <h2 className={labelClass + " text-blue-600 mb-6"}>02. Criar Região</h2>
            <form onSubmit={addRegiao} className="space-y-5">
              <select value={estadoRegiao} onChange={e => setEstadoRegiao(e.target.value)} className={inputClass}>
                {estados.map(e => <option key={e.sigla} value={e.sigla}>{e.nome}</option>)}
              </select>
              <input value={nomeRegiao} onChange={e => setNomeRegiao(e.target.value)} placeholder="Ex: Região Metropolitana" className={inputClass} />
              <button className="w-full bg-blue-600 text-white p-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em]">Salvar Região</button>
            </form>
          </div>

          {/* CIDADE */}
          <div className="bg-white rounded-[2rem] border border-slate-200 p-8 shadow-sm border-t-4 border-t-green-500">
            <h2 className={labelClass + " text-green-600 mb-6"}>03. Novo Município</h2>
            <form onSubmit={addCidade} className="space-y-5">
              {/* Filtro Dinâmico: Só mostra regiões do estado selecionado no select 02 */}
              <select value={regiaoSelecionada} onChange={e => setRegiaoSelecionada(e.target.value)} className={inputClass}>
                <option value="">Sem Região Específica</option>
                {regioes.filter(r => r.estado_sigla === estadoRegiao).map(r => (
                  <option key={r.id} value={r.id}>{r.nome}</option>
                ))}
              </select>
              <input value={nomeCidade} onChange={e => setNomeCidade(e.target.value)} placeholder="Nome da Cidade" className={inputClass} />
              <button className="w-full bg-green-600 text-white p-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em]">Deploy Cidade</button>
            </form>
          </div>
        </div>

        {/* TABELA DE DADOS RELACIONAIS */}
        <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Município</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Cluster Regional</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">UF</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {cidades.map(c => (
                <tr key={c.id} className="hover:bg-slate-50/80 transition-all group">
                  <td className="px-8 py-5 font-black text-slate-800 uppercase text-xs italic">{c.nome}</td>
                  <td className="px-8 py-5 text-center">
                    {editandoCidade === c.id ? (
                      <select
                        autoFocus
                        onBlur={() => setEditandoCidade(null)}
                        onChange={(e) => atualizarRegiaoCidade(c.id, e.target.value)}
                        className="p-2 bg-indigo-50 border border-indigo-200 rounded-lg text-[10px] font-black text-indigo-700 outline-none"
                      >
                        <option value="">Nenhum</option>
                        {regioes.filter(r => r.estado_sigla === c.estado_sigla).map(r => (
                          <option key={r.id} value={r.id}>{r.nome}</option>
                        ))}
                      </select>
                    ) : (
                      <button onClick={() => setEditandoCidade(c.id)} className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border transition-all ${c.regioes?.nome ? 'bg-indigo-50 text-indigo-600 border-indigo-100' : 'bg-slate-100 text-slate-400 border-slate-200'}`}>
                        {c.regioes?.nome || c.regiao_id ? "Carregando..." : "Vincular"}
                      </button>
                    )}
                  </td>
                  <td className="px-8 py-5 text-right">
                    <span className="bg-slate-900 text-white px-3 py-1.5 rounded-lg font-black text-[9px] italic">{c.estado_sigla}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  )
}
