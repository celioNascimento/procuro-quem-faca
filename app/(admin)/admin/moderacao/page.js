'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { CATEGORIAS_OFICIAIS } from '@/lib/categorias'

export default function ModeracaoPrestadores() {
  const [prestadores, setPrestadores] = useState([])
  const [cidades, setCidades] = useState([])
  const [loading, setLoading] = useState(true)
  const [editando, setEditando] = useState(null)
  const [salvando, setSalvando] = useState(false)
  
  const [termoBusca, setTermoBusca] = useState('')
  const [categoriaFiltro, setCategoriaFiltro] = useState('')

  useEffect(() => { carregarDados() }, [])

  async function carregarDados() {
    setLoading(true)
    const { data: cData } = await supabase.from('cidades')
      .select('id, nome, estado_sigla')
      .order('nome')
    setCidades(cData || [])

    const { data, error } = await supabase.from('prestadores')
      .select('*, cidades(nome, estado_sigla)')
    
    if (!error) {
      const ordenados = (data || []).sort((a, b) => {
        if (a.status === 'pendente' && b.status !== 'pendente') return -1
        return a.status !== 'pendente' && b.status === 'pendente' ? 1 : 0
      })
      setPrestadores(ordenados)
    }
    setLoading(false)
  }

  const validarPrestador = (p) => ({
    podeAtivar: !!(p.nome && p.whatsapp && p.categoria && p.bairro && p.foto_perfil && p.user_id && p.cidade_id)
  })

  async function confirmarAlteracao(id) {
    // CORREÇÃO: Removida a tipagem "as HTML..." para compatibilidade com .js
    const b = document.getElementById(`b-${id}`).value
    const cid = document.getElementById(`c-${id}`).value
    const cat = document.getElementById(`cat-${id}`).value
    
    if (!cid) return alert("Selecione uma cidade válida!")

    setSalvando(true)
    const { error } = await supabase.from('prestadores').update({ 
      bairro: b, 
      cidade_id: cid, 
      categoria: cat 
    }).eq('id', id)

    if (!error) {
      await carregarDados()
      setEditando(null)
    }
    setSalvando(false)
  }

  async function alterarStatus(id, novoStatus) {
    const p = prestadores.find(item => item.id === id)
    if (novoStatus === 'ativo' && !validarPrestador(p).podeAtivar) {
      alert("❌ Campos obrigatórios faltando (verifique se a cidade está selecionada).")
      return
    }
    setSalvando(true)
    const { error } = await supabase.from('prestadores').update({ 
      status: novoStatus, 
      aprovado_em: novoStatus === 'ativo' ? new Date().toISOString() : null
    }).eq('id', id)
    
    if (!error) carregarDados()
    setSalvando(false)
  }

  const prestadoresExibidos = prestadores.filter(p => {
    const matchCategoria = !categoriaFiltro || p.categoria === categoriaFiltro
    const busca = termoBusca.toLowerCase()
    const matchTexto = !termoBusca || 
      p.nome?.toLowerCase().includes(busca) ||
      p.habilidades?.some(h => h.toLowerCase().includes(busca)) ||
      p.tags?.some(t => t.toLowerCase().includes(busca)) || // Mantido Filtro por Tags
      p.cidades?.nome?.toLowerCase().includes(busca)

    return matchCategoria && matchTexto
  })

  return (
    <div className="max-w-5xl mx-auto px-6 py-10 bg-[#F4F7F9] min-h-screen font-sans text-slate-800">
      {salvando && (
        <div className="fixed inset-0 bg-white/80 backdrop-blur-sm z-[100] flex items-center justify-center">
          <div className="w-10 h-10 border-[3px] border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}

      <header className="mb-10">
        <div className="flex justify-between items-end">
          <h1 className="text-3xl font-black text-slate-900 uppercase italic">Moderação</h1>
          {(termoBusca || categoriaFiltro) && (
            <button onClick={() => {setTermoBusca(''); setCategoriaFiltro('')}} className="text-[10px] font-black text-blue-600 underline uppercase tracking-widest">Limpar Filtros</button>
          )}
        </div>
        
        <div className="flex flex-col md:flex-row gap-4 mt-6">
          <select 
            value={categoriaFiltro}
            onChange={(e) => setCategoriaFiltro(e.target.value)}
            className="p-3 rounded-xl border border-slate-200 font-bold text-xs bg-white outline-none shadow-sm text-slate-800"
          >
            <option value="">Todas as Categorias</option>
            {CATEGORIAS_OFICIAIS.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <input 
            type="text"
            value={termoBusca}
            placeholder="Buscar por nome, habilidade, tag ou cidade..."
            className="flex-1 p-3 rounded-xl border border-slate-200 font-bold text-xs bg-white outline-none shadow-sm text-slate-800"
            onChange={(e) => setTermoBusca(e.target.value)}
          />
        </div>
      </header>

      <div className="grid gap-6">
        {loading ? (
          <div className="py-20 text-center animate-pulse font-black text-slate-400 uppercase tracking-[0.4em]">Sincronizando Banco de Dados...</div>
        ) : prestadoresExibidos.map((p) => {
          const v = validarPrestador(p);
          return (
            <div key={p.id} className={`bg-white rounded-[2.2rem] p-6 shadow-sm border transition-all ${!v.podeAtivar ? 'border-amber-200 bg-amber-50/30' : 'border-slate-100'}`}>
              <div className="flex flex-col md:flex-row items-center gap-6">
                
                <div className="w-20 h-20 rounded-2xl overflow-hidden bg-slate-200 ring-4 ring-white shadow-md shrink-0">
                  <img src={p.foto_perfil || 'https://via.placeholder.com/150'} className="w-full h-full object-cover" />
                </div>

                <div className="flex-1 w-full">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">{p.nome || 'SEM NOME'}</h3>
                    <span className={`px-2 py-1 rounded text-[8px] font-black uppercase tracking-widest ${p.status === 'ativo' ? 'bg-green-500 text-white' : 'bg-slate-200 text-slate-500'}`}>
                      {p.status}
                    </span>
                  </div>

                  {editando === p.id ? (
                    <div className="grid grid-cols-2 gap-2 bg-slate-50 p-4 rounded-2xl border border-blue-100 shadow-inner">
                      <select id={`cat-${p.id}`} defaultValue={p.categoria} className="col-span-2 p-2 border border-slate-200 rounded-lg font-bold text-xs outline-none text-slate-800">
                        {CATEGORIAS_OFICIAIS.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                      
                      <input id={`b-${p.id}`} defaultValue={p.bairro} placeholder="Bairro" className="p-2 border border-slate-200 rounded-lg text-xs outline-none text-slate-800" />
                      
                      <select id={`c-${p.id}`} defaultValue={p.cidade_id} className="p-2 border border-slate-200 rounded-lg font-bold text-xs outline-none text-slate-800">
                        <option value="">Selecione a Cidade</option>
                        {cidades.map(cid => (
                          <option key={cid.id} value={cid.id}>{cid.nome} - {cid.estado_sigla}</option>
                        ))}
                      </select>

                      <button 
                        onClick={() => setEditando(null)} 
                        className="bg-slate-200 text-slate-600 p-2 rounded-lg font-black text-[10px] uppercase mt-2 hover:bg-slate-300 transition-colors"
                      >
                        Cancelar
                      </button>
                      <button 
                        onClick={() => confirmarAlteracao(p.id)} 
                        className="bg-blue-600 text-white p-2 rounded-lg font-black text-[10px] uppercase mt-2 hover:bg-blue-700 transition-colors"
                      >
                        Salvar
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex flex-wrap gap-4 text-[10px] font-bold uppercase">
                        <span className={p.categoria ? "text-blue-600" : "text-red-400"}>📂 {p.categoria || 'Sem categoria'}</span>
                        <span className={p.bairro ? "text-slate-600" : "text-red-400"}>🏠 {p.bairro || 'Sem bairro'}</span>
                        <span className={p.cidades?.nome ? "text-blue-500" : "text-red-400"}>📍 {p.cidades ? `${p.cidades.nome} - ${p.cidades.estado_sigla}` : 'Cidade não definida'}</span>
                      </div>
                      
                      {/* Mantido Habilidades e Tags na Visualização */}
                      <div className="flex flex-wrap gap-1">
                        {p.habilidades?.map((h, i) => (
                          <span key={i} className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded text-[8px] font-black border border-blue-100 uppercase italic">{h}</span>
                        ))}
                        {p.tags?.map((t, i) => (
                          <span key={i} className="px-2 py-0.5 bg-slate-100 text-slate-500 rounded text-[8px] font-black border border-slate-200 uppercase">{t}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex gap-2 shrink-0">
                  <button onClick={() => setEditando(p.id === editando ? null : p.id)} className="p-4 bg-slate-100 rounded-2xl hover:bg-slate-200 transition-colors">🖋️</button>
                  <button 
                    onClick={() => alterarStatus(p.id, p.status === 'ativo' ? 'pendente' : 'ativo')}
                    className={`px-6 py-4 rounded-2xl font-black text-[10px] uppercase transition-all shadow-xl ${v.podeAtivar ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-100' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}
                  >
                    {p.status === 'ativo' ? 'Suspender' : 'Aprovar'}
                  </button>
                </div>

              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}