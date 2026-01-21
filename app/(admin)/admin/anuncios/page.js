'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export default function AnunciosPage() {
  const [anuncios, setAnuncios] = useState([])
  const [loading, setLoading] = useState(true)
  const [modoEdicao, setModoEdicao] = useState(false)
  const [subindoImagem, setSubindoImagem] = useState(false)

  // Estado para o formulário (sem o campo link_destino)
  const [form, setForm] = useState({
    titulo: '',
    tipo: 'proprio',
    codigo_google: '',
    posicao: 'topo',
    imagem_url: ''
  })

  useEffect(() => {
    fetchAnuncios()
  }, [])

  async function fetchAnuncios() {
    setLoading(true)
    const { data, error } = await supabase
      .from('anuncios')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (data) setAnuncios(data)
    setLoading(false)
  }

  // FUNÇÃO DE UPLOAD PARA O BUCKET 'banner'
  async function handleUpload(e) {
    const file = e.target.files[0]
    if (!file) return

    try {
      setSubindoImagem(true)
      
      const fileExt = file.name.split('.').pop()
      const fileName = `${Math.random()}.${fileExt}`
      const filePath = `${fileName}`

      // Upload para o bucket 'banner'
      const { error: uploadError } = await supabase.storage
        .from('banner')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      // Gera a URL pública
      const { data } = supabase.storage.from('banner').getPublicUrl(filePath)
      
      setForm({ ...form, imagem_url: data.publicUrl })
      
    } catch (error) {
      alert('Erro no upload: ' + error.message + '. Verifique se o bucket "banner" é público.')
    } finally {
      setSubindoImagem(false)
    }
  }

  async function salvarAnuncio(e) {
    e.preventDefault()
    
    if (!form.titulo) return alert('Dê um título interno ao anúncio.')
    if (form.tipo === 'proprio' && !form.imagem_url) return alert('Por favor, faça o upload da imagem antes de salvar.')

    const { error } = await supabase.from('anuncios').insert([form])
    
    if (!error) {
      setForm({ titulo: '', tipo: 'proprio', codigo_google: '', posicao: 'topo', imagem_url: '' })
      setModoEdicao(false)
      fetchAnuncios()
    } else {
      alert('Erro ao salvar no banco: ' + error.message)
    }
  }

  async function alternarStatus(id, statusAtual) {
    const { error } = await supabase
      .from('anuncios')
      .update({ status: !statusAtual })
      .eq('id', id)
    
    if (!error) fetchAnuncios()
  }

  async function excluirAnuncio(id) {
    if (confirm("Célio, deseja excluir este anúncio permanentemente?")) {
      const { error } = await supabase.from('anuncios').delete().eq('id', id)
      if (!error) fetchAnuncios()
    }
  }

  return (
    <div className="max-w-6xl mx-auto pb-20">
      {/* CABEÇALHO */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-black text-slate-900 uppercase italic">Gestão de Anúncios</h1>
          <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest italic">Londrina & Região • Controle Administrativo</p>
        </div>
        
        <button 
          onClick={() => setModoEdicao(!modoEdicao)}
          className={`${modoEdicao ? 'bg-slate-200 text-slate-600' : 'bg-blue-600 text-white'} px-6 py-2 rounded-xl font-black text-xs uppercase transition-all shadow-lg active:scale-95`}
        >
          {modoEdicao ? 'Fechar' : '+ Novo Anúncio'}
        </button>
      </div>

      {/* FORMULÁRIO */}
      {modoEdicao && (
        <div className="bg-white border-2 border-slate-100 rounded-3xl p-8 mb-10 shadow-xl animate-in fade-in slide-in-from-top-4 duration-300">
          <form onSubmit={salvarAnuncio} className="space-y-6">
            
            <div className="grid grid-cols-2 gap-4">
              <button 
                type="button"
                onClick={() => setForm({...form, tipo: 'proprio'})}
                className={`p-4 rounded-2xl border-2 font-black uppercase text-xs transition-all ${form.tipo === 'proprio' ? 'border-blue-600 bg-blue-50 text-blue-700 shadow-inner' : 'border-slate-50 text-slate-400 grayscale'}`}
              >
                🏠 Anúncio Próprio
              </button>
              <button 
                type="button"
                onClick={() => setForm({...form, tipo: 'google'})}
                className={`p-4 rounded-2xl border-2 font-black uppercase text-xs transition-all ${form.tipo === 'google' ? 'border-orange-500 bg-orange-50 text-orange-700 shadow-inner' : 'border-slate-50 text-slate-400 grayscale'}`}
              >
                🌐 Google Adsense
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block tracking-widest text-left">Título Interno</label>
                <input 
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none text-slate-900 font-bold"
                  placeholder="Ex: Banner Natal Prestadores"
                  value={form.titulo}
                  onChange={e => setForm({...form, titulo: e.target.value})}
                />
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block tracking-widest text-left">Posição no Site</label>
                <select 
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none text-slate-900 font-bold appearance-none cursor-pointer"
                  value={form.posicao}
                  onChange={e => setForm({...form, posicao: e.target.value})}
                >
                  <option value="topo">Topo do Site</option>
                  <option value="lateral">Barra Lateral</option>
                  <option value="lista">Meio da Listagem</option>
                </select>
              </div>

              {form.tipo === 'proprio' ? (
                <div className="col-span-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block tracking-widest text-left">Upload do Banner (Imagem)</label>
                  <div className="flex items-center gap-6 p-6 bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl">
                    <input 
                      type="file" 
                      accept="image/*"
                      onChange={handleUpload}
                      className="block w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-[10px] file:font-black file:bg-blue-600 file:text-white cursor-pointer"
                    />
                    {subindoImagem && <span className="text-[10px] font-black text-blue-600 animate-pulse">ENVIANDO...</span>}
                    {form.imagem_url && (
                      <div className="flex flex-col items-center gap-1">
                        <img src={form.imagem_url} alt="Preview" className="h-16 w-16 rounded-xl object-cover shadow-md border-2 border-white" />
                        <span className="text-[8px] font-black text-green-600 uppercase">OK</span>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="col-span-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block tracking-widest text-left">Código do Script Google</label>
                  <textarea 
                    className="w-full p-4 bg-slate-900 text-yellow-400 font-mono text-xs rounded-2xl outline-none h-32"
                    placeholder="Cole o código do Adsense aqui..."
                    value={form.codigo_google}
                    onChange={e => setForm({...form, codigo_google: e.target.value})}
                  />
                </div>
              )}
            </div>

            <button 
              type="submit" 
              disabled={subindoImagem}
              className={`w-full p-5 rounded-2xl font-black uppercase tracking-[0.2em] transition-all shadow-xl active:scale-[0.98] ${subindoImagem ? 'bg-slate-300 cursor-not-allowed' : 'bg-slate-900 text-white hover:bg-black'}`}
            >
              {subindoImagem ? 'Aguardando imagem...' : 'Publicar Anúncio'}
            </button>
          </form>
        </div>
      )}

      {/* LISTAGEM DOS ANÚNCIOS */}
      <div className="space-y-3">
        {loading ? (
          <p className="text-center py-10 text-slate-300 text-[10px] font-black uppercase animate-pulse tracking-widest italic">Acessando banco de teste...</p>
        ) : (
          anuncios.map(anuncio => (
            <div key={anuncio.id} className="bg-white border border-slate-100 p-4 rounded-2xl flex items-center justify-between shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-5">
                <div className="w-14 h-14 rounded-2xl overflow-hidden bg-slate-50 flex items-center justify-center border border-slate-100 shadow-inner text-slate-400">
                  {anuncio.tipo === 'google' ? <span className="text-xl">🌐</span> : (
                    anuncio.imagem_url ? <img src={anuncio.imagem_url} className="w-full h-full object-cover" /> : <span className="text-xl">🏠</span>
                  )}
                </div>
                <div>
                  <h3 className="font-black text-slate-900 uppercase text-[11px] tracking-tight leading-none">{anuncio.titulo}</h3>
                  <div className="flex gap-2 mt-2">
                    <span className="text-[7px] font-black bg-slate-100 text-slate-500 px-2 py-0.5 rounded uppercase tracking-tighter">{anuncio.posicao}</span>
                    <span className={`text-[7px] font-black px-2 py-0.5 rounded uppercase tracking-tighter ${anuncio.tipo === 'google' ? 'bg-orange-50 text-orange-500' : 'bg-blue-50 text-blue-500'}`}>
                      {anuncio.tipo}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => alternarStatus(anuncio.id, anuncio.status)}
                  className={`px-4 py-2 rounded-xl text-[8px] font-black uppercase tracking-widest transition-all ${anuncio.status ? 'bg-green-50 text-green-600 hover:bg-green-100 shadow-inner shadow-green-100' : 'bg-red-50 text-red-600 hover:bg-red-100'}`}
                >
                  {anuncio.status ? 'Ativo' : 'Pausado'}
                </button>
                <button onClick={() => excluirAnuncio(anuncio.id)} className="p-2 text-slate-200 hover:text-red-500 transition-colors">
                  🗑️
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}