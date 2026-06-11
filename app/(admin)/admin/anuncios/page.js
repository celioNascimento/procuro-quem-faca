'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export default function AnunciosAdminPage() {
  const [anuncios, setAnuncios] = useState([])
  const [loading, setLoading] = useState(true)
  const [modoEdicao, setModoEdicao] = useState(false)
  const [progressoUpload, setProgressoUpload] = useState(0)
  const [editandoId, setEditandoId] = useState(null)

  // Listas de segmentação (Sem hardcode, devem ser populadas via fetch no banco)
  const [estados, setEstados] = useState([])
  const [regioes, setRegioes] = useState([])
  const [cidades, setCidades] = useState([])
  const [categorias, setCategorias] = useState([])

  const [form, setForm] = useState({
    titulo: '', 
    tipo: 'proprio', // 'proprio' ou 'google' conforme o schema
    codigo_google: '',
    link_destino: '', 
    imagem_url: '', 
    estado_sigla: '', // Vazio = Todos os estados
    regiao_id: '',    // Vazio = Todas as regiões
    cidade_id: '',    // Vazio = Todas as cidades
    categoria_id: '', // Vazio = Todas as categorias
    lance_maximo_cpc: '',
    orcamento_diario: '',
    status_aprovacao: 'aprovado' // Admin criando, já nasce aprovado
  })

  async function fetchDadosGlobais() {
    // Aqui você fará os fetches reais para popular os selects
    // setEstados(await fetchEstados()); setRegioes(await fetchRegioes()); etc.
    
    const { data } = await supabase.from('anuncios').select('*').order('created_at', { ascending: false })
    if (data) setAnuncios(data)
    setLoading(false)
  }

  useEffect(() => { fetchDadosGlobais() }, [])

  function prepararEdicao(an) {
    setEditandoId(an.id)
    setForm({
      titulo: an.titulo || '',
      tipo: an.tipo || 'proprio',
      codigo_google: an.codigo_google || '',
      link_destino: an.link_destino || '',
      imagem_url: an.imagem_url || '',
      estado_sigla: an.estado_sigla || '',
      regiao_id: an.regiao_id || '',
      cidade_id: an.cidade_id || '',
      categoria_id: an.categoria_id || '',
      lance_maximo_cpc: an.lance_maximo_cpc || '',
      orcamento_diario: an.orcamento_diario || '',
      status_aprovacao: an.status_aprovacao || 'pendente'
    })
    setModoEdicao(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const inputBaseStyle = "w-full p-4 bg-white border border-slate-200 rounded-2xl outline-none font-bold transition-all focus:border-blue-500 focus:ring-4 focus:ring-blue-50 shadow-sm placeholder:text-slate-400 text-slate-700";
  const labelStyle = "text-[10px] font-black text-slate-500 uppercase ml-2 tracking-widest mb-2 block";

  async function handleUpload(e) {
    const file = e.target.files[0]
    if (!file) return
    setProgressoUpload(1)
    const fileName = `banner-admin-${Date.now()}.${file.name.split('.').pop()}`
    const { error } = await supabase.storage.from('fotos-perfil').upload(fileName, file, { upsert: true })
    if (error) { alert('Erro: ' + error.message); setProgressoUpload(0); return; }
    setProgressoUpload(100)
    const { data } = supabase.storage.from('fotos-perfil').getPublicUrl(fileName)
    setTimeout(() => { 
      setForm(prev => ({ ...prev, imagem_url: data.publicUrl })); 
      setProgressoUpload(0); 
    }, 500)
  }

  async function salvarAnuncio(e) {
    e.preventDefault()
    if (!form.titulo) return alert('O título é obrigatório.')

    const payload = {
      titulo: form.titulo,
      tipo: form.tipo,
      codigo_google: form.tipo === 'google' ? form.codigo_google : null,
      link_destino: form.link_destino,
      imagem_url: form.imagem_url,
      estado_sigla: form.estado_sigla || null,
      regiao_id: form.regiao_id || null,
      cidade_id: form.cidade_id || null,
      categoria_id: form.categoria_id || null,
      lance_maximo_cpc: form.lance_maximo_cpc ? Number(form.lance_maximo_cpc) : 0,
      orcamento_diario: form.orcamento_diario ? Number(form.orcamento_diario) : 0,
      status_aprovacao: form.status_aprovacao
    }

    if (editandoId) {
      const { error } = await supabase.from('anuncios').update(payload).eq('id', editandoId)
      if (error) return alert('Erro ao atualizar: ' + error.message)
      setAnuncios(anuncios.map(a => a.id === editandoId ? { ...a, ...payload } : a))
    } else {
      const { data, error } = await supabase.from('anuncios').insert([payload]).select()
      if (error) return alert('Erro ao salvar: ' + error.message)
      if (data) setAnuncios([data[0], ...anuncios])
    }

    fecharPainel()
  }

  function fecharPainel() {
    setForm({ titulo: '', tipo: 'proprio', codigo_google: '', link_destino: '', imagem_url: '', estado_sigla: '', regiao_id: '', cidade_id: '', categoria_id: '', lance_maximo_cpc: '', orcamento_diario: '', status_aprovacao: 'aprovado' })
    setModoEdicao(false)
    setEditandoId(null)
  }

  async function alternarStatusGlobal(id, statusAtual) {
    const novoStatus = !statusAtual
    setAnuncios(anuncios.map(a => a.id === id ? { ...a, status: novoStatus } : a))
    await supabase.from('anuncios').update({ status: novoStatus }).eq('id', id)
  }

  async function alterarStatusAprovacao(id, novoStatusAprovacao) {
    if (!confirm(`Confirmar alteração para ${novoStatusAprovacao.toUpperCase()}?`)) return
    setAnuncios(anuncios.map(a => a.id === id ? { ...a, status_aprovacao: novoStatusAprovacao } : a))
    await supabase.from('anuncios').update({ status_aprovacao: novoStatusAprovacao }).eq('id', id)
  }

  return (
    <div className="max-w-7xl mx-auto pb-20 px-4 pt-6 font-sans antialiased text-slate-900">
      
      {/* HEADER ADMIN */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900 uppercase">Gestão de Anúncios</h1>
          <p className="text-slate-500 font-medium text-sm mt-1">Moderação global, campanhas internas e AdSense</p>
        </div>

        <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
          <div className="bg-slate-900 px-6 py-3 rounded-2xl shadow-xl flex flex-col">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">Campanhas Ativas</span>
            <span className="text-xl font-black text-white italic text-center">{anuncios.filter(a => a.status && a.status_aprovacao === 'aprovado').length}</span>
          </div>
          
          <div className="bg-orange-100 px-6 py-3 rounded-2xl shadow-sm flex flex-col">
             <span className="text-[9px] font-black text-orange-600 uppercase tracking-widest text-center">Aprovação Pendente</span>
             <span className="text-xl font-black text-orange-700 italic text-center">{anuncios.filter(a => a.status_aprovacao === 'pendente').length}</span>
          </div>

          {!modoEdicao && (
            <button 
              onClick={() => setModoEdicao(true)} 
              className="flex-1 md:flex-none bg-blue-600 text-white px-8 py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest transition-all active:scale-95 shadow-lg"
            >
              + Criar Manualmente
            </button>
          )}
        </div>
      </header>

      {/* FORMULÁRIO ADMIN */}
      {modoEdicao && (
        <div className={`bg-white border-2 rounded-[2.5rem] p-8 md:p-10 mb-12 shadow-2xl transition-all ${editandoId ? 'border-blue-500 ring-8 ring-blue-50' : 'border-slate-100'}`}>
          <div className="flex items-center gap-4 mb-8">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl ${editandoId ? 'bg-blue-600 text-white' : 'bg-slate-100'}`}>
              {editandoId ? '⚙️' : '🚀'}
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">
                {editandoId ? 'Editando Campanha (Admin)' : 'Nova Campanha Interna/Google'}
              </h2>
            </div>
          </div>

          <form onSubmit={salvarAnuncio} className="space-y-8">
            
            <div className="flex flex-wrap gap-3 p-2 bg-slate-50 rounded-[2rem] border border-slate-100 mb-6">
              <button type="button" onClick={() => setForm({...form, tipo: 'proprio'})} className={`flex-1 py-4 rounded-3xl font-black uppercase text-[10px] tracking-widest transition-all ${form.tipo === 'proprio' ? 'bg-white text-blue-600 shadow-md ring-1 ring-slate-200' : 'text-slate-400 hover:text-slate-600'}`}>🏠 Banner/Plataforma</button>
              <button type="button" onClick={() => setForm({...form, tipo: 'google'})} className={`flex-1 py-4 rounded-3xl font-black uppercase text-[10px] tracking-widest transition-all ${form.tipo === 'google' ? 'bg-white text-orange-600 shadow-md ring-1 ring-slate-200' : 'text-slate-400 hover:text-slate-600'}`}>🌐 Google AdSense</button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* BLOCO: DADOS BÁSICOS */}
              <div className="md:col-span-2 space-y-2 border-b border-slate-100 pb-6">
                <label className={labelStyle}>Nome da Campanha</label>
                <input className={inputBaseStyle} placeholder="Nome para controle interno" value={form.titulo} onChange={e => setForm({...form, titulo: e.target.value})} />
              </div>

              {/* BLOCO: SEGMENTAÇÃO (AGORA COM REGIÃO E SEM HARDCODE) */}
              <div className="md:col-span-2 bg-slate-50 p-6 rounded-[2rem] grid grid-cols-1 md:grid-cols-4 gap-4">
                <h3 className="md:col-span-4 text-[11px] font-black text-slate-800 uppercase tracking-widest mb-2">Segmentação / Público Alvo</h3>
                
                <div className="space-y-2">
                  <label className={labelStyle}>Estado</label>
                  <select className={inputBaseStyle} value={form.estado_sigla} onChange={e => setForm({...form, estado_sigla: e.target.value})}>
                    <option value="">Brasil (Todos)</option>
                    {estados.map(est => <option key={est.sigla} value={est.sigla}>{est.nome}</option>)}
                  </select>
                </div>
                
                <div className="space-y-2">
                  <label className={labelStyle}>Região</label>
                  <select className={inputBaseStyle} value={form.regiao_id} onChange={e => setForm({...form, regiao_id: e.target.value})}>
                    <option value="">Todas as Regiões</option>
                    {regioes.map(reg => <option key={reg.id} value={reg.id}>{reg.nome}</option>)}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className={labelStyle}>Cidade</label>
                  <select className={inputBaseStyle} value={form.cidade_id} onChange={e => setForm({...form, cidade_id: e.target.value})}>
                    <option value="">Todas as Cidades</option>
                    {cidades.map(cid => <option key={cid.id} value={cid.id}>{cid.nome}</option>)}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className={labelStyle}>Categoria</label>
                  <select className={inputBaseStyle} value={form.categoria_id} onChange={e => setForm({...form, categoria_id: e.target.value})}>
                    <option value="">Todas as Categorias</option>
                    {categorias.map(cat => <option key={cat.id} value={cat.id}>{cat.nome}</option>)}
                  </select>
                </div>
              </div>

              {/* BLOCO: CONTEÚDO VISUAL / SCRIPT */}
              <div className="md:col-span-2 space-y-2 mt-4">
                <label className={labelStyle}>
                  {form.tipo === 'google' ? 'Script do AdSense (Código do Slot)' : 'Link de Redirecionamento (URL)'}
                </label>
                {form.tipo === 'google' ? (
                  <textarea className={`${inputBaseStyle} h-32 font-mono text-[11px]`} placeholder="<ins class='adsbygoogle'..." value={form.codigo_google} onChange={e => setForm({...form, codigo_google: e.target.value})} />
                ) : (
                  <input className={inputBaseStyle} placeholder="https://..." value={form.link_destino} onChange={e => setForm({...form, link_destino: e.target.value})} />
                )}
              </div>

              {form.tipo !== 'google' && (
                <div className="md:col-span-2">
                  <label className={labelStyle}>Criativo (Imagem)</label>
                  <div className="relative p-10 border-2 border-dashed border-slate-200 rounded-[2.5rem] bg-slate-50 flex flex-col items-center justify-center hover:bg-white hover:border-blue-300 transition-all group">
                    <input type="file" onChange={handleUpload} className="absolute inset-0 opacity-0 cursor-pointer z-10" />
                    {progressoUpload > 0 ? (
                      <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest animate-pulse">Subindo: {progressoUpload}%</span>
                    ) : form.imagem_url ? (
                      <div className="flex flex-col items-center gap-4">
                        <img src={form.imagem_url} className="h-24 rounded-xl shadow-lg border-2 border-white" alt="Preview" />
                        <span className="text-[9px] font-black text-blue-600 uppercase bg-blue-50 px-4 py-2 rounded-full ring-1 ring-blue-100">Trocar Imagem</span>
                      </div>
                    ) : (
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Clique para selecionar imagem</p>
                    )}
                  </div>
                </div>
              )}

              {/* BLOCO: ADMIN OVERRIDE STATUS */}
              {editandoId && (
                <div className="md:col-span-2 mt-4 space-y-2">
                   <label className={labelStyle}>Status de Moderação (Admin)</label>
                   <select className={`${inputBaseStyle} bg-slate-900 text-white border-none font-black`} value={form.status_aprovacao} onChange={e => setForm({...form, status_aprovacao: e.target.value})}>
                     <option value="pendente">Pendente (Em Análise)</option>
                     <option value="aprovado">Aprovado (Permitir Exibição)</option>
                     <option value="rejeitado">Rejeitado (Bloquear Imagem/Conteúdo)</option>
                     <option value="saldo_esgotado">Pausado por Falta de Saldo</option>
                   </select>
                </div>
              )}
            </div>
            
            <div className="flex flex-col md:flex-row gap-4">
              <button 
                type="submit" 
                className={`flex-[2] p-5 text-white rounded-3xl font-black uppercase text-[11px] tracking-[0.2em] transition-all shadow-xl active:scale-95 ${editandoId ? 'bg-blue-600 shadow-blue-100' : 'bg-slate-900 shadow-slate-200'}`}
              >
                {editandoId ? 'Salvar Edição Admin' : 'Criar Campanha Plataforma'}
              </button>
              <button 
                type="button"
                onClick={fecharPainel}
                className="flex-1 p-5 bg-slate-100 text-slate-500 rounded-3xl font-black uppercase text-[11px] tracking-[0.2em] transition-all hover:bg-slate-200 active:scale-95"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* LISTAGEM MODERAÇÃO (ADMIN) */}
      <div className="bg-white border border-slate-100 rounded-[2rem] overflow-hidden shadow-sm">
        <div className="p-6 border-b border-slate-50 bg-slate-50/50 flex justify-between items-center text-slate-500">
          <h3 className="text-[11px] font-black uppercase tracking-widest">Controle Global de Anúncios</h3>
          <span className="bg-slate-200 text-slate-600 text-[9px] font-black px-3 py-1 rounded-full">{anuncios.length} Registros</span>
        </div>

        <div className="divide-y divide-slate-50">
          {loading ? (
            <div className="p-20 text-center animate-pulse text-[10px] font-black text-slate-300 uppercase">Carregando banco de dados...</div>
          ) : anuncios.map(an => {
            const estaEditando = editandoId === an.id;
            return (
              <div key={an.id} className={`p-4 md:p-6 flex flex-col lg:flex-row items-start lg:items-center justify-between transition-all hover:bg-slate-50 group gap-4 ${estaEditando ? 'bg-blue-50/50' : ''}`}>
                
                <div className="flex items-center gap-6">
                  <div className={`w-20 h-14 rounded-xl bg-slate-100 overflow-hidden flex items-center justify-center border border-slate-200 flex-shrink-0`}>
                    {an.tipo === 'google' ? '🌐' : an.imagem_url ? <img src={an.imagem_url} className="w-full h-full object-cover" /> : '🏠'}
                  </div>

                  <div>
                    <h3 className={`font-black uppercase text-[12px] ${an.status ? 'text-slate-800' : 'text-slate-400'}`}>
                      {an.titulo}
                    </h3>
                    <div className="flex flex-wrap gap-2 mt-1.5 text-[9px] font-bold uppercase tracking-tighter">
                      <span className={an.tipo === 'google' ? 'text-orange-600' : 'text-blue-600'}>{an.tipo}</span>
                      
                      {/* Badge Moderação */}
                      {an.status_aprovacao === 'pendente' && <span className="bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded animate-pulse">Revisão Pendente</span>}
                      {an.status_aprovacao === 'rejeitado' && <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded">Rejeitado</span>}
                      {an.status_aprovacao === 'aprovado' && <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded">Aprovado</span>}
                      
                      {/* Segmentação Resumo */}
                      {(an.estado_sigla || an.cidade_id || an.categoria_id) && (
                        <span className="text-slate-400 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">Segmentado</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col lg:flex-row items-end lg:items-center gap-4 w-full lg:w-auto">
                  
                  {/* Ações Rápidas de Moderação (Admin) */}
                  {an.status_aprovacao === 'pendente' && (
                    <div className="flex gap-2">
                       <button onClick={() => alterarStatusAprovacao(an.id, 'aprovado')} className="bg-green-500 text-white text-[9px] font-black uppercase px-3 py-1.5 rounded-lg hover:bg-green-600 transition-colors">Aprovar</button>
                       <button onClick={() => alterarStatusAprovacao(an.id, 'rejeitado')} className="bg-red-500 text-white text-[9px] font-black uppercase px-3 py-1.5 rounded-lg hover:bg-red-600 transition-colors">Rejeitar</button>
                    </div>
                  )}

                  <div className="h-8 w-px bg-slate-200 hidden lg:block mx-2"></div>

                  {/* Toggle Exibição */}
                  <button 
                    onClick={() => alternarStatusGlobal(an.id, an.status)} 
                    className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${an.status ? 'text-green-600 bg-green-50 ring-1 ring-green-100' : 'text-slate-400 bg-slate-50 ring-1 ring-slate-200'}`}
                  >
                    {an.status ? 'ON (Ativo)' : 'OFF (Pausado)'}
                  </button>
                  
                  <div className="flex items-center gap-2 opacity-100 lg:opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => prepararEdicao(an)} 
                      className={`p-2.5 rounded-xl transition-all ${estaEditando ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-blue-50 hover:text-blue-600'}`}
                    >
                      ✏️
                    </button>
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      </div>
    </div>
  )
}
