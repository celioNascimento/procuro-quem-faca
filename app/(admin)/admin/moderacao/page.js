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
    if (!dataISO) return 'n/a'
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
       if (!temDados) return alert("❌ Cadastro incompleto.")
    }

    setSalvando(true)
    try {
      const updateData = { 
        status: novoStatus, 
        aprovado_em: novoStatus === 'ativo' ? new Date().toISOString() : null,
        bloqueado: novoStatus === 'bloqueado' 
      }
      await supabase.from('prestadores').update(updateData).eq('id', Number(id))
      await carregarDados()
    } catch (error) { alert("Erro ao atualizar status.") } finally { setSalvando(false) }
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
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-10 bg-[#F4F7F9] min-h-screen font-sans text-slate-700">
      
      {/* Loading Overlay */}
      {salvando && (
        <div className="fixed inset-0 bg-white/60 z-[100] flex items-center justify-center backdrop-blur-sm">
          <div className="bg-white p-4 rounded-full shadow-xl animate-bounce">
              <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        </div>
      )}

      <header className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 uppercase tracking-tight">
          Moderação<span className="text-blue-600">.</span>
        </h1>
        <div className="flex flex-col gap-3 mt-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <select 
              value={categoriaFiltro} 
              onChange={e => setCategoriaFiltro(e.target.value)} 
              className="p-4 rounded-2xl border border-slate-200 font-semibold text-[11px] bg-white text-slate-700 outline-none shadow-sm appearance-none"
            >
              <option value="">Todas as Categorias</option>
              {CATEGORIAS_OFICIAIS.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <input 
              type="text" 
              value={termoBusca} 
              onChange={e => setTermoBusca(e.target.value)} 
              placeholder="Buscar por nome ou cidade..." 
              className="p-4 rounded-2xl border border-slate-200 font-semibold text-[11px] bg-white text-slate-700 outline-none shadow-sm"
            />
          </div>
        </div>
      </header>

      <div className="grid gap-4 sm:gap-6">
        {loading && prestadores.length === 0 ? (
          <div className="py-20 text-center animate-pulse font-bold text-slate-400 uppercase tracking-widest text-[10px]">Sincronizando dados...</div>
        ) : listaExibida.map(p => {
          const temDenunciaAberta = p.totalDenuncias > 0
          let statusEstilo = {
            bg: 'bg-slate-100',
            text: 'text-slate-500',
            label: p.status.toUpperCase()
          }

          if (p.status === 'bloqueado') {
            statusEstilo = { bg: 'bg-red-600', text: 'text-white', label: 'BLOQUEADO' }
          } else if (temDenunciaAberta) {
            statusEstilo = { bg: 'bg-amber-400', text: 'text-slate-900', label: '⚠️ VERIFICAR' }
          } else if (p.status === 'ativo') {
            statusEstilo = { bg: 'bg-green-500', text: 'text-white', label: 'ATIVO' }
          }

          return (
            <div key={p.id} className={`bg-white rounded-[2rem] p-4 sm:p-6 shadow-sm border-2 transition-all ${
              p.status === 'bloqueado' ? 'border-red-100 bg-red-50/10' : 
              temDenunciaAberta ? 'border-amber-200 bg-amber-50/10' : 'border-white'
            }`}>
              <div className="flex flex-col lg:flex-row items-center lg:items-center gap-5">
                
                <div className="flex lg:block items-center justify-between w-full lg:w-auto">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden shadow-inner bg-slate-100 border border-slate-100">
                    <img src={p.foto_perfil || 'https://via.placeholder.com/150'} className="w-full h-full object-cover" alt={p.nome} />
                  </div>
                  <div className="lg:hidden flex flex-col items-end gap-2">
                    <span className={`px-2 py-1 rounded-lg text-[9px] font-bold uppercase tracking-widest ${statusEstilo.bg} ${statusEstilo.text}`}>
                      {statusEstilo.label}
                    </span>
                    {temDenunciaAberta && (
                      <div className="bg-red-600 text-white px-2 py-1 rounded-lg text-[9px] font-bold animate-pulse">
                        🚨 {p.totalDenuncias} REPORT
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex-1 w-full text-center lg:text-left">
                  <div className="hidden lg:flex items-center gap-3 mb-2">
                    <h3 className="text-xl font-bold text-slate-900 uppercase tracking-tight leading-none">{p.nome || 'SEM NOME'}</h3>
                    <span className={`px-2 py-1 rounded-lg text-[9px] font-bold uppercase tracking-widest ${statusEstilo.bg} ${statusEstilo.text}`}>
                      {statusEstilo.label}
                    </span>
                  </div>

                  <div className="lg:hidden mb-4">
                     <h3 className="text-lg font-bold text-slate-900 uppercase leading-none">{p.nome || 'SEM NOME'}</h3>
                  </div>

                  {editando === p.id ? (
                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-slate-50 p-4 rounded-2xl border border-blue-100">
                      <select id={`cat-${p.id}`} defaultValue={p.categoria} className="sm:col-span-2 p-3 rounded-xl text-[11px] font-semibold text-slate-700 border bg-white">{CATEGORIAS_OFICIAIS.map(c => <option key={c} value={c}>{c}</option>)}</select>
                      <input id={`b-${p.id}`} defaultValue={p.bairro} placeholder="Bairro" className="p-3 rounded-xl text-[11px] font-semibold text-slate-700 border bg-white" />
                      <select id={`c-${p.id}`} defaultValue={p.cidade_id} className="p-3 rounded-xl text-[11px] font-semibold text-slate-700 border bg-white">
                        <option value="">Cidade</option>
                        {cidades.map(cid => <option key={cid.id} value={cid.id}>{cid.nome}</option>)}
                      </select>
                      <div className="sm:col-span-2 flex gap-2 pt-2">
                        <button onClick={() => setEditando(null)} className="flex-1 bg-slate-200 text-slate-600 p-3 rounded-xl text-[11px] font-bold uppercase">Cancelar</button>
                        <button onClick={() => salvarEdicao(p.id)} className="flex-1 bg-blue-600 text-white p-3 rounded-xl text-[11px] font-bold uppercase">Salvar</button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-wrap justify-center lg:justify-start gap-2 sm:gap-4 text-[10px] font-semibold uppercase text-slate-400">
                      <span className="text-blue-600 bg-blue-50 px-2 py-1 rounded-md">📂 {p.categoria}</span>
                      <span className="text-slate-500 bg-slate-50 px-2 py-1 rounded-md">📍 {p.cidades?.nome}</span>
                      <span className="text-slate-400 bg-slate-50 px-2 py-1 rounded-md">🏠 {p.bairro}</span>
                    </div>
                  )}
                </div>

                <div className="flex w-full lg:w-auto gap-2 mt-4 lg:mt-0 pt-4 lg:pt-0 border-t lg:border-t-0 border-slate-100 justify-between sm:justify-end">
                  <div className="flex gap-2">
                    <button onClick={() => setEditando(p.id === editando ? null : p.id)} className="p-4 bg-slate-100 rounded-2xl hover:bg-slate-200 transition-colors text-slate-600">🖋️</button>
                    <button 
                      onClick={() => alterarStatus(p.id, p.status === 'bloqueado' ? 'pendente' : 'bloqueado')} 
                      className={`p-4 rounded-2xl transition-all ${p.status === 'bloqueado' ? 'bg-red-600 text-white' : 'bg-slate-100 text-slate-400 hover:text-red-600'}`}
                    >
                      {p.status === 'bloqueado' ? '🔓' : '🔒'}
                    </button>
                  </div>
                  
                  <div className="flex gap-2 items-center">
                    {temDenunciaAberta && (
                      <button 
                        onClick={() => setDenunciasSelecionadas({ lista: p.listaDenuncias, id: p.id })}
                        className="hidden lg:block bg-red-600 text-white px-4 py-4 rounded-2xl font-bold text-[10px] uppercase shadow-lg shadow-red-100 hover:scale-105 transition-transform"
                      >
                        🚨 Ver Denúncias
                      </button>
                    )}
                    <button 
                      onClick={() => alterarStatus(p.id, p.status === 'ativo' ? 'pendente' : 'ativo')} 
                      className={`px-6 py-4 rounded-2xl font-bold text-[10px] uppercase shadow-xl transition-all active:scale-95 ${p.status === 'ativo' ? 'bg-slate-200 text-slate-500' : 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-100'}`}
                    >
                      {p.status === 'ativo' ? 'Suspender' : 'Aprovar'}
                    </button>
                  </div>
                </div>

                {temDenunciaAberta && (
                  <button 
                    onClick={() => setDenunciasSelecionadas({ lista: p.listaDenuncias, id: p.id })}
                    className="lg:hidden w-full py-3 bg-red-50 text-red-600 rounded-xl font-bold text-[10px] uppercase tracking-wide border border-red-100"
                  >
                    Analisar Denúncias em Aberto
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {denunciasSelecionadas && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[200] flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={() => setDenunciasSelecionadas(null)}>
          <div className="bg-white w-full max-w-lg rounded-t-[2.5rem] sm:rounded-[2.5rem] shadow-2xl overflow-hidden animate-in slide-in-from-bottom sm:zoom-in-95" onClick={e => e.stopPropagation()}>
            <div className="p-6 sm:p-8 border-b border-slate-50 flex justify-between items-center">
              <div>
                <h2 className="font-bold text-slate-900 uppercase tracking-tight">Central de Denúncias</h2>
                <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-widest mt-1">Análise de Segurança</p>
              </div>
              <button onClick={() => setDenunciasSelecionadas(null)} className="text-slate-300 hover:text-red-500 p-2 text-2xl">✕</button>
            </div>
            <div className="p-6 sm:p-8 max-h-[70vh] overflow-y-auto space-y-4 scrollbar-hide">
              {denunciasSelecionadas.lista.map((d, i) => (
                <div key={i} className="bg-slate-50 p-5 rounded-[2rem] border border-slate-100 relative overflow-hidden group">
                  <div className="absolute top-0 left-0 w-1 h-full bg-red-500 opacity-20"></div>
                  <p className="text-slate-700 text-[13px] font-medium leading-relaxed">"{d.motivo}"</p>
                  <p className="text-[10px] text-slate-400 font-bold uppercase mt-3 flex justify-between">
                    <span>📅 {formatarData(d.created_at)}</span>
                    <span className="text-red-400">ID: #{d.id}</span>
                  </p>
                </div>
              ))}
              <div className="pt-4 space-y-3">
                <button 
                  onClick={() => resolverDenuncias(denunciasSelecionadas.id)}
                  className="w-full py-5 bg-green-500 text-white rounded-2xl font-bold text-[11px] uppercase hover:bg-green-600 transition-all shadow-lg shadow-green-100 active:scale-95"
                >
                  ✅ Marcar como Verificado (Limpar)
                </button>
                <button 
                  onClick={() => {
                    alterarStatus(denunciasSelecionadas.id, 'bloqueado');
                    setDenunciasSelecionadas(null);
                  }}
                  className="w-full py-4 text-red-500 font-bold text-[11px] uppercase tracking-widest hover:bg-red-50 rounded-2xl transition-colors"
                >
                  Bloquear Prestador Agora
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}