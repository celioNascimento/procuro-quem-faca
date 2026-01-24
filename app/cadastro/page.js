'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { CATEGORIAS_OFICIAIS } from '@/lib/categorias'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

const TAGS_DISPONIVEIS = ['24 Horas', 'Orçamento Grátis', 'Aceita Cartão', 'Garantia', 'Preço Justo']

export default function Cadastro() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState('')
  const [modoEdicao, setModoEdicao] = useState(false)
  const [touched, setTouched] = useState({})

  const [listaEstados, setListaEstados] = useState([])
  const [listaRegioes, setListaRegioes] = useState([])
  const [listaCidades, setListaCidades] = useState([])

  const [aceitouTermos, setAceitouTermos] = useState(true) 
  const [aceitouPrivacidade, setAceitouPrivacidade] = useState(true)

  const [formData, setFormData] = useState({
    nome: '',
    whatsapp: '',
    categoria: '',      
    habilidades: [],    
    estado_sigla: 'PR',
    regiao_id: '',
    cidade_id: '',
    bairro: '',
    bio: '',
    foto_perfil: '',
    tags: []            
  })

  useEffect(() => { 
    const inicializar = async () => {
      await carregarEstados()
      await verificarUsuarioEPrefil()
    }
    inicializar()
  }, [])

  const gerarSlug = (texto) => {
    return texto
      .toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '') 
      .replace(/[^\w\s]/g, '') 
      .replace(/\s+/g, '') 
      .trim();
  }

  async function carregarEstados() {
    const { data } = await supabase.from('estados').select('*').order('nome')
    if (data) setListaEstados(data)
  }

  async function carregarRegioes(sigla) {
    if (!sigla) return
    const { data } = await supabase.from('regioes').select('*').eq('estado_sigla', sigla).order('nome')
    setListaRegioes(data || [])
  }

  async function carregarCidades(regiaoId) {
    if (!regiaoId) return
    const { data } = await supabase.from('cidades').select('*').eq('regiao_id', regiaoId).eq('ativa', true).order('nome')
    setListaCidades(data || [])
  }

  async function verificarUsuarioEPrefil() {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { router.push('/login'); return; }

    const { data: perfil } = await supabase
      .from('prestadores')
      .select('*')
      .eq('user_id', session.user.id)
      .single()

    if (perfil) {
      await Promise.all([
        carregarRegioes(perfil.estado_sigla || 'PR'),
        carregarCidades(perfil.regiao_id)
      ])

      setFormData({
        ...perfil,
        tags: perfil.tags || [],
        habilidades: perfil.habilidades || []
      })
      
      setModoEdicao(true)
    } else {
      await carregarRegioes('PR')
    }
    setLoading(false)
  }

  const formularioValido = 
    formData.nome?.trim() !== '' && 
    formData.whatsapp?.trim().length >= 10 && 
    formData.categoria !== '' && 
    formData.cidade_id !== '' && 
    formData.bairro?.trim() !== '' &&
    formData.foto_perfil !== '' &&
    aceitouTermos && 
    aceitouPrivacidade;

  const toggleItem = (item, lista) => {
    const novaLista = formData[lista].includes(item)
      ? formData[lista].filter(i => i !== item)
      : [...formData[lista], item];
    setFormData({ ...formData, [lista]: novaLista });
  };

  const aplicarMascaraWhatsapp = (valor) => {
    const d = valor.replace(/\D/g, '').slice(0, 11);
    if (d.length === 0) return "";
    if (d.length <= 2) return `(${d}`;
    if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
    if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
    return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  }

  async function fazerUploadFoto(e) {
    const arquivo = e.target.files[0]
    if (!arquivo) return
    setStatus('Subindo foto...')
    const fileName = `${Date.now()}.${arquivo.name.split('.').pop()}`
    const { error: uploadError } = await supabase.storage.from('fotos-perfil').upload(fileName, arquivo)
    if (uploadError) { setStatus('Erro no upload.'); return; }
    const { data: { publicUrl } } = supabase.storage.from('fotos-perfil').getPublicUrl(fileName)
    setFormData({ ...formData, foto_perfil: publicUrl })
    setStatus('Foto pronta!')
    setTimeout(() => setStatus(''), 2000)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!formularioValido) return
    setStatus('Sincronizando...')
    const { data: { user } } = await supabase.auth.getUser()

    const dadosParaSalvar = {
      ...formData,
      slug: gerarSlug(formData.nome),
      user_id: user.id,
      status: 'ativo',
      aprovado_em: new Date()
    }

    const { error } = modoEdicao 
      ? await supabase.from('prestadores').update(dadosParaSalvar).eq('user_id', user.id)
      : await supabase.from('prestadores').insert([dadosParaSalvar])

    if (error) {
      console.error(error)
      setStatus(`Erro ao salvar.`)
    } else {
      setStatus('✅ PUBLICADO COM SUCESSO!')
      setModoEdicao(true)
      setTimeout(() => setStatus(''), 3000)
    }
  }

  const inputStyle = (campo) => {
    const base = "w-full p-4 rounded-2xl border outline-none transition-all placeholder:text-slate-500 text-slate-800 font-bold "
    const erro = touched[campo] && !formData[campo] ? "border-red-500 bg-red-50 shadow-inner" : "border-slate-100 bg-white focus:border-blue-500 focus:shadow-md"
    return base + erro
  }

  if (loading) return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="font-black text-slate-400 uppercase text-[10px] tracking-widest text-center">Sincronizando Localização...</p>
      </div>
    </div>
  )

  return (
    <main className="min-h-screen bg-[#F8FAFC] pb-20 font-sans">
      <nav className="w-full bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-slate-100 px-6 py-4 mb-8">
        <div className="max-w-xl mx-auto flex justify-between items-center">
          <Link href="/" className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all active:scale-90 font-black">←</Link>
          <img src="/logo.png" alt="Logo" className="h-10 w-auto" />
          <button onClick={() => supabase.auth.signOut().then(() => router.push('/login'))} className="text-red-400 font-black text-[9px] uppercase tracking-widest">Sair</button>
        </div>
      </nav>

      <div className="w-full max-w-xl mx-auto px-4">
        <header className="mb-10 pl-2">
          <h1 className="text-3xl font-black text-slate-900 tracking-tight uppercase italic">{modoEdicao ? 'Meu Perfil' : 'Cadastro'}</h1>
          <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">Gerencie seu anúncio profissional</p>
        </header>

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <section className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm flex flex-col items-center">
            <div className="relative group">
              <div className="w-32 h-32 rounded-[2.5rem] bg-slate-50 border-2 border-dashed border-slate-200 overflow-hidden flex items-center justify-center transition-all group-hover:border-blue-400 shadow-inner">
                {formData.foto_perfil ? (
                  <img src={formData.foto_perfil} className="w-full h-full object-cover" alt="Perfil" />
                ) : (
                  <span className="text-slate-300 font-black text-[10px] uppercase">Foto</span>
                )}
              </div>
              <input type="file" accept="image/*" onChange={fazerUploadFoto} className="absolute inset-0 opacity-0 cursor-pointer" />
            </div>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-4 italic">{status || 'Toque para alterar a foto'}</p>
          </section>

          {/* INFO BÁSICA COM TESTE DE WHATSAPP INTEGRADO */}
          <section className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm space-y-5">
            <input value={formData.nome} placeholder="Seu nome completo" onChange={(e) => setFormData({...formData, nome: e.target.value})} className={inputStyle('nome')} />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <input value={formData.whatsapp} placeholder="(00) 00000-0000" onChange={(e) => setFormData({...formData, whatsapp: aplicarMascaraWhatsapp(e.target.value)})} className={inputStyle('whatsapp')} />
       
              </div>

              <select value={formData.categoria} onChange={(e) => setFormData({...formData, categoria: e.target.value})} className={inputStyle('categoria')}>
                <option value="">Especialidade Principal</option>
                {CATEGORIAS_OFICIAIS.map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>
            </div>
          </section>

          <section className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm">
            <label className="text-slate-400 font-black text-[9px] uppercase ml-2 mb-4 block tracking-widest">Serviços adicionais:</label>
            <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto p-1 custom-scrollbar">
              {CATEGORIAS_OFICIAIS.map(cat => (
                <button 
                  key={cat} type="button" 
                  disabled={cat === formData.categoria}
                  onClick={() => toggleItem(cat, 'habilidades')}
                  className={`px-4 py-3 rounded-2xl text-[9px] font-black uppercase transition-all 
                    ${formData.habilidades.includes(cat) ? 'bg-blue-600 text-white shadow-lg shadow-blue-100' : 'bg-slate-50 text-slate-400 border border-slate-100'}`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </section>

          <section className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm space-y-5">
            <label className="text-blue-600 font-black text-[9px] uppercase ml-2 block tracking-widest italic">Área de Atuação</label>
            <div className="space-y-4">
              <select 
                value={formData.estado_sigla} 
                onChange={(e) => {
                  const sigla = e.target.value
                  setFormData({...formData, estado_sigla: sigla, regiao_id: '', cidade_id: ''})
                  carregarRegioes(sigla)
                }}
                className={inputStyle('estado_sigla')}
              >
                {listaEstados.map(est => <option key={est.sigla} value={est.sigla}>{est.nome}</option>)}
              </select>

              <select 
                value={formData.regiao_id} 
                onChange={(e) => {
                  const id = e.target.value
                  setFormData({...formData, regiao_id: id, cidade_id: ''})
                  carregarCidades(id)
                }}
                className={inputStyle('regiao_id')}
              >
                <option value="">Selecione a Região...</option>
                {listaRegioes.map(reg => <option key={reg.id} value={reg.id}>{reg.nome}</option>)}
              </select>

              <select 
                value={formData.cidade_id} 
                onChange={(e) => setFormData({...formData, cidade_id: e.target.value})}
                className={inputStyle('cidade_id')}
              >
                <option value="">Selecione a Cidade...</option>
                {listaCidades.map(cid => <option key={cid.id} value={cid.id}>{cid.nome}</option>)}
              </select>

              <input value={formData.bairro} placeholder="Seu Bairro" onChange={(e) => setFormData({...formData, bairro: e.target.value})} className={inputStyle('bairro')} />
            </div>
          </section>

          <section className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm space-y-6">
            <div className="flex flex-wrap gap-2">
              {TAGS_DISPONIVEIS.map(tag => (
                <button 
                  key={tag} type="button" onClick={() => toggleItem(tag, 'tags')}
                  className={`px-4 py-3 rounded-2xl text-[9px] font-black uppercase transition-all ${formData.tags.includes(tag) ? 'bg-blue-600 text-white shadow-lg shadow-blue-100' : 'bg-slate-50 text-slate-400 border border-slate-100'}`}
                >
                  {tag}
                </button>
              ))}
            </div>
            
            <textarea value={formData.bio} placeholder="Descrição curta do seu trabalho..." onChange={(e) => setFormData({...formData, bio: e.target.value})} className={`${inputStyle('bio')} h-32 resize-none`} />
          </section>

          {/* BOTÃO PRINCIPAL LIMPO NO RODAPÉ */}
          <button 
            type="submit" 
            disabled={!formularioValido}
            className={`w-full py-6 rounded-[2.5rem] font-black text-xs uppercase tracking-[0.3em] transition-all shadow-xl active:scale-95
              ${formularioValido ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-200' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}
          >
            {status || (modoEdicao ? 'Salvar Perfil' : 'Lançar Anúncio')}
          </button>
        </form>
      </div>
    </main>
  )
}