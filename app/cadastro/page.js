'use client'
import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { CATEGORIAS_OFICIAIS } from '@/lib/categorias'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import BackButton from '@/components/BackButton'

const TAGS_DISPONIVEIS = ['24 Horas', 'Orçamento Grátis', 'Aceita Cartão', 'Garantia', 'Preço Justo']

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
          <div className="grid grid-cols-2 gap-4">
            <div className="h-14 bg-slate-50 rounded-2xl w-full" />
            <div className="h-14 bg-slate-50 rounded-2xl w-full" />
          </div>
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

  // CÁLCULO DE PROGRESSO (CAMPOS OBRIGATÓRIOS)
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
    await carregarCidades(null, sigla)
  }

  async function carregarCidades(regiaoId, estadoSigla) {
    let query = supabase.from('cidades').select('*').eq('ativa', true).order('nome')
    if (regiaoId) {
      query = query.eq('regiao_id', regiaoId)
    } else if (estadoSigla || formData.estado_sigla) {
      query = query.eq('estado_sigla', estadoSigla || formData.estado_sigla)
    } else {
      setListaCidades([])
      return
    }
    const { data } = await query
    setListaCidades(data || [])
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
          cidades_atendidas: perfil.cidades_atendidas || []
        })
        setModoEdicao(true)
        setAceitouTermos(true)
        setAceitouPrivacidade(true)
      } else {
        await carregarRegioes('PR')
      }
    } catch (error) {
      console.error("Erro ao verificar perfil:", error)
    } finally {
      setLoading(false)
    }
  }

  async function excluirConta() {
    const confirmar = confirm("AVISO CRÍTICO: Isso apagará seu perfil, fotos e conta permanentemente. Deseja continuar?")
    if (!confirmar) return
    setStatus('Excluindo dados...')
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("Usuário não autenticado")
      if (formData.foto_perfil) {
        const urlPartes = formData.foto_perfil.split('/')
        const fileName = urlPartes[urlPartes.length - 1]
        await supabase.storage.from('fotos-perfil').remove([fileName])
      }
      const { error: dbError } = await supabase.from('prestadores').delete().eq('user_id', user.id)
      if (dbError) throw dbError
      await registrarLog('CONTA_EXCLUIDA')
      await supabase.auth.signOut()
      router.push('/login')
    } catch (error) {
      await registrarLog('ERRO_EXCLUSAO_CONTA', { erro: error.message }, 'erro')
      setStatus(`Erro: ${error.message || 'Falha ao excluir'}`)
    }
  }

  const formularioValido = calcularProgresso() === 100;

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
    } catch (error) {
      await registrarLog('ERRO_UPLOAD_FOTO', { erro: error.message }, 'erro')
      setStatus('Erro no upload.')
    } finally {
      setTimeout(() => setStatus(''), 2000)
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!formularioValido) return
    setStatus('Sincronizando...')
    try {
      await registrarLog(modoEdicao ? 'TENTATIVA_SALVAR_PERFIL' : 'TENTATIVA_CRIAR_PERFIL')
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("Sessão expirada.")
      const slugFinal = slugEditavel || (modoEdicao ? formData.slug : gerarSlug(formData.nome))
      const dadosParaSalvar = {
        ...formData,
        slug: slugFinal,
        user_id: user.id,
        status: 'ativo',
        aprovado_em: new Date()
      }
      const { error } = modoEdicao 
        ? await supabase.from('prestadores').update(dadosParaSalvar).eq('user_id', user.id)
        : await supabase.from('prestadores').insert([dadosParaSalvar])
      if (error) throw error
      setStatus('✅ PUBLICADO COM SUCESSO!')
      await registrarLog(modoEdicao ? 'PERFIL_ATUALIZADO_SUCESSO' : 'PERFIL_CRIADO_SUCESSO', { slug: slugFinal })
      setModoEdicao(true)
      setSlugEditavel('') 
      setFormData(prev => ({ ...prev, slug: slugFinal }))
    } catch (error) {
      if (error.code === '23505') {
        setStatus('⚠️ Nome indisponível')
        setSlugErro(true)
        if (!slugEditavel) setSlugEditavel(`${gerarSlug(formData.nome)}${Math.floor(10 + Math.random() * 90)}`)
      } else {
        await registrarLog('ERRO_SUBMIT_CADASTRO', { erro: error.message }, 'erro')
        setStatus(`Erro: ${error.message}`)
      }
    } finally {
      setTimeout(() => setStatus(''), 3000)
    }
  }

  const inputStyle = (campo) => {
    const base = "w-full p-4 rounded-2xl border outline-none transition-all placeholder:text-slate-500 text-slate-800 font-bold "
    const erro = touched[campo] && !formData[campo] ? "border-red-500 bg-red-50 shadow-inner" : "border-slate-100 bg-white focus:border-blue-500 focus:shadow-md"
    return base + erro
  }

  return (
    <main className="min-h-screen bg-[#F8FAFC] pb-20 font-sans">
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-slate-100 py-2">
        <div className="max-w-4xl mx-auto px-6 grid grid-cols-3 items-center">
          <div className="flex justify-start"><BackButton href="/" /></div>
          <div className="flex justify-center"><img src="/logo.png" alt="Logo" className="h-16 md:h-20 w-auto object-contain" /></div>
          <div className="flex justify-end">
             <button onClick={() => supabase.auth.signOut().then(() => router.push('/login'))} className="bg-red-50 text-red-500 px-4 py-2 rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-red-600 hover:text-white transition-all shadow-sm">Sair</button>
          </div>
        </div>
        
        {/* BARRA DE PROGRESSO DINÂMICA */}
        {!loading && (
          <div className="w-full h-1 bg-slate-100 mt-2 relative overflow-hidden">
            <div 
              className="absolute left-0 top-0 h-full bg-blue-600 transition-all duration-700 ease-out"
              style={{ width: `${calcularProgresso()}%` }}
            />
          </div>
        )}
      </nav>

      {loading ? <CadastroSkeleton /> : (
        <div className="w-full max-w-xl mx-auto px-4 pt-32 animate-in fade-in duration-500">
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
              {slugErro && (
                <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100">
                  <label className="text-amber-600 font-black text-[9px] uppercase mb-2 block">Nome indisponível, ajuste sua URL:</label>
                  <input ref={slugInputRef} value={slugEditavel} onChange={(e) => setSlugEditavel(gerarSlug(e.target.value))} className="w-full bg-white border-none outline-none text-slate-800 font-black text-xs" />
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input value={formData.whatsapp} placeholder="WhatsApp" onChange={(e) => setFormData({...formData, whatsapp: aplicarMascaraWhatsapp(e.target.value)})} className={inputStyle('whatsapp')} />
                <select value={formData.categoria} onChange={(e) => setFormData({...formData, categoria: e.target.value})} className={inputStyle('categoria')}>
                  <option value="">Especialidade</option>
                  {CATEGORIAS_OFICIAIS.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
              </div>
            </section>

            <section className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm">
              <label className="text-slate-400 font-black text-[9px] uppercase ml-2 mb-4 block tracking-widest">Habilidades Extras</label>
              <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto p-1 custom-scrollbar">
                {CATEGORIAS_OFICIAIS.map(cat => (
                  <button key={cat} type="button" disabled={cat === formData.categoria} onClick={() => toggleItem(cat, 'habilidades')} className={`px-4 py-3 rounded-2xl text-[9px] font-black uppercase transition-all ${formData.habilidades.includes(cat) ? 'bg-blue-600 text-white shadow-lg' : 'bg-slate-50 text-slate-400 border'}`}>{cat}</button>
                ))}
              </div>
            </section>

            <section className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm space-y-5">
              <label className="text-blue-600 font-black text-[9px] uppercase ml-2 block italic">Onde você atende?</label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <select value={formData.estado_sigla} onChange={(e) => {setFormData({...formData, estado_sigla: e.target.value, regiao_id: '', cidade_id: ''}); carregarRegioes(e.target.value)}} className={inputStyle('estado_sigla')}>
                  {listaEstados.map(est => <option key={est.sigla} value={est.sigla}>{est.nome}</option>)}
                </select>
                <select value={formData.regiao_id} onChange={(e) => {setFormData({...formData, regiao_id: e.target.value, cidade_id: ''}); carregarCidades(e.target.value)}} className={inputStyle('regiao_id')}>
                  <option value="">Região (Opcional)</option>
                  {listaRegioes.map(reg => <option key={reg.id} value={reg.id}>{reg.nome}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <select value={formData.cidade_id} onChange={(e) => setFormData({...formData, cidade_id: e.target.value})} className={inputStyle('cidade_id')}>
                  <option value="">Cidade Sede</option>
                  {listaCidades.map(cid => <option key={cid.id} value={cid.id}>{cid.nome}</option>)}
                </select>
                <input value={formData.bairro} placeholder="Bairro" onChange={(e) => setFormData({...formData, bairro: e.target.value})} className={inputStyle('bairro')} />
              </div>
            </section>

            <section className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm space-y-6">
              <div className="flex flex-wrap gap-2">
                {TAGS_DISPONIVEIS.map(tag => (
                  <button key={tag} type="button" onClick={() => toggleItem(tag, 'tags')} className={`px-4 py-3 rounded-2xl text-[9px] font-black uppercase transition-all ${formData.tags.includes(tag) ? 'bg-blue-600 text-white' : 'bg-slate-50 text-slate-400 border'}`}>{tag}</button>
                ))}
              </div>
              <textarea value={formData.bio} placeholder="Breve resumo do seu trabalho..." onChange={(e) => setFormData({...formData, bio: e.target.value})} className={`${inputStyle('bio')} h-32 resize-none`} />
            </section>

            <section className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm space-y-4">
              <label className="flex items-center gap-4 cursor-pointer">
                <input type="checkbox" checked={aceitouTermos} onChange={(e) => setAceitouTermos(e.target.checked)} className="w-5 h-5 rounded border-slate-200 text-blue-600" />
                <span className="text-[10px] font-bold text-slate-500 uppercase">Aceito os Termos</span>
              </label>
              <label className="flex items-center gap-4 cursor-pointer">
                <input type="checkbox" checked={aceitouPrivacidade} onChange={(e) => setAceitouPrivacidade(e.target.checked)} className="w-5 h-5 rounded border-slate-200 text-blue-600" />
                <span className="text-[10px] font-bold text-slate-500 uppercase">Aceito a Privacidade</span>
              </label>
            </section>

            <button type="submit" disabled={!formularioValido} className={`w-full py-6 rounded-[2.5rem] font-black text-xs uppercase tracking-[0.3em] transition-all shadow-xl ${formularioValido ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-200' : 'bg-slate-200 text-slate-400'}`}>
              {status || (modoEdicao ? 'Salvar Alterações' : 'Finalizar Cadastro')}
            </button>
          </form>
        </div>
      )}
    </main>
  )
}