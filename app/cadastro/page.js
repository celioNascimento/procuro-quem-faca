'use client'
import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { CATEGORIAS_OFICIAIS } from '@/lib/categorias'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import BackButton from '@/components/BackButton'
import Header from '@/components/Header'

const TAGS_DISPONIVEIS = ['24 Horas', 'Orçamento Grátis', 'Aceita Cartão', 'Garantia', 'Preço Justo']

// Componente de carregamento declarado no topo para evitar ReferenceError
function CadastroSkeleton() {
  return (
    <div className="w-full max-w-xl mx-auto px-4 pt-28 md:pt-32 animate-pulse">
      <div className="mb-10 pl-2">
        <div className="h-10 bg-slate-200 rounded-lg w-48 mb-3" />
        <div className="h-4 bg-slate-100 rounded-lg w-64" />
      </div>
      <div className="space-y-6">
        <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 flex flex-col items-center">
          <div className="w-32 h-32 rounded-[2.5rem] bg-slate-100" />
        </div>
        <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 space-y-4">
          <div className="h-14 bg-slate-50 rounded-2xl w-full" />
        </div>
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
  const [touched, setTouched] = useState({})
  
  const [slugErro, setSlugErro] = useState(false)
  const [slugEditavel, setSlugEditavel] = useState('')

  const [listaEstados, setListaEstados] = useState([])
  const [listaRegioes, setListaRegioes] = useState([])
  const [listaCidades, setListaCidades] = useState([])
  const [cidadesRegiao, setCidadesRegiao] = useState([]) 

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
    cidades_atendidas: [], 
    bairro: '',
    bio: '',
    foto_perfil: '',
    tags: [],
    slug: ''
  })

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
    const preenchidos = campos.filter(Boolean).length
    return Math.round((preenchidos / campos.length) * 100)
  }

  const registrarLog = async (acao, detalhes = {}, entidade = 'perfil_prestador') => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      await supabase.from('logs_atividades').insert({
        acao,
        usuario_id: user?.id,
        detalhes: { ...detalhes, nome_no_form: formData.nome, timestamp: new Date().toISOString() },
        entidade_tipo: entidade
      })
    } catch (err) {
      console.error('Erro ao registrar log:', err)
    }
  }

  useEffect(() => {
    if (slugErro && slugInputRef.current) {
      slugInputRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setTimeout(() => slugInputRef.current?.focus(), 500);
    }
  }, [slugErro]);

  useEffect(() => { 
    const inicializar = async () => {
      try {
        await carregarEstados()
        await verificarUsuarioEPrefil()
      } catch (error) {
        await registrarLog('ERRO_INICIALIZACAO_CADASTRO', { erro: error.message }, 'erro')
      }
    }
    inicializar()
  }, [])

  const gerarSlug = (texto) => {
    return texto.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^\w\s]/g, '').replace(/\s+/g, '').trim();
  }

  async function carregarEstados() {
    const { data } = await supabase.from('estados').select('*').order('nome')
    if (data) setListaEstados(data)
  }

  async function carregarRegioes(sigla) {
    if (!sigla) return
    const { data } = await supabase.from('regioes').select('*').eq('estado_sigla', sigla).order('nome')
    setListaRegioes(data || [])
    await carregarCidades(null, sigla)
  }

  async function carregarCidades(regiaoId, estadoSigla) {
    let query = supabase.from('cidades').select('*').eq('ativa', true).order('nome')
    if (regiaoId && regiaoId !== '') {
      query = query.eq('regiao_id', regiaoId)
    } else if (estadoSigla || formData.estado_sigla) {
      query = query.eq('estado_sigla', estadoSigla || formData.estado_sigla)
    }
    const { data } = await query
    setListaCidades(data || [])
    if (regiaoId) setCidadesRegiao(data || [])
    else setCidadesRegiao([])
  }

  async function verificarUsuarioEPrefil() {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/login'); return; }

      const { data: perfil } = await supabase
        .from('prestadores')
        .select('*')
        .eq('user_id', session.user.id)
        .maybeSingle()

      if (perfil) {
        await carregarRegioes(perfil.estado_sigla || 'PR')
        await carregarCidades(perfil.regiao_id, perfil.estado_sigla)
        setFormData({
          ...perfil,
          tags: perfil.tags || [],
          habilidades: perfil.habilidades || [],
          cidades_atendidas: perfil.cidades_atendidas || [],
          regiao_id: perfil.regiao_id || '',
          cidade_id: perfil.cidade_id || ''
        })
        setModoEdicao(true)
        setAceitouTermos(true)
        setAceitouPrivacidade(true)
      } else {
        await carregarRegioes('PR')
      }
    } catch (error) { console.error(error) } finally { setLoading(false) }
  }

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
    try {
      if (formData.foto_perfil) {
        const urlPartes = formData.foto_perfil.split('/')
        const fileNameOld = urlPartes[urlPartes.length - 1]
        await supabase.storage.from('fotos-perfil').remove([fileNameOld])
      }
      const fileName = `${Date.now()}.${arquivo.name.split('.').pop()}`
      const { error: uploadError } = await supabase.storage.from('fotos-perfil').upload(fileName, arquivo)
      if (uploadError) throw uploadError
      const { data: { publicUrl } } = supabase.storage.from('fotos-perfil').getPublicUrl(fileName)
      setFormData({ ...formData, foto_perfil: publicUrl })
      setStatus('Foto pronta!')
    } catch (error) { setStatus('Erro no upload.') } finally { setTimeout(() => setStatus(''), 2000) }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!formularioValido) return
    setStatus('Sincronizando...')
    try {
      const { data: { user } } = await supabase.auth.getUser()
      const slugFinal = slugEditavel || (modoEdicao ? formData.slug : gerarSlug(formData.nome))
      
      const dadosParaSalvar = {
        ...formData,
        slug: slugFinal,
        user_id: user.id,
        regiao_id: formData.regiao_id === '' ? null : formData.regiao_id,
        cidade_id: formData.cidade_id === '' ? null : formData.cidade_id,
        status: 'ativo',
        aprovado_em: new Date()
      }

      const { error } = modoEdicao 
        ? await supabase.from('prestadores').update(dadosParaSalvar).eq('user_id', user.id)
        : await supabase.from('prestadores').insert([dadosParaSalvar])
      
      if (error) {
        if (error.code === '23505') {
          setSlugErro(true)
          setStatus('⚠️ Endereço indisponível')
          return
        }
        throw error
      }
      setStatus('✅ SALVO!')
      setModoEdicao(true)
      setSlugErro(false)
    } catch (error) { setStatus('Erro ao salvar.') } finally { setTimeout(() => setStatus(''), 3000) }
  }

  const toggleItem = (item, lista) => {
    const novaLista = formData[lista].includes(item) ? formData[lista].filter(i => i !== item) : [...formData[lista], item];
    setFormData({ ...formData, [lista]: novaLista });
  };

  const inputStyle = (campo) => {
    const base = "w-full p-4 rounded-2xl border outline-none transition-all placeholder:text-slate-500 text-slate-800 font-bold "
    const erro = touched[campo] && !formData[campo] ? "border-red-500 bg-red-50 shadow-inner" : "border-slate-100 bg-white focus:border-blue-500 focus:shadow-md"
    return base + erro
  }

  const formularioValido = calcularProgresso() === 100;

  return (
    <main className="min-h-screen bg-[#F8FAFC] pb-20 font-sans">
      <Header href="/" />
      
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100 py-2">
        <div className="max-w-4xl mx-auto px-6 grid grid-cols-3 items-center h-16 md:h-20">
          <div className="flex justify-start"><BackButton href="/" /></div>
          <div className="flex justify-center h-full">
            <Link href="/" className="flex items-center justify-center transition-transform hover:scale-105">
              <img src="/logo.png" alt="Logo" className="h-14 md:h-16 w-auto object-contain block" />
            </Link>
          </div>
          <div className="flex justify-end">
            <button onClick={async () => { await supabase.auth.signOut(); window.location.href = '/login' }} className="bg-red-50 text-red-500 px-4 py-2 rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-red-600 hover:text-white transition-all shadow-sm active:scale-95">Sair</button>
          </div>
        </div>
        {!loading && (
          <div className="w-full h-1 bg-slate-50 relative overflow-hidden">
            <div className="absolute left-0 top-0 h-full bg-blue-600 transition-all duration-700 ease-out" style={{ width: `${calcularProgresso()}%` }} />
          </div>
        )}
      </nav>

      {loading ? <CadastroSkeleton /> : (
        <div className="w-full max-w-xl mx-auto px-4 pt-32 md:pt-40 animate-in fade-in duration-500">
          <header className="mb-10 pl-2">
            <h1 className="text-3xl font-black text-slate-900 tracking-tight uppercase italic">{modoEdicao ? 'Meu Perfil' : 'Cadastro'}</h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-blue-600 font-black text-[10px] uppercase tracking-widest">{calcularProgresso()}% concluído</span>
            </div>
          </header>

          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            <section className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm flex flex-col items-center">
              <div className="relative group">
                <div className="w-32 h-32 rounded-[2.5rem] bg-slate-50 border-2 border-dashed border-slate-200 overflow-hidden flex items-center justify-center transition-all group-hover:border-blue-400">
                  {formData.foto_perfil ? <img src={formData.foto_perfil} className="w-full h-full object-cover" /> : <span className="text-slate-300 font-black text-[10px] uppercase">Foto</span>}
                </div>
                <input type="file" accept="image/*" onChange={fazerUploadFoto} className="absolute inset-0 opacity-0 cursor-pointer" />
              </div>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-4 italic">{status || 'Toque para alterar a foto'}</p>
            </section>

            <section className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm space-y-5">
              <input value={formData.nome} placeholder="Nome Completo" onChange={(e) => setFormData({...formData, nome: e.target.value})} className={inputStyle('nome')} />
              
              {/* BLOCO DE ERRO DE SLUG COM OPÇÕES */}
              {slugErro && (
                <div className="bg-amber-50 p-6 rounded-[2rem] border border-amber-200 animate-in fade-in slide-in-from-top-4 duration-500">
                  <div className="flex items-center gap-2 mb-3 text-amber-700">
                    <span className="text-lg">⚠️</span>
                    <p className="font-black text-[10px] uppercase tracking-widest">Endereço indisponível</p>
                  </div>
                  <p className="text-slate-600 text-[11px] font-medium leading-relaxed mb-4">
                    Já existe um profissional com o nome <span className="font-bold">"{formData.nome}"</span>. Escolha como prosseguir:
                  </p>
                  <div className="flex flex-col gap-3">
                    <button type="button" onClick={() => { setSlugEditavel(`${gerarSlug(formData.nome)}-${Math.floor(10 + Math.random() * 90)}`); setSlugErro(false); }} className="bg-white border border-amber-200 p-4 rounded-2xl text-left hover:bg-amber-100 transition-all shadow-sm">
                      <span className="block text-amber-800 font-black text-[9px] uppercase tracking-widest mb-1">Opção 1: Sugestão automática</span>
                      <span className="text-slate-500 text-xs font-bold">.../{gerarSlug(formData.nome)}-XX</span>
                    </button>
                    <div className="bg-white border border-amber-200 p-4 rounded-2xl shadow-sm">
                      <span className="block text-amber-800 font-black text-[9px] uppercase tracking-widest mb-1">Opção 2: Personalizar endereço</span>
                      <div className="flex items-center gap-2 mt-2 bg-slate-50 p-3 rounded-xl border border-slate-100">
                        <span className="text-slate-400 text-xs font-bold">/</span>
                        <input ref={slugInputRef} value={slugEditavel} placeholder="Ex: joao-eletricista" onChange={(e) => setSlugEditavel(gerarSlug(e.target.value))} className="w-full bg-transparent border-none outline-none text-slate-800 font-bold text-xs" />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input value={formData.whatsapp} placeholder="WhatsApp" onChange={(e) => setFormData({...formData, whatsapp: aplicarMascaraWhatsapp(e.target.value)})} className={inputStyle('whatsapp')} />
                <select value={formData.categoria} onChange={(e) => setFormData({...formData, categoria: e.target.value})} className={inputStyle('categoria')}>
                  <option value="">Especialidade Principal</option>
                  {CATEGORIAS_OFICIAIS.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
              </div>
            </section>

            <section className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm space-y-5">
              <label className="text-blue-600 font-black text-[9px] uppercase ml-2 block italic tracking-widest">Localização</label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <select value={formData.estado_sigla} onChange={(e) => { const sigla = e.target.value; setFormData({...formData, estado_sigla: sigla, regiao_id: '', cidade_id: '', cidades_atendidas: []}); carregarRegioes(sigla); }} className={inputStyle('estado_sigla')}>
                  {listaEstados.map(est => <option key={est.sigla} value={est.sigla}>{est.nome}</option>)}
                </select>
                <select value={formData.regiao_id} onChange={(e) => { const rId = e.target.value; setFormData({...formData, regiao_id: rId, cidade_id: '', cidades_atendidas: []}); carregarCidades(rId, formData.estado_sigla); }} className={inputStyle('regiao_id')}>
                  <option value="">Região (Opcional)</option>
                  {listaRegioes.map(reg => <option key={reg.id} value={reg.id}>{reg.nome}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <select value={formData.cidade_id} onChange={(e) => setFormData({...formData, cidade_id: e.target.value, cidades_atendidas: []})} className={inputStyle('cidade_id')}>
                  <option value="">Cidade Sede</option>
                  {listaCidades.map(cid => <option key={cid.id} value={cid.id}>{cid.nome}</option>)}
                </select>
                <input value={formData.bairro} placeholder="Bairro Principal" onChange={(e) => setFormData({...formData, bairro: e.target.value})} className={inputStyle('bairro')} />
              </div>

              {/* BLOCO CIDADES ATENDIDAS (RM) */}
              {formData.regiao_id && cidadesRegiao.length > 0 && (
                <div className="mt-4 pt-4 border-t border-slate-100">
                  <label className="text-slate-400 font-black text-[9px] uppercase ml-2 mb-3 block tracking-widest italic">Cidades que você também atende nesta região:</label>
                  <div className="flex flex-wrap gap-2">
                    {cidadesRegiao.filter(cid => cid.id !== formData.cidade_id).map(cid => (
                      <button key={cid.id} type="button" onClick={() => toggleItem(cid.nome, 'cidades_atendidas')} className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase transition-all border ${formData.cidades_atendidas.includes(cid.nome) ? 'bg-blue-600 text-white border-blue-600 shadow-md' : 'bg-slate-50 text-slate-400 border-slate-100 hover:border-blue-200'}`}>{cid.nome}</button>
                    ))}
                  </div>
                </div>
              )}
            </section>

            <section className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm space-y-6">
              <div className="flex flex-wrap gap-2">
                {TAGS_DISPONIVEIS.map(tag => (
                  <button key={tag} type="button" onClick={() => toggleItem(tag, 'tags')} className={`px-4 py-3 rounded-2xl text-[9px] font-black uppercase transition-all ${formData.tags.includes(tag) ? 'bg-blue-600 text-white shadow-md' : 'bg-slate-50 text-slate-400 border border-slate-100'}`}>{tag}</button>
                ))}
              </div>
              <textarea value={formData.bio} placeholder="Resumo do seu trabalho (Bio)..." onChange={(e) => setFormData({...formData, bio: e.target.value})} className={`${inputStyle('bio')} h-32 resize-none`} />
            </section>

            <section className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm space-y-4">
              <label className="flex items-center gap-4 cursor-pointer group">
                <input type="checkbox" checked={aceitouTermos} onChange={(e) => setAceitouTermos(e.target.checked)} className="w-5 h-5 rounded border-slate-200 text-blue-600 focus:ring-blue-500" />
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Aceito os Termos</span>
              </label>
              <label className="flex items-center gap-4 cursor-pointer group">
                <input type="checkbox" checked={aceitouPrivacidade} onChange={(e) => setAceitouPrivacidade(e.target.checked)} className="w-5 h-5 rounded border-slate-200 text-blue-600 focus:ring-blue-500" />
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Aceito a Privacidade</span>
              </label>
            </section>

            <div className="flex flex-col gap-4">
              <button type="submit" disabled={!formularioValido} className={`w-full py-6 rounded-[2.5rem] font-black text-xs uppercase tracking-[0.3em] transition-all shadow-xl ${formularioValido ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-200 active:scale-[0.98]' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}>
                {status || (modoEdicao ? 'Salvar Alterações' : 'Finalizar Cadastro')}
              </button>

              {modoEdicao && (
                <Link 
                  href="/confirmar-exclusao"
                  className="w-full py-4 text-red-500 font-black text-[10px] uppercase tracking-widest hover:text-red-700 transition-colors text-center block mt-4"
                >
                  Excluir Perfil Permanentemente
                </Link>
              )}
            </div>
          </form>
        </div>
      )}
    </main>
  )
}