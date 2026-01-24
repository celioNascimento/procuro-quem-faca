'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export default function AnunciosPage() {
  const [anuncios, setAnuncios] = useState([])
  const [loading, setLoading] = useState(true)
  const [modoEdicao, setModoEdicao] = useState(false)
  const [progressoUpload, setProgressoUpload] = useState(0)
  const [editandoId, setEditandoId] = useState(null)

  const [form, setForm] = useState({
    titulo: '', 
    tipo: 'vip', 
    codigo_google: '', 
    posicao: 'topo', 
    imagem_url: '', 
    link_destino: '', 
    valor_vip: '', 
    expira_em: ''
  })

  useEffect(() => { fetchAnuncios() }, [])

  async function fetchAnuncios() {
    const { data } = await supabase.from('anuncios').select('*').order('created_at', { ascending: false })
    if (data) setAnuncios(data)
    setLoading(false)
  }

  function prepararEdicao(an) {
    setEditandoId(an.id)
    setForm({
      titulo: an.titulo || '',
      tipo: an.tipo || 'vip',
      codigo_google: an.codigo_google || '',
      posicao: an.posicao || 'topo',
      imagem_url: an.imagem_url || '',
      link_destino: an.link_destino || '',
      valor_vip: an.valor_vip || '',
      expira_em: an.expira_em || ''
    })
    setModoEdicao(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const isVipValido = (an) => {
    if (an.tipo !== 'vip' || !an.expira_em) return true;
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const dataExp = new Date(an.expira_em);
    return dataExp >= hoje;
  }

  const totalFaturamento = anuncios
    .filter(an => an.status && an.tipo === 'vip' && isVipValido(an))
    .reduce((acc, curr) => acc + Number(curr.valor_vip || 0), 0)

  const inputBaseStyle = "w-full p-4 bg-white border border-slate-200 rounded-2xl outline-none font-bold transition-all focus:border-blue-500 focus:ring-4 focus:ring-blue-50 shadow-sm placeholder:text-slate-400 text-slate-700";

  async function handleUpload(e) {
    const file = e.target.files[0]
    if (!file) return
    setProgressoUpload(1)
    const fileName = `banner-${Date.now()}.${file.name.split('.').pop()}`
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
      posicao: form.posicao,
      link_destino: form.link_destino,
      imagem_url: form.imagem_url,
      codigo_google: form.codigo_google,
      status: true,
      expira_em: form.expira_em === "" ? null : form.expira_em,
      valor_vip: form.valor_vip === "" ? 0 : Number(form.valor_vip)
    }

    if (editandoId) {
      const { error } = await supabase.from('anuncios').update(payload).eq('id', editandoId)
      if (error) return alert('Erro ao atualizar: ' + error.message)
      setAnuncios(anuncios.map(a => a.id === editandoId ? { ...a, ...payload } : a))
    } else {
      const { data, error } = await supabase.from('anuncios').insert([payload]).select()
      if (error) return alert('Erro ao salvar: ' + error.message)
      setAnuncios([data[0], ...anuncios])
    }

    fecharPainel()
  }

  function fecharPainel() {
    setForm({ titulo: '', tipo: 'vip', codigo_google: '', posicao: 'topo', imagem_url: '', link_destino: '', valor_vip: '', expira_em: '' })
    setModoEdicao(false)
    setEditandoId(null)
  }

  async function alternarStatus(id, statusAtual) {
    const novoStatus = !statusAtual
    setAnuncios(anuncios.map(a => a.id === id ? { ...a, status: novoStatus } : a))
    await supabase.from('anuncios').update({ status: novoStatus }).eq('id', id)
  }

  async function excluirAnuncio(id) {
    if (!confirm("Excluir anúncio permanentemente?")) return
    setAnuncios(anuncios.filter(a => a.id !== id))
    await supabase.from('anuncios').delete().eq('id', id)
  }

  return (
    <div className="max-w-6xl mx-auto pb-20 px-4 pt-6 font-sans antialiased text-slate-900">
      
      {/* HEADER */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900 uppercase">Anúncios</h1>
          <p className="text-slate-500 font-medium text-sm mt-1">Gestão de banners e monetização</p>
        </div>

        <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
          <div className="bg-blue-600 px-6 py-3 rounded-2xl shadow-xl shadow-blue-200 flex flex-col">
            <span className="text-[9px] font-black text-blue-100 uppercase tracking-widest text-center">Faturamento VIP Ativo</span>
            <span className="text-xl font-black text-white italic">R$ {totalFaturamento.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
          </div>
          
          {!modoEdicao && (
            <button 
              onClick={() => setModoEdicao(true)} 
              className="flex-1 md:flex-none bg-slate-900 text-white px-8 py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest transition-all active:scale-95 shadow-lg"
            >
              + Nova Campanha
            </button>
          )}
        </div>
      </header>

      {/* FORMULÁRIO */}
      {modoEdicao && (
        <div className={`bg-white border-2 rounded-[2.5rem] p-8 md:p-10 mb-12 shadow-2xl transition-all ${editandoId ? 'border-blue-500 ring-8 ring-blue-50' : 'border-slate-100'}`}>
          <div className="flex items-center gap-4 mb-8">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl ${editandoId ? 'bg-blue-600 text-white' : 'bg-slate-100'}`}>
              {editandoId ? '✏️' : '🚀'}
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">
                {editandoId ? 'Editando Campanha' : 'Lançar Nova Campanha'}
              </h2>
            </div>
          </div>

          <form onSubmit={salvarAnuncio} className="space-y-8">
            <div className="flex flex-wrap gap-3 p-2 bg-slate-50 rounded-[2rem] border border-slate-100">
              <button type="button" onClick={() => setForm({...form, tipo: 'vip'})} className={`flex-1 py-4 rounded-3xl font-black uppercase text-[10px] tracking-widest transition-all ${form.tipo === 'vip' ? 'bg-white text-blue-600 shadow-md ring-1 ring-slate-200' : 'text-slate-400 hover:text-slate-600'}`}>💰 VIP</button>
              <button type="button" onClick={() => setForm({...form, tipo: 'proprio'})} className={`flex-1 py-4 rounded-3xl font-black uppercase text-[10px] tracking-widest transition-all ${form.tipo === 'proprio' ? 'bg-white text-slate-900 shadow-md ring-1 ring-slate-200' : 'text-slate-400 hover:text-slate-600'}`}>🏠 Interno</button>
              <button type="button" onClick={() => setForm({...form, tipo: 'google'})} className={`flex-1 py-4 rounded-3xl font-black uppercase text-[10px] tracking-widest transition-all ${form.tipo === 'google' ? 'bg-white text-orange-600 shadow-md ring-1 ring-slate-200' : 'text-slate-400 hover:text-slate-600'}`}>🌐 Google</button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase ml-2 tracking-widest">Nome do Banner</label>
                <input className={inputBaseStyle} placeholder="Nome interno" value={form.titulo} onChange={e => setForm({...form, titulo: e.target.value})} />
              </div>

              {form.tipo === 'vip' ? (
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-blue-600 uppercase ml-2 tracking-widest">Expira em</label>
                  <input type="date" className={inputBaseStyle} value={form.expira_em} onChange={e => setForm({...form, expira_em: e.target.value})} />
                </div>
              ) : (
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase ml-2 tracking-widest">Localização</label>
                  <select className={inputBaseStyle} value={form.posicao} onChange={e => setForm({...form, posicao: e.target.value})}>
                    <option value="topo">Topo</option>
                    <option value="lista">Meio da Lista</option>
                    <option value="rodape">Rodapé</option>
                  </select>
                </div>
              )}

              {form.tipo === 'vip' && (
                <>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-blue-600 uppercase ml-2 tracking-widest">Valor Cobrado</label>
                    <input type="number" step="0.01" className={inputBaseStyle} placeholder="0,00" value={form.valor_vip} onChange={e => setForm({...form, valor_vip: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase ml-2 tracking-widest">Slot de Exibição</label>
                    <select className={inputBaseStyle} value={form.posicao} onChange={e => setForm({...form, posicao: e.target.value})}>
                      <option value="topo">Topo Principal</option>
                      <option value="lista">Feed/Lista</option>
                    </select>
                  </div>
                </>
              )}

              <div className="md:col-span-2 space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase ml-2 tracking-widest">
                  {form.tipo === 'google' ? 'Script do AdSense' : 'Link de Redirecionamento'}
                </label>
                {form.tipo === 'google' ? (
                  <textarea className={`${inputBaseStyle} h-32 font-mono text-[11px]`} value={form.codigo_google} onChange={e => setForm({...form, codigo_google: e.target.value})} />
                ) : (
                  <input className={inputBaseStyle} placeholder="https://..." value={form.link_destino} onChange={e => setForm({...form, link_destino: e.target.value})} />
                )}
              </div>

              {form.tipo !== 'google' && (
                <div className="md:col-span-2">
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
            </div>
            
            <div className="flex flex-col md:flex-row gap-4">
              <button 
                type="submit" 
                className={`flex-[2] p-5 text-white rounded-3xl font-black uppercase text-[11px] tracking-[0.2em] transition-all shadow-xl active:scale-95 ${editandoId ? 'bg-blue-600 shadow-blue-100' : 'bg-slate-900 shadow-slate-200'}`}
              >
                {editandoId ? 'Salvar Alterações' : 'Criar Campanha'}
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

      {/* LISTAGEM */}
      <div className="bg-white border border-slate-100 rounded-[2rem] overflow-hidden shadow-sm">
        <div className="p-6 border-b border-slate-50 bg-slate-50/50 flex justify-between items-center text-slate-500">
          <h3 className="text-[11px] font-black uppercase tracking-widest">Painel de Controle</h3>
          <span className="bg-slate-200 text-slate-600 text-[9px] font-black px-3 py-1 rounded-full">{anuncios.length} Itens</span>
        </div>

        <div className="divide-y divide-slate-50">
          {loading ? (
            <div className="p-20 text-center animate-pulse text-[10px] font-black text-slate-300 uppercase">Sincronizando...</div>
          ) : anuncios.map(an => {
            const expirado = !isVipValido(an);
            const estaEditando = editandoId === an.id;
            return (
              <div key={an.id} className={`p-4 md:p-6 flex items-center justify-between transition-all hover:bg-slate-50 group ${estaEditando ? 'bg-blue-50/50' : ''}`}>
                <div className="flex items-center gap-6">
                  <div className={`w-16 h-10 rounded-xl bg-slate-100 overflow-hidden flex items-center justify-center border border-slate-200 flex-shrink-0 ${expirado ? 'grayscale opacity-50' : ''}`}>
                    {an.tipo === 'google' ? '🌐' : an.imagem_url ? <img src={an.imagem_url} className="w-full h-full object-cover" /> : '🏠'}
                  </div>

                  <div>
                    <h3 className={`font-black uppercase text-[11px] ${an.status && !expirado ? 'text-slate-800' : 'text-slate-400'}`}>
                      {an.titulo} {expirado && <span className="text-red-500 ml-2 italic">[EXPIRADO]</span>}
                    </h3>
                    <div className="flex gap-3 mt-1 text-[9px] font-bold text-slate-400 uppercase tracking-tighter">
                      <span className={an.tipo === 'vip' ? 'text-blue-600' : ''}>{an.tipo}</span>
                      {an.tipo === 'vip' && <span>R$ {Number(an.valor_vip).toLocaleString('pt-BR')}</span>}
                      <span>{an.posicao}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <button 
                    onClick={() => !expirado && alternarStatus(an.id, an.status)} 
                    className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${expirado ? 'text-red-400' : an.status ? 'text-green-500 bg-green-50' : 'text-slate-300 hover:text-slate-500'}`}
                  >
                    {expirado ? 'OFF' : an.status ? 'Ativo' : 'Pausado'}
                  </button>
                  
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => prepararEdicao(an)} 
                      className={`p-2.5 rounded-xl transition-all ${estaEditando ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-blue-50 hover:text-blue-600'}`}
                    >
                      ✏️
                    </button>
                    <button 
                      onClick={() => excluirAnuncio(an.id)} 
                      className="p-2.5 text-slate-300 hover:text-red-500 transition-colors"
                    >
                      🗑️
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