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
  const [denunciasSelecionadas, setDenunciasSelecionadas] = useState(null)
  const [mounted, setMounted] = useState(false)

  const [termoBusca, setTermoBusca] = useState('')
  const [categoriaFiltro, setCategoriaFiltro] = useState('')

  useEffect(() => {
    setMounted(true)
    carregarDados()

    const canal = supabase.channel('mod_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'denuncias' }, () => carregarDados())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'prestadores' }, () => carregarDados())
      .subscribe()
    return () => { supabase.removeChannel(canal) }
  }, [])

  const formatarData = (dataISO) => {
    if (!dataISO) return 'Data n/a'
    return new Date(dataISO).toLocaleDateString('pt-BR')
  }

  async function carregarDados() {
    setLoading(true)
    try {
      const { data: cData } = await supabase.from('cidades').select('id, nome, estado_sigla').order('nome')
      setCidades(cData || [])

      const { data, error } = await supabase
        .from('prestadores')
        .select(`
          *,
          cidades(nome, estado_sigla),
          denuncias(*)
        `)
        .order('created_at', { ascending: false })

      if (error) throw error

      const processados = (data || []).map(p => {
        const denunciasAbertas = (p.denuncias || []).filter(d => d.status === 'aberta')
        return {
          ...p,
          totalDenuncias: denunciasAbertas.length,
          listaDenuncias: denunciasAbertas
        }
      })

      const ordenados = processados.sort((a, b) => {
        const aCritico = a.bloqueado || a.totalDenuncias > 0
        const bCritico = b.bloqueado || b.totalDenuncias > 0
        if (aCritico && !bCritico) return -1
        if (!aCritico && bCritico) return 1
        return 0
      })

      setPrestadores(ordenados)
    } catch (e) { console.error(e) } finally { setLoading(false) }
  }

  async function alterarStatus(id, novoStatus) {
    if (salvando) return;

    if (novoStatus === 'ativo') {
       const p = prestadores.find(item => String(item.id) === String(id))
       const temDados = p && p.nome && p.categoria && p.cidade_id;
       if (!temDados) return alert("❌ Cadastro incompleto (Nome, Categoria ou Cidade faltando).")
    }

    setSalvando(true)
    try {
      const updateData = { 
        status: novoStatus, 
        aprovado_em: novoStatus === 'ativo' ? new Date().toISOString() : null,
        bloqueado: novoStatus === 'bloqueado' 
      }

      const { error } = await supabase
        .from('prestadores')
        .update(updateData)
        .eq('id', Number(id))

      if (error) throw error
      await carregarDados()
      
    } catch (error) {
      alert(`Erro ao atualizar: ${error.message}`)
    } finally {
      setSalvando(false)
    }
  }

  async function resolverDenuncias(id) {
    if (!confirm("Isso arquivará as denúncias e manterá o perfil ativo. Continuar?")) return;
    setSalvando(true)
    try {
      await supabase.from('denuncias').update({ status: 'resolvida', resolvido_em: new Date() }).eq('prestador_id', Number(id))
      await supabase.from('prestadores').update({ bloqueado: false, motivo_bloqueio: null }).eq('id', Number(id))
      await carregarDados()
      setDenunciasSelecionadas(null)
    } catch (err) { alert("Erro ao limpar.") } finally { setSalvando(false) }
  }

  async function salvarEdicao(id) {
    const b = document.getElementById(`b-${id}`).value
    const cid = document.getElementById(`c-${id}`).value
    const cat = document.getElementById(`cat-${id}`).value
    setSalvando(true)
    await supabase.from('prestadores').update({ bairro: b, cidade_id: cid, categoria: cat }).eq('id', id)
    await carregarDados()
    setEditando(null)
    setSalvando(false)
  }

  if (!mounted) return null

  const listaExibida = prestadores.filter(p => {
    const termo = termoBusca.toLowerCase()
    const matchTexto = !termo || p.nome?.toLowerCase().includes(termo) || p.cidades?.nome?.toLowerCase().includes(termo)
    const matchCat = !categoriaFiltro || p.categoria === categoriaFiltro
    return matchTexto && matchCat
  })

  return (
    <div className="max-w-5xl mx-auto px-6 py-10 bg-[#F4F7F9] min-h-screen font-sans text-slate-800">
      {salvando && (
        <div className="fixed inset-0 bg-white/60 z-[100] flex items-center justify-center cursor-wait backdrop-blur-sm">
          <div className="bg-white p-4 rounded-full shadow-xl">
             <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        </div>
      )}

      <header className="mb-10">
        <h1 className="text-3xl font-black text-slate-900 uppercase italic">Moderação</h1>
        <div className="flex flex-col md:flex-row gap-4 mt-6">
          <select value={categoriaFiltro} onChange={e => setCategoriaFiltro(e.target.value)} className="p-3 rounded-xl border border-slate-200 font-bold text-xs bg-white text-slate-800 outline-none">
            <option value="">Todas as Categorias</option>
            {CATEGORIAS_OFICIAIS.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <input type="text" value={termoBusca} onChange={e => setTermoBusca(e.target.value)} placeholder="Buscar prestador..." className="flex-1 p-3 rounded-xl border border-slate-200 font-bold text-xs bg-white text-slate-800 outline-none" />
        </div>
      </header>

      <div className="grid gap-6">
        {loading && prestadores.length === 0 ? (
          <div className="py-20 text-center animate-pulse font-black text-slate-400 uppercase tracking-widest">Carregando dados...</div>
        ) : listaExibida.map(p => {
          
          const temDenunciaAberta = p.totalDenuncias > 0
          
          let statusCor = ''
          let statusTexto = p.status.toUpperCase()

          if (p.status === 'bloqueado') {
            statusCor = 'bg-red-600 text-white'
          } else if (temDenunciaAberta) {
            statusCor = 'bg-amber-400 text-slate-900 ring-2 ring-amber-200 animate-pulse'
            statusTexto = '⚠️ VERIFICAR' 
          } else if (p.status === 'ativo') {
            statusCor = 'bg-green-500 text-white'
          } else {
            statusCor = 'bg-slate-200 text-slate-500'
          }

          return (
            <div key={p.id} className={`bg-white rounded-[2.2rem] p-6 shadow-sm border transition-all ${
              p.status === 'bloqueado' ? 'border-red-200 bg-red-50/20' : 
              temDenunciaAberta ? 'border-amber-300 bg-amber-50/20' : 'border-slate-100'
            }`}>
              <div className="flex flex-col md:flex-row items-center gap-6">
                <div className="w-20 h-20 rounded-2xl overflow-hidden shadow-md shrink-0 bg-slate-200">
                  <img src={p.foto_perfil || 'https://via.placeholder.com/150'} className="w-full h-full object-cover" />
                </div>

                <div className="flex-1 w-full">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">{p.nome || 'SEM NOME'}</h3>
                    
                    {temDenunciaAberta && (
                      <button 
                        onClick={() => setDenunciasSelecionadas({ lista: p.listaDenuncias, id: p.id, motivo: p.motivo_bloqueio })}
                        className="bg-red-600 text-white px-2 py-1 rounded text-[8px] font-black uppercase shadow-sm hover:scale-105 transition-transform"
                      >
                        🚨 {p.totalDenuncias} Report(s)
                      </button>
                    )}

                    <span className={`px-2 py-1 rounded text-[8px] font-black uppercase tracking-widest ${statusCor}`}>
                      {statusTexto}
                    </span>
                  </div>

                  {editando === p.id ? (
                     <div className="grid grid-cols-2 gap-2 bg-slate-50 p-4 rounded-2xl border border-blue-100 mt-2">
                      <select id={`cat-${p.id}`} defaultValue={p.categoria} className="col-span-2 p-2 rounded-lg text-xs font-bold text-slate-800 border">{CATEGORIAS_OFICIAIS.map(c => <option key={c} value={c}>{c}</option>)}</select>
                      <input id={`b-${p.id}`} defaultValue={p.bairro} placeholder="Bairro" className="p-2 rounded-lg text-xs font-bold text-slate-800 border" />
                      <select id={`c-${p.id}`} defaultValue={p.cidade_id} className="p-2 rounded-lg text-xs font-bold text-slate-800 border">
                        <option value="">Cidade</option>
                        {cidades.map(cid => <option key={cid.id} value={cid.id}>{cid.nome}</option>)}
                      </select>
                      <div className="col-span-2 flex gap-2 pt-2">
                        <button onClick={() => setEditando(null)} className="flex-1 bg-slate-200 text-slate-600 p-2 rounded-lg text-[10px] font-black uppercase">Cancelar</button>
                        <button onClick={() => salvarEdicao(p.id)} className="flex-1 bg-blue-600 text-white p-2 rounded-lg text-[10px] font-black uppercase">Salvar</button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-4 text-[10px] font-bold uppercase text-slate-400 mt-1">
                      <span className="text-blue-600">📂 {p.categoria}</span>
                      <span className="text-blue-500">📍 {p.cidades?.nome}</span>
                      <span className="text-slate-500">🏠 {p.bairro}</span>
                    </div>
                  )}
                </div>

                <div className="flex gap-2 shrink-0">
                  <button onClick={() => setEditando(p.id === editando ? null : p.id)} className="p-4 bg-slate-100 rounded-2xl hover:bg-slate-200 transition-colors text-slate-600">🖋️</button>
                  
                  <button 
                    onClick={() => alterarStatus(p.id, p.status === 'bloqueado' ? 'pendente' : 'bloqueado')} 
                    className={`p-4 rounded-2xl transition-colors ${p.status === 'bloqueado' ? 'bg-red-600 text-white' : 'bg-slate-100 text-slate-400 hover:text-red-600'}`}
                  >
                    {p.status === 'bloqueado' ? '🔓' : '🔒'}
                  </button>
                  
                  <button 
                    onClick={() => alterarStatus(p.id, p.status === 'ativo' ? 'pendente' : 'ativo')} 
                    className={`px-6 py-4 rounded-2xl font-black text-[10px] uppercase shadow-xl transition-all active:scale-95 ${p.status === 'ativo' ? 'bg-slate-200 text-slate-500' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
                  >
                    {p.status === 'ativo' ? 'Suspender' : 'Aprovar'}
                  </button>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {denunciasSelecionadas && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4" onClick={() => setDenunciasSelecionadas(null)}>
          <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95" onClick={e => e.stopPropagation()}>
            <div className="p-8 border-b border-slate-50 flex justify-between items-center">
              <h2 className="font-black text-slate-900 uppercase italic">Detalhes da Denúncia</h2>
              <button onClick={() => setDenunciasSelecionadas(null)} className="text-slate-400 hover:text-red-500 text-xl font-bold">✕</button>
            </div>
            <div className="p-8 max-h-[60vh] overflow-y-auto space-y-4">
              {denunciasSelecionadas.lista.map((d, i) => (
                <div key={i} className="bg-slate-50 p-5 rounded-[2rem] border border-slate-100">
                  <p className="text-slate-700 text-xs font-bold italic">"{d.motivo}"</p>
                  <p className="text-[9px] text-slate-400 font-black uppercase mt-2">
                    {formatarData(d.created_at)}
                  </p>
                </div>
              ))}
              <button 
                onClick={() => resolverDenuncias(denunciasSelecionadas.id)}
                className="w-full mt-4 py-4 bg-green-100 text-green-700 rounded-2xl font-black text-[10px] uppercase hover:bg-green-200 transition-colors"
              >
                ✅ Marcar como Verificado
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}