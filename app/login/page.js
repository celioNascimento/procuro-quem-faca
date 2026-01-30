'use client'
import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { CATEGORIAS_OFICIAIS } from '@/lib/categorias'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Header from '@/components/Header'

const TAGS_DISPONIVEIS = ['24 Horas', 'Orçamento Grátis', 'Aceita Cartão', 'Garantia', 'Preço Justo']

function CadastroSkeleton() {
  return (
    <div className="w-full max-w-xl mx-auto px-4 pt-32 animate-pulse">
      <div className="h-10 bg-slate-200 rounded-lg w-48 mb-10" />
      <div className="space-y-6">
        <div className="h-40 bg-white rounded-[2.5rem] border border-slate-100" />
        <div className="h-64 bg-white rounded-[2.5rem] border border-slate-100" />
      </div>
    </div>
  )
}

export default function Cadastro() {
  const router = useRouter()
  const slugInputRef = useRef(null)
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState('')
  const [modoEdicao, setModoEdicao] = useState(false)
  const [slugErro, setSlugErro] = useState(false)
  const [slugEditavel, setSlugEditavel] = useState('')

  const [listaEstados, setListaEstados] = useState([])
  const [listaRegioes, setListaRegioes] = useState([])
  const [listaCidades, setListaCidades] = useState([])

  const [aceitouTermos, setAceitouTermos] = useState(false) 
  const [aceitouPrivacidade, setAceitouPrivacidade] = useState(false)

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
    tags: [],
    slug: ''
  })

  useEffect(() => {
    const inicializar = async () => {
      await carregarEstados()
      await verificarUsuarioEPrefil()
    }
    inicializar()
  }, [])

  const calcularProgresso = () => {
    const campos = [
      formData.nome?.trim(),
      formData.whatsapp?.trim().length >= 10,
      formData.categoria,
      formData.cidade_id,
      formData.bairro?.trim(),
      formData.foto_perfil,
      aceitouTermos,
      aceitouPrivacidade
    ]
    return Math.round((campos.filter(Boolean).length / campos.length) * 100)
  }

  const gerarSlug = (texto) => {
    return texto.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^\w\s]/g, '').replace(/\s+/g, '').trim()
  }

  async function carregarEstados() {
    const { data } = await supabase.from('estados').select('*').order('nome')
    if (data) setListaEstados(data)
  }

  async function carregarRegioes(sigla) {
    if (!sigla) return
    const { data } = await supabase.from('regioes').select('*').eq('estado_sigla', sigla).order('nome')
    setListaRegioes(data || [])
    carregarCidades(null, sigla)
  }

  async function carregarCidades(regiaoId, estadoSigla) {
    let query = supabase.from('cidades').select('*').eq('ativa', true).order('nome')
    if (regiaoId) query = query.eq('regiao_id', regiaoId)
    else query = query.eq('estado_sigla', estadoSigla || formData.estado_sigla)
    const { data } = await query
    setListaCidades(data || [])
  }

  async function verificarUsuarioEPrefil() {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/login'); return; }

      const { data: perfil } = await supabase.from('prestadores').select('*').eq('user_id', session.user.id).maybeSingle()

      if (perfil) {
        await carregarRegioes(perfil.estado_sigla || 'PR')
        await carregarCidades(perfil.regiao_id, perfil.estado_sigla)
        setFormData({ ...perfil, tags: perfil.tags || [], habilidades: perfil.habilidades || [] })
        setModoEdicao(true)
        setAceitouTermos(true)
        setAceitouPrivacidade(true)
      } else {
        await carregarRegioes('PR')
      }
    } finally { setLoading(false) }
  }

  const aplicarMascaraWhatsapp = (v) => {
    v = v.replace(/\D/g, '').slice(0, 11)
    if (v.length <= 2) return v.length > 0 ? `(${v}` : ""
    if (v.length <= 6) return `(${v.slice(0, 2)}) ${v.slice(2)}`
    if (v.length <= 10) return `(${v.slice(0, 2)}) ${v.slice(2, 6)}-${v.slice(6)}`
    return `(${v.slice(0, 2)}) ${v.slice(2, 7)}-${v.slice(7)}`
  }

  async function fazerUploadFoto(e) {
    const arquivo = e.target.files[0]
    if (!arquivo) return
    setStatus('Subindo...')
    const fileName = `${Date.now()}.${arquivo.name.split('.').pop()}`
    const { error } = await supabase.storage.from('fotos-perfil').upload(fileName, arquivo)
    if (!error) {
      const { data: { publicUrl } } = supabase.storage.from('fotos-perfil').getPublicUrl(fileName)
      setFormData({ ...formData, foto_perfil: publicUrl })
    }
    setStatus('')
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (calcularProgresso() < 100) return
    setStatus('Salvando...')
    
    try {
      const { data: { user } } = await supabase.auth.getUser()
      const slugFinal = slugEditavel || (modoEdicao ? formData.slug : gerarSlug(formData.nome))

      const dadosParaSalvar = {
        ...formData,
        slug: slugFinal,
        user_id: user.id,
        whatsapp: formData.whatsapp.replace(/\D/g, ''),
        regiao_id: formData.regiao_id || null, // CORREÇÃO ERRO 400
        cidade_id: formData.cidade_id || null, // CORREÇÃO ERRO 400
        status: 'ativo',
        aprovado_em: new Date().toISOString()
      }

      const { error } = modoEdicao 
        ? await supabase.from('prestadores').update(dadosParaSalvar).eq('user_id', user.id)
        : await supabase.from('prestadores').insert([dadosParaSalvar])

      if (error) throw error
      setStatus('✅ SALVO!')
      setModoEdicao(true)
    } catch (err) {
      setStatus('Erro ao salvar')
      if (err.code === '23505') setSlugErro(true)
    } finally { setTimeout(() => setStatus(''), 3000) }
  }

  const toggleItem = (item, lista) => {
    const nova = formData[lista].includes(item) ? formData[lista].filter(i => i !== item) : [...formData[lista], item]
    setFormData({ ...formData, [lista]: nova })
  }

  return (
    <main className="min-h-screen bg-[#FDFDFD] pb-20 font-sans">
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-100">
        <div className="max-w-4xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link href="/" className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 hover:text-blue-600 transition-all shadow-sm">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" /></svg>
          </Link>
          <img src="/logo.png" alt="Logo" className="h-12 w-auto object-contain" />
          <button onClick={() => supabase.auth.signOut().then(() => router.push('/login'))} className="bg-red-50 text-red-500 px-4 py-2 rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all">Sair</button>
        </div>
        {!loading && (
          <div className="w-full h-1 bg-slate-50 relative"><div className="absolute h-full bg-blue-600 transition-all duration-1000" style={{ width: `${calcularProgresso()}%` }} /></div>
        )}
      </nav>

      {loading ? <CadastroSkeleton /> : (
        <div className="max-w-xl mx-auto px-4 pt-32 animate-in fade-in duration-700">
          <header className="mb-8">
            <h1 className="text-2xl font-black text-slate-900 uppercase italic tracking-tight">{modoEdicao ? 'Meu Perfil' : 'Criar Perfil'}</h1>
            <p className="text-blue-600 font-bold text-[10px] uppercase tracking-widest">{calcularProgresso()}% Concluído</p>
          </header>

          <form onSubmit={handleSubmit} className="space-y-6">
            <section className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col items-center">
              <div className="relative w-32 h-32 rounded-[2.5rem] bg-slate-50 border-2 border-dashed border-slate-200 overflow-hidden flex items-center justify-center group hover:border-blue-400 transition-colors">
                {formData.foto_perfil ? <img src={formData.foto_perfil} className="w-full h-full object-cover" /> : <span className="text-slate-300 font-black text-[10px] uppercase">Foto</span>}
                <input type="file" accept="image/*" onChange={fazerUploadFoto} className="absolute inset-0 opacity-0 cursor-pointer" />
              </div>
              <p className="text-[9px] font-bold text-slate-400 uppercase mt-4">{status || 'Toque para alterar'}</p>
            </section>

            <section className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-4">
              <input value={formData.nome} placeholder="Nome Profissional" onChange={(e) => setFormData({...formData, nome: e.target.value})} className="w-full p-4 rounded-2xl border border-slate-100 outline-none focus:border-blue-500 font-bold text-slate-800" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input value={formData.whatsapp} placeholder="WhatsApp" onChange={(e) => setFormData({...formData, whatsapp: aplicarMascaraWhatsapp(e.target.value)})} className="w-full p-4 rounded-2xl border border-slate-100 outline-none focus:border-blue-500 font-bold text-slate-800" />
                <select value={formData.categoria} onChange={(e) => setFormData({...formData, categoria: e.target.value})} className="w-full p-4 rounded-2xl border border-slate-100 outline-none focus:border-blue-500 font-bold text-slate-800 appearance-none bg-white">
                  <option value="">Especialidade</option>
                  {CATEGORIAS_OFICIAIS.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </section>

            <section className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <select value={formData.regiao_id} onChange={(e) => {setFormData({...formData, regiao_id: e.target.value, cidade_id: ''}); carregarCidades(e.target.value)}} className="w-full p-4 rounded-2xl border border-slate-100 outline-none focus:border-blue-500 font-bold text-slate-800 bg-white">
                  <option value="">Região (Opcional)</option>
                  {listaRegioes.map(r => <option key={r.id} value={r.id}>{r.nome}</option>)}
                </select>
                <select value={formData.cidade_id} onChange={(e) => setFormData({...formData, cidade_id: e.target.value})} className="w-full p-4 rounded-2xl border border-slate-100 outline-none focus:border-blue-500 font-bold text-slate-800 bg-white">
                  <option value="">Cidade Sede</option>
                  {listaCidades.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                </select>
              </div>
              <input value={formData.bairro} placeholder="Bairro principal" onChange={(e) => setFormData({...formData, bairro: e.target.value})} className="w-full p-4 rounded-2xl border border-slate-100 outline-none focus:border-blue-500 font-bold text-slate-800" />
            </section>

            <section className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-4">
              <div className="flex flex-wrap gap-2">
                {TAGS_DISPONIVEIS.map(t => (
                  <button key={t} type="button" onClick={() => toggleItem(t, 'tags')} className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase transition-all ${formData.tags.includes(t) ? 'bg-blue-600 text-white shadow-md' : 'bg-slate-50 text-slate-400'}`}>{t}</button>
                ))}
              </div>
              <textarea value={formData.bio} placeholder="Resumo do seu trabalho..." onChange={(e) => setFormData({...formData, bio: e.target.value})} className="w-full p-4 h-32 rounded-2xl border border-slate-100 outline-none focus:border-blue-500 font-bold text-slate-800 resize-none" />
            </section>

            <section className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-3">
               <label className="flex items-center gap-3 cursor-pointer"><input type="checkbox" checked={aceitouTermos} onChange={e => setAceitouTermos(e.target.checked)} className="w-5 h-5 text-blue-600 rounded" /><span className="text-[10px] font-bold text-slate-500 uppercase">Aceito os Termos</span></label>
               <label className="flex items-center gap-3 cursor-pointer"><input type="checkbox" checked={aceitouPrivacidade} onChange={e => setAceitouPrivacidade(e.target.checked)} className="w-5 h-5 text-blue-600 rounded" /><span className="text-[10px] font-bold text-slate-500 uppercase">Aceito a Privacidade</span></label>
            </section>

            <button type="submit" disabled={calcularProgresso() < 100} className={`w-full py-6 rounded-[2.5rem] font-black text-xs uppercase tracking-[0.3em] transition-all shadow-xl ${calcularProgresso() === 100 ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-200 active:scale-[0.98]' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}>
              {status || (modoEdicao ? 'Salvar Alterações' : 'Finalizar Cadastro')}
            </button>
          </form>
        </div>
      )}
    </main>
  )
}