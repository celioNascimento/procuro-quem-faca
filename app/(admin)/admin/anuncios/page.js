'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export default function PainelAnunciantePage() {
  const [anuncios, setAnuncios] = useState([])
  const [loading, setLoading] = useState(true)
  const [modoEdicao, setModoEdicao] = useState(false)
  const [progressoUpload, setProgressoUpload] = useState(0)
  const [editandoId, setEditandoId] = useState(null)

  // Dados para segmentação (idealmente virão do banco)
  const [estados] = useState([{ sigla: 'PR', nome: 'Paraná' }, { sigla: 'SP', nome: 'São Paulo' }])
  const [cidades] = useState([{ id: 'mock-londrina', nome: 'Londrina' }, { id: 'mock-maringa', nome: 'Maringá' }])
  const [categorias] = useState([{ id: 'mock-cat-1', nome: 'Pedreiro' }, { id: 'mock-cat-2', nome: 'Eletricista' }, { id: 'mock-cat-3', nome: 'Limpeza' }])

  const [form, setForm] = useState({
    titulo: '', 
    link_destino: '', 
    imagem_url: '', 
    estado_sigla: 'PR',
    cidade_id: '',
    categoria_id: '',
    lance_maximo_cpc: '',
    orcamento_diario: ''
  })

  async function fetchAnuncios() {
    // Simulando a busca dos anúncios do usuário logado
    const { data } = await supabase.from('anuncios').select('*').order('created_at', { ascending: false })
    if (data) setAnuncios(data)
    setLoading(false)
  }

  useEffect(() => { fetchAnuncios() }, [])

  function prepararEdicao(an) {
    setEditandoId(an.id)
    setForm({
      titulo: an.titulo || '',
      link_destino: an.link_destino || '',
      imagem_url: an.imagem_url || '',
      estado_sigla: an.estado_sigla || 'PR',
      cidade_id: an.cidade_id || '',
      categoria_id: an.categoria_id || '',
      lance_maximo_cpc: an.lance_maximo_cpc || '',
      orcamento_diario: an.orcamento_diario || ''
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
    if (!form.titulo || !form.imagem_url) return alert('Título e imagem são obrigatórios.')
    if (!form.lance_maximo_cpc || !form.orcamento_diario) return alert('Defina os valores de leilão.')

    const payload = {
      titulo: form.titulo,
      link_destino: form.link_destino,
      imagem_url: form.imagem_url,
      estado_sigla: form.estado_sigla || null,
      cidade_id: form.cidade_id || null,
      categoria_id: form.categoria_id || null,
      lance_maximo_cpc: Number(form.lance_maximo_cpc),
      orcamento_diario: Number(form.orcamento_diario),
      tipo: 'proprio', // Forçando padrão para painel self-service
      status_aprovacao: editandoId ? 'pendente' : 'pendente' // Toda edição ou criação vai para moderação
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
    setForm({ titulo: '', link_destino: '', imagem_url: '', estado_sigla: 'PR', cidade_id: '', categoria_id: '', lance_maximo_cpc: '', orcamento_diario: '' })
    setModoEdicao(false)
    setEditandoId(null)
  }

  async function alternarStatus(id, statusAtual) {
    const novoStatus = !statusAtual
    setAnuncios(anuncios.map(a => a.id === id ? { ...a, status: novoStatus } : a))
    await supabase.from('anuncios').update({ status: novoStatus }).eq('id', id)
  }

  function getStatusBadge(status_aprovacao, status_ativo) {
    if (!status_ativo) return <span className="bg-slate-100 text-slate-500 px-3 py-1 rounded-full text-[9px] font-black uppercase">Pausado</span>
    if (status_aprovacao === 'pendente') return <span className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-[9px] font-black uppercase">Em Análise</span>
    if (status_aprovacao === 'aprovado') return <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-[9px] font-black uppercase">Rodando</span>
    if (status_aprovacao === 'rejeitado') return <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-[9px] font-black uppercase">Rejeitado</span>
    if (status_aprovacao === 'saldo_esgotado') return <span className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-[9px] font-black uppercase">Sem Saldo</span>
    return null
  }

  return (
    <div className="max-w-6xl mx-auto pb-20 px-4 pt-6 font-sans antialiased text-slate-900">
      
      {/* HEADER - CARTEIRA DO ANUNCIANTE */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900 uppercase">Minhas Campanhas</h1>
          <p className="text-slate-500 font-medium text-sm mt-1">Crie e gerencie seus anúncios na plataforma</p>
        </div>

        <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
          <div className="bg-slate-900 px-6 py-3 rounded-2xl shadow-xl shadow-slate-200 flex flex-col items-center md:items-start">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">Saldo em Carteira</span>
            <div className="flex items-center gap-3">
              <span className="text-xl font-black text-white italic">R$ 150,00</span>
              <button className="bg-blue-600 text-white text-[9px] px-3 py-1 rounded-lg font-bold uppercase hover:bg-blue-500 transition-colors">
                + Adicionar
              </button>
            </div>
          </div>
          
          {!modoEdicao && (
            <button 
              onClick={() => setModoEdicao(true)} 
              className="flex-1 md:flex-none bg-blue-600 text-white px-8 py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest transition-all active:scale-95 shadow-lg hover:bg-blue-500"
            >
              + Criar Anúncio
            </button>
          )}
        </div>
      </header>

      {/* FORMULÁRIO SELF-SERVICE */}
      {modoEdicao && (
        <div className={`bg-white border-2 rounded-[2.5rem] p-8 md:p-10 mb-12 shadow-2xl transition-all ${editandoId ? 'border-blue-500 ring-8 ring-blue-50' : 'border-slate-100'}`}>
          <div className="flex items-center gap-4 mb-8 border-b border-slate-100 pb-6">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl ${editandoId ? 'bg-blue-600 text-white' : 'bg-slate-900 text-white'}`}>
              {editandoId ? '✏️' : '🚀'}
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">
                {editandoId ? 'Editando Campanha' : 'Configurar Nova Campanha'}
              </h2>
              <p className="text-sm text-slate-500 font-medium">Siga os passos abaixo para colocar seu anúncio no ar.</p>
            </div>
          </div>

          <form onSubmit={salvarAnuncio} className="space-y-10">
            
            {/* BLOCO 1: O ANÚNCIO */}
            <div className="bg-slate-50/50 p-6 md:p-8 rounded-[2rem] border border-slate-100">
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-6 flex items-center gap-2">
                <span className="bg-blue-100 text-blue-600 w-6 h-6 rounded-full flex items-center justify-center text-[10px]">1</span> 
                O que os clientes vão ver?
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className={labelStyle}>Nome da Campanha (Interno)</label>
                  <input className={inputBaseStyle} placeholder="Ex: Promocao Dia das Mães" value={form.titulo} onChange={e => setForm({...form, titulo: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <label className={labelStyle}>Para onde o cliente vai ao clicar?</label>
                  <input className={inputBaseStyle} placeholder="https://seu-site.com.br ou WhatsApp" value={form.link_destino} onChange={e => setForm({...form, link_destino: e.target.value})} />
                </div>
                
                <div className="md:col-span-2 mt-2">
                  <label className={labelStyle}>Arte do Anúncio (Imagem)</label>
                  <div className="relative p-8 border-2 border-dashed border-slate-200 rounded-[2rem] bg-white flex flex-col items-center justify-center hover:border-blue-400 transition-all group overflow-hidden">
                    <input type="file" onChange={handleUpload} className="absolute inset-0 opacity-0 cursor-pointer z-10" />
                    {progressoUpload > 0 ? (
                      <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest animate-pulse">Enviando imagem: {progressoUpload}%</span>
                    ) : form.imagem_url ? (
                      <div className="flex flex-col items-center gap-4 w-full">
                        <img src={form.imagem_url} className="h-32 object-contain rounded-xl shadow-sm" alt="Preview" />
                        <span className="text-[9px] font-black text-slate-500 uppercase bg-slate-100 px-4 py-2 rounded-full">Clique para alterar a imagem</span>
                      </div>
                    ) : (
                      <div className="text-center">
                        <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3 text-xl">🖼️</div>
                        <p className="text-[11px] font-black text-slate-600 uppercase tracking-widest">Arraste ou clique para subir sua arte</p>
                        <p className="text-[10px] font-medium text-slate-400 mt-1">Formatos aceitos: JPG, PNG. Tamanho recomendado: 800x400px</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* BLOCO 2: PÚBLICO ALVO */}
            <div className="bg-slate-50/50 p-6 md:p-8 rounded-[2rem] border border-slate-100">
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-6 flex items-center gap-2">
                <span className="bg-blue-100 text-blue-600 w-6 h-6 rounded-full flex items-center justify-center text-[10px]">2</span> 
                Onde o anúncio deve aparecer?
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <label className={labelStyle}>Estado</label>
                  <select className={inputBaseStyle} value={form.estado_sigla} onChange={e => setForm({...form, estado_sigla: e.target.value})}>
                    <option value="">Todos os Estados</option>
                    {estados.map(est => <option key={est.sigla} value={est.sigla}>{est.nome}</option>)}
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
                  <label className={labelStyle}>Categoria Alvo</label>
                  <select className={inputBaseStyle} value={form.categoria_id} onChange={e => setForm({...form, categoria_id: e.target.value})}>
                    <option value="">Todas as Categorias</option>
                    {categorias.map(cat => <option key={cat.id} value={cat.id}>{cat.nome}</option>)}
                  </select>
                </div>
              </div>
              <p className="text-[10px] text-slate-500 mt-4 font-medium italic">
                Deixar os campos vazios fará seu anúncio aparecer em todo o site. Selecione para restringir (Ex: Mostrar apenas em Londrina para quem busca Pedreiros).
              </p>
            </div>

            {/* BLOCO 3: LEILÃO E ORÇAMENTO */}
            <div className="bg-blue-50/30 p-6 md:p-8 rounded-[2rem] border border-blue-100">
              <h3 className="text-sm font-black text-blue-900 uppercase tracking-widest mb-6 flex items-center gap-2">
                <span className="bg-blue-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-[10px]">3</span> 
                Orçamento e Lances
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className={`${labelStyle} !text-blue-700`}>Lance Máximo por Clique (R$)</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-black">R$</span>
                    <input type="number" step="0.01" className={`${inputBaseStyle} pl-12`} placeholder="0,50" value={form.lance_maximo_cpc} onChange={e => setForm({...form, lance_maximo_cpc: e.target.value})} />
                  </div>
                  <p className="text-[9px] text-slate-500 mt-1 font-medium">O valor máximo que você aceita pagar cada vez que alguém clicar no seu anúncio. Lances maiores têm prioridade de exibição.</p>
                </div>
                
                <div className="space-y-2">
                  <label className={`${labelStyle} !text-blue-700`}>Orçamento Diário (R$)</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-black">R$</span>
                    <input type="number" step="0.01" className={`${inputBaseStyle} pl-12`} placeholder="10,00" value={form.orcamento_diario} onChange={e => setForm({...form, orcamento_diario: e.target.value})} />
                  </div>
                  <p className="text-[9px] text-slate-500 mt-1 font-medium">O limite máximo que você deseja gastar por dia com essa campanha.</p>
                </div>
              </div>
            </div>
            
            <div className="flex flex-col md:flex-row gap-4 pt-4">
              <button 
                type="submit" 
                className={`flex-[2] p-5 text-white rounded-3xl font-black uppercase text-[11px] tracking-[0.2em] transition-all shadow-xl active:scale-95 ${editandoId ? 'bg-slate-900 shadow-slate-200' : 'bg-blue-600 shadow-blue-200 hover:bg-blue-500'}`}
              >
                {editandoId ? 'Salvar e Enviar para Análise' : 'Lançar Campanha (Enviar para Análise)'}
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

      {/* LISTAGEM - DASHBOARD DO ANUNCIANTE */}
      <div className="bg-white border border-slate-100 rounded-[2rem] overflow-hidden shadow-sm">
        <div className="p-6 border-b border-slate-50 bg-slate-50/50 flex justify-between items-center text-slate-500">
          <h3 className="text-[11px] font-black uppercase tracking-widest">Painel de Performance</h3>
          <span className="bg-slate-200 text-slate-600 text-[9px] font-black px-3 py-1 rounded-full">{anuncios.length} Campanhas</span>
        </div>

        <div className="divide-y divide-slate-50">
          {loading ? (
            <div className="p-20 text-center animate-pulse text-[10px] font-black text-slate-300 uppercase">Carregando métricas...</div>
          ) : anuncios.map(an => {
            const estaEditando = editandoId === an.id;
            return (
              <div key={an.id} className={`p-4 md:p-6 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 transition-all hover:bg-slate-50 group ${estaEditando ? 'bg-blue-50/50' : ''}`}>
                
                {/* Info Criativo */}
                <div className="flex items-center gap-4 min-w-[300px]">
                  <div className="w-20 h-14 rounded-xl bg-slate-100 overflow-hidden flex items-center justify-center border border-slate-200 flex-shrink-0">
                    {an.imagem_url ? <img src={an.imagem_url} className="w-full h-full object-cover" /> : '🖼️'}
                  </div>
                  <div>
                    <h3 className="font-black uppercase text-[12px] text-slate-800 leading-tight">
                      {an.titulo}
                    </h3>
                    <div className="mt-1.5 flex flex-wrap gap-2">
                      {getStatusBadge(an.status_aprovacao, an.status)}
                    </div>
                  </div>
                </div>

                {/* Métricas e Lances */}
                <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-4 w-full bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <div className="flex flex-col">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Cliques</span>
                    <span className="text-sm font-black text-slate-700">{an.cliques || 0}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Impressões</span>
                    <span className="text-sm font-black text-slate-700">{an.impressoes || 0}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[9px] font-black text-blue-500 uppercase tracking-widest">CPC Atual</span>
                    <span className="text-sm font-black text-slate-700">R$ {Number(an.lance_maximo_cpc || 0).toFixed(2)}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[9px] font-black text-orange-500 uppercase tracking-widest">Gasto Dia</span>
                    <span className="text-sm font-black text-slate-700">R$ {Number(an.orcamento_gasto || 0).toFixed(2)} / {Number(an.orcamento_diario || 0).toFixed(0)}</span>
                  </div>
                </div>

                {/* Ações */}
                <div className="flex items-center gap-3 self-end lg:self-auto">
                  <button 
                    onClick={() => alternarStatus(an.id, an.status)} 
                    className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${!an.status ? 'text-slate-400 bg-slate-100 hover:bg-slate-200' : 'text-slate-700 ring-1 ring-slate-200 hover:bg-slate-100'}`}
                  >
                    {an.status ? 'Pausar' : 'Ativar'}
                  </button>
                  
                  <div className="flex items-center gap-1 opacity-100 lg:opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => prepararEdicao(an)} 
                      className={`p-2.5 rounded-xl transition-all ${estaEditando ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-blue-50 hover:text-blue-600'}`}
                      title="Editar Campanha"
                    >
                      ✏️
                    </button>
                  </div>
                </div>

              </div>
            );
          })}
          {anuncios.length === 0 && !loading && (
             <div className="p-16 text-center text-slate-400 font-medium text-sm">
                Nenhuma campanha criada ainda. Clique em "Criar Anúncio" para começar.
             </div>
          )}
        </div>
      </div>
    </div>
  )
}
