'use client'
import { useState, useEffect, useRef, Suspense } from 'react'
import { supabase } from '@/lib/supabase'
import { CATEGORIAS_OFICIAIS } from '@/lib/categorias'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import BackButton from '@/components/BackButton'
import Header from '@/components/Header'

const TAGS_DISPONIVEIS = ['24 Horas', 'Orçamento Grátis', 'Aceita Cartão', 'Garantia', 'Preço Justo']

const HABILIDADES_COMUNS = [
  "Eletricista", "Encanador", "Jardineiro", "Marceneiro", "Pintor", 
  "Pedreiro", "Técnico Ar-Condicionado", "Montador de Móveis", 
  "Marido de Aluguel", "Limpeza Pós-Obra"
]

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
      </div>
    </div>
  )
}

function FormularioCadastro() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const slugInputRef = useRef(null)
  const reivindicarId = searchParams.get('reivindicar')

  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState('')
  const [modoEdicao, setModoEdicao] = useState(false)
  const [touched, setTouched] = useState({})
  
  const [slugErro, setSlugErro] = useState(false)
  const [slugEditavel, setSlugEditavel] = useState('')
  const [salvoComSucesso, setSalvoComSucesso] = useState(false)

  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [userLogado, setUserLogado] = useState(null)

  const [listaEstados, setListaEstados] = useState([])
  const [listaRegioes, setListaRegioes] = useState([])
  const [listaCidades, setListaCidades] = useState([])
  const [cidadesRegiao, setCidadesRegiao] = useState([]) 

  const [aceitouTermos, setAceitouTermos] = useState(false) 
  const [aceitouPrivacidade, setAceitouPrivacidade] = useState(false)

  const [formData, setFormData] = useState({
    nome: '', whatsapp: '', categoria: '', estado_sigla: 'PR',
    regiao_id: '', cidade_id: '', bairro: '', bio: '',
    foto_perfil: '', tags: [], habilidades: [], slug: '',
    cidades_atendidas: [] // Adicionado para suportar seleção múltipla
  })

  useEffect(() => { 
    const inicializar = async () => {
      try {
        await carregarEstados()
        const { data: { session } } = await supabase.auth.getSession()
        
        if (session) {
          setUserLogado(session.user)
          await verificarPerfilExistente(session.user.id)
        } else if (reivindicarId) {
          await carregarPerfilReivindicado()
        }
      } catch (error) {
        console.error('Erro init:', error)
      } finally {
        setLoading(false)
      }
    }
    inicializar()
  }, [reivindicarId])

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
    } else {
      query = query.eq('estado_sigla', estadoSigla || formData.estado_sigla)
    }
    const { data } = await query
    setListaCidades(data || [])
    if (regiaoId) setCidadesRegiao(data || [])
    else setCidadesRegiao([])
  }

  async function verificarPerfilExistente(uid) {
    const { data: perfil } = await supabase.from('prestadores').select('*').eq('user_id', uid).maybeSingle()
    if (perfil) {
      if (reivindicarId) { router.push('/admin/perfil'); return; }
      await carregarRegioes(perfil.estado_sigla || 'PR')
      await carregarCidades(perfil.regiao_id, perfil.estado_sigla)
      setFormData({ ...perfil, tags: perfil.tags || [], habilidades: perfil.habilidades || [], cidades_atendidas: perfil.cidades_atendidas || [] })
      setModoEdicao(true); setAceitouTermos(true); setAceitouPrivacidade(true);
    } else if (reivindicarId) {
      await carregarPerfilReivindicado()
    }
  }

  async function carregarPerfilReivindicado() {
    const { data: pPublico } = await supabase.from('prestadores').select('*').eq('id', reivindicarId).single()
    if (pPublico) {
      await carregarRegioes(pPublico.estado_sigla || 'PR')
      await carregarCidades(pPublico.regiao_id, pPublico.estado_sigla)
      setFormData({ 
        ...pPublico, 
        tags: pPublico.tags || [], 
        habilidades: pPublico.habilidades || [],
        cidades_atendidas: pPublico.cidades_atendidas || []
      })
      setAceitouTermos(true); setAceitouPrivacidade(true);
    }
  }

  const aplicarMascaraWhatsapp = (v) => {
    const d = v.replace(/\D/g, '').slice(0, 11);
    if (d.length <= 2) return d.length > 0 ? `(${d}` : "";
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
        try {
            const urlPartes = formData.foto_perfil.split('/')
            const fileNameOld = urlPartes[urlPartes.length - 1]
            if(fileNameOld) await supabase.storage.from('fotos-perfil').remove([fileNameOld])
        } catch(e) {}
      }
      const fileName = `${Date.now()}.${arquivo.name.split('.').pop()}`
      const { error: uploadError } = await supabase.storage.from('fotos-perfil').upload(fileName, arquivo)
      if (uploadError) throw uploadError
      const { data: { publicUrl } } = supabase.storage.from('fotos-perfil').getPublicUrl(fileName)
      setFormData(prev => ({ ...prev, foto_perfil: publicUrl }))
      setStatus('Foto pronta!')
    } catch (error) { setStatus('Erro no upload.') } finally { setTimeout(() => setStatus(''), 2000) }
  }

  const calcularProgresso = () => {
    const campos = [
      formData.nome?.trim(),
      formData.whatsapp?.length >= 10,
      formData.categoria,
      formData.cidade_id,
      formData.foto_perfil,
      aceitouTermos,
      aceitouPrivacidade,
      (!userLogado ? (email.includes('@') && senha.length >= 6) : true)
    ]
    const preenchidos = campos.filter(Boolean).length
    return Math.round((preenchidos / campos.length) * 100)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const formularioValido = calcularProgresso() === 100
    if (!formularioValido) return
    setStatus('Processando...')
    
    try {
      let finalUserId = userLogado?.id

      if (!userLogado) {
        if (!email || !senha) { setStatus('Preencha email e senha'); return; }
        const { data: authData, error: authError } = await supabase.auth.signUp({ email, password: senha })
        if (authError) throw authError
        if (!authData.user) throw new Error("Erro ao criar usuário")
        finalUserId = authData.user.id
      }

      const slugFinal = slugEditavel || (modoEdicao ? formData.slug : gerarSlug(formData.nome))
      
      const dadosParaSalvar = {
        ...formData,
        slug: slugFinal,
        user_id: finalUserId,
        regiao_id: formData.regiao_id === '' ? null : formData.regiao_id,
        cidade_id: formData.cidade_id === '' ? null : formData.cidade_id,
        status: 'ativo',
        origem_tipo: 'registro_direto', 
        verificado: reivindicarId ? true : formData.verificado,
        aprovado_em: new Date()
      }

      const { error } = (modoEdicao || reivindicarId)
        ? await supabase.from('prestadores').update(dadosParaSalvar).eq('id', formData.id || reivindicarId)
        : await supabase.from('prestadores').insert([dadosParaSalvar])
      
      if (error) {
        if (error.code === '23505') {
           setSlugErro(true); setStatus('⚠️ Endereço indisponível'); return;
        }
        throw error
      }

      setStatus('✅ SUCESSO!')
      if (reivindicarId) {
         await supabase.from('logs_atividades').insert({
            acao: 'PERFIL_REIVINDICADO',
            usuario_id: finalUserId,
            detalhes: { prestador_id: reivindicarId }
         })
      }
      setSalvoComSucesso(true)

    } catch (error) { 
      console.error(error)
      setStatus('Erro: ' + error.message) 
    }
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

  if (loading) return <CadastroSkeleton />

  if (salvoComSucesso) {
    return (
      <main className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-6 font-sans">
        <div className="w-full max-w-md bg-white rounded-[3rem] p-10 border border-slate-100 shadow-xl text-center animate-in zoom-in-95 duration-500">
          <div className="w-20 h-20 bg-green-500 rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-lg shadow-green-100">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-black text-slate-900 uppercase italic tracking-tighter mb-2">Perfil Salvo!</h2>
          <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest leading-relaxed mb-8">
            Suas informações foram atualizadas com sucesso e já estão ativas na vitrine.
          </p>
          <Link href="/" className="block w-full py-5 bg-blue-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-blue-700 transition-all active:scale-95 shadow-xl shadow-blue-100">
            Voltar para a Home
          </Link>
        </div>
      </main>
    )
  }

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
             {userLogado && (
                <button onClick={async () => { await supabase.auth.signOut(); window.location.href = '/login' }} className="bg-red-50 text-red-500 px-4 py-2 rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-red-600 hover:text-white transition-all shadow-sm active:scale-95">Sair</button>
             )}
          </div>
        </div>
        {!loading && (
          <div className="w-full h-1 bg-slate-50 relative overflow-hidden">
            <div className="absolute left-0 top-0 h-full bg-blue-600 transition-all duration-700 ease-out" style={{ width: `${calcularProgresso()}%` }} />
          </div>
        )}
      </nav>

      <div className="w-full max-w-xl mx-auto px-4 pt-32 md:pt-40 animate-in fade-in duration-500">
        <header className="mb-10 pl-2">
          <h1 className="text-3xl font-black text-slate-900 tracking-tight uppercase italic">
             {reivindicarId ? 'Assumir Perfil' : modoEdicao ? 'Meu Perfil' : 'Cadastro'}
          </h1>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-blue-600 font-black text-[10px] uppercase tracking-widest">{calcularProgresso()}% concluído</span>
          </div>
        </header>

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">

          {!userLogado ? (
             <section className="bg-slate-50/80 p-8 rounded-[2.5rem] border border-blue-100 shadow-sm shadow-blue-50/50 space-y-4 animate-in slide-in-from-top-4">
                <div className="flex items-center justify-between mb-2">
                   <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-200">
                         <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                         </svg>
                      </div>
                      <div>
                         <h2 className="font-bold uppercase text-[10px] tracking-widest text-slate-900 leading-none">Segurança de Acesso</h2>
                         <p className="text-[9px] text-slate-400 font-medium uppercase mt-1 tracking-tighter">Crie seus dados de login</p>
                      </div>
                   </div>
                   <span className="bg-blue-100 text-blue-600 text-[8px] font-black px-2 py-0.5 rounded-full uppercase">Obrigatório</span>
                </div>
                <div className="space-y-3">
                   <input type="email" placeholder="Seu melhor e-mail" value={email} onChange={e => setEmail(e.target.value)} className="w-full p-4 rounded-2xl bg-white border border-slate-100 placeholder:text-slate-300 text-slate-800 font-bold outline-none focus:border-blue-500 focus:shadow-md focus:shadow-blue-50 transition-all" />
                   <input type="password" placeholder="Senha (mínimo 6 caracteres)" value={senha} onChange={e => setSenha(e.target.value)} className="w-full p-4 rounded-2xl bg-white border border-slate-100 placeholder:text-slate-300 text-slate-800 font-bold outline-none focus:border-blue-500 focus:shadow-md focus:shadow-blue-50 transition-all" />
                </div>
             </section>
          ) : (
             reivindicarId && (
               <div className="bg-emerald-50 p-6 rounded-[2rem] border border-emerald-100 flex items-start gap-4 animate-in fade-in">
                 <div className="text-xl">👤</div>
                 <div>
                   <p className="text-emerald-800 font-bold text-xs uppercase tracking-tight">Logado como: {userLogado.email}</p>
                   <p className="text-[10px] text-emerald-600/80 mt-1">Este perfil será vinculado à sua conta atual.</p>
                 </div>
               </div>
             )
          )}

          <section className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm flex flex-col items-center">
            <div className="relative group">
              <div className="w-32 h-32 rounded-[2.5rem] bg-slate-50 border-2 border-dashed border-slate-200 overflow-hidden flex items-center justify-center transition-all group-hover:border-blue-400">
                {formData.foto_perfil ? <img src={formData.foto_perfil} className="w-full h-full object-cover" /> : <span className="text-slate-300 font-black text-[10px] uppercase">Foto</span>}
              </div>
              <input type="file" accept="image/*" onChange={fazerUploadFoto} className="absolute inset-0 opacity-0 cursor-pointer" />
            </div>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-4 italic mb-6">{status || 'Toque para alterar a foto'}</p>

            <div className="w-full border-t border-slate-50 pt-6 animate-in fade-in">
              <label className="text-blue-600 font-black text-[9px] uppercase ml-2 block italic tracking-widest mb-3">Sua Profissão Principal</label>
              <select value={formData.categoria || ''} onChange={(e) => setFormData({...formData, categoria: e.target.value})} className="w-full p-4 rounded-2xl border border-slate-100 bg-slate-50 focus:border-blue-500 focus:shadow-md outline-none transition-all font-bold text-slate-800">
                <option value="">Selecione sua Categoria</option>
                {CATEGORIAS_OFICIAIS.map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>
            </div>
          </section>

          <section className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm space-y-5">
            <input value={formData.nome} placeholder="Nome Completo" onChange={(e) => setFormData({...formData, nome: e.target.value})} className={inputStyle('nome')} />
            
            {slugErro && (
               <div className="bg-amber-50 p-6 rounded-[2rem] border border-amber-200 mb-4">
                  <p className="text-amber-700 font-bold text-xs mb-2">Endereço indisponível</p>
                  <button type="button" onClick={() => { setSlugEditavel(`${gerarSlug(formData.nome)}-${Math.floor(10 + Math.random() * 90)}`); setSlugErro(false); }} className="text-[10px] font-black uppercase text-amber-600 underline">Gerar automático</button>
               </div>
            )}

            <input value={formData.whatsapp} placeholder="WhatsApp" onChange={(e) => setFormData({...formData, whatsapp: aplicarMascaraWhatsapp(e.target.value)})} className={inputStyle('whatsapp')} />

            {formData.categoria && (
              <div className="pt-4 mt-2 border-t border-slate-100 animate-in fade-in">
                <label className="text-slate-400 font-black text-[9px] uppercase ml-2 block italic tracking-widest mb-3">Você também realiza estes serviços?</label>
                <div className="flex flex-wrap gap-2">
                  {HABILIDADES_COMUNS
                    .filter(hab => hab !== formData.categoria)
                    .map(hab => (
                    <button key={hab} type="button" onClick={() => toggleItem(hab, 'habilidades')} className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase transition-all border ${formData.habilidades.includes(hab) ? 'bg-blue-600 text-white border-blue-600 shadow-md' : 'bg-slate-50 text-slate-400 border-slate-100 hover:border-blue-200'}`}>{hab}</button>
                  ))}
                </div>
              </div>
            )}
          </section>

          <section className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm space-y-5">
            <label className="text-blue-600 font-black text-[9px] uppercase ml-2 block italic tracking-widest">Localização</label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <select value={formData.estado_sigla || ''} onChange={(e) => { const sigla = e.target.value; setFormData({...formData, estado_sigla: sigla, regiao_id: '', cidade_id: '', cidades_atendidas: []}); carregarRegioes(sigla); }} className={inputStyle('estado_sigla')}>
                {listaEstados.map(est => <option key={est.sigla} value={est.sigla}>{est.nome}</option>)}
              </select>
              <select 
                value={formData.regiao_id || ''} 
                onChange={(e) => { const rId = e.target.value; setFormData({...formData, regiao_id: rId, cidade_id: '', cidades_atendidas: []}); carregarCidades(rId, formData.estado_sigla); }} 
                className={inputStyle('regiao_id')}
              >
                <option value="">Região (Opcional)</option>
                {listaRegioes.map(reg => <option key={reg.id} value={reg.id}>{reg.nome}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <select value={formData.cidade_id || ''} onChange={(e) => setFormData({...formData, cidade_id: e.target.value, cidades_atendidas: []})} className={inputStyle('cidade_id')}>
                <option value="">Cidade Sede</option>
                {listaCidades.map(cid => <option key={cid.id} value={cid.id}>{cid.nome}</option>)}
              </select>
              <input value={formData.bairro} placeholder="Bairro Principal" onChange={(e) => setFormData({...formData, bairro: e.target.value})} className={inputStyle('bairro')} />
            </div>

            {/* BLOCO DE SELEÇÃO DE CIDADES DA REGIÃO METROPOLITANA */}
            {formData.regiao_id && cidadesRegiao.length > 1 && formData.cidade_id && (
              <div className="mt-4 pt-4 border-t border-slate-100 animate-in fade-in">
                <label className="text-slate-400 font-black text-[9px] uppercase ml-2 block italic tracking-widest mb-3">
                  Atende outras cidades na região?
                </label>
                <div className="flex flex-wrap gap-2">
                  {cidadesRegiao
                    .filter(cid => cid.id !== formData.cidade_id)
                    .map(cid => (
                    <button 
                      key={cid.id} 
                      type="button" 
                      onClick={() => toggleItem(cid.nome, 'cidades_atendidas')} 
                      className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase transition-all border ${formData.cidades_atendidas?.includes(cid.nome) ? 'bg-blue-600 text-white border-blue-600 shadow-md' : 'bg-slate-50 text-slate-400 border-slate-100 hover:border-blue-200'}`}
                    >
                      {cid.nome}
                    </button>
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

          <button type="submit" disabled={calcularProgresso() < 100} className={`w-full py-6 rounded-[2.5rem] font-black text-xs uppercase tracking-[0.3em] transition-all shadow-xl ${calcularProgresso() === 100 ? 'bg-blue-600 text-white hover:bg-blue-700 active:scale-[0.98]' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}>
            {status || (reivindicarId ? 'Salvar e Assumir Perfil' : modoEdicao ? 'Salvar Alterações' : 'Criar Meu Perfil')}
          </button>
        </form>
      </div>
    </main>
  )
}

export default function CadastroWrapper() {
  return (
    <Suspense fallback={<CadastroSkeleton />}>
      <FormularioCadastro />
    </Suspense>
  )
}