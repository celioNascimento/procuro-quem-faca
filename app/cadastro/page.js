'use client'

import { useState, useEffect, Suspense, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Header from '@/components/Header'
import BackButton from '@/components/BackButton'
import CadastroCard from '@/components/auth/CadastroCard'
import ModalConfirmacao from '@/components/ui/ModalConfirmacao'

function CadastroSkeleton() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center pt-32 px-4 animate-pulse">
      <div className="w-full max-w-7xl grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="h-64 bg-white rounded-[3rem] border border-slate-100 shadow-sm col-span-1" />
        <div className="h-[500px] bg-white rounded-[3rem] border border-slate-100 shadow-sm col-span-2" />
      </div>
    </div>
  )
}

function FormularioCadastro() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const reivindicarId = searchParams.get('reivindicar')

  const inputStyle = () => `w-full px-4 py-3.5 rounded-xl border border-slate-100 outline-none transition-all font-bold text-slate-800 bg-white shadow-sm placeholder-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-50 disabled:bg-slate-50 disabled:text-slate-400`

  const aplicarMascaraWhatsapp = (v) => {
    if (!v) return "";
    v = v.replace(/\D/g, "");
    if (v.length > 11) v = v.slice(0, 11);
    if (v.length <= 10) return v.replace(/(\d{2})(\d{4})(\d{0,4})/, "($1) $2-$3");
    return v.replace(/(\d{2})(\d{1})(\d{4})(\d{4})/, "($1) $2 $3-$4");
  };

  const formatarParaSlug = (txt) => txt ? txt.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, "").replace(/[^\w\s-]/g, '').replace(/\s+/g, '').trim() : "";

  const [mounted, setMounted] = useState(false)
  const [loading, setLoading] = useState(true)
  const [isRedirecting, setIsRedirecting] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [status, setStatus] = useState('')
  const [tentouEnviar, setTentouEnviar] = useState(false)
  const [modoEdicao, setModoEdicao] = useState(false)
  
  const [userLogado, setUserLogado] = useState(null)
  
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [aceitouTermos, setAceitouTermos] = useState(false)
  const [aceitouPrivacidade, setAceitouPrivacidade] = useState(false)

  const [formData, setFormData] = useState({
    id: null,
    nome: '', whatsapp: '', grupo_id: '', categoria_id: '',
    estado_sigla: 'PR', regiao_id: '', cidade_id: '', bairro: '',
    bio: '', foto_perfil: '', slug: '', cidades_atendidas: [], habilidades: []
  })

  const [listaGrupos, setListaGrupos] = useState([])
  const [listaCategorias, setListaCategorias] = useState([])
  const [listaEstados, setListaEstados] = useState([])
  const [listaRegioes, setListaRegioes] = useState([])
  const [listaCidades, setListaCidades] = useState([])
  const [cidadesRegiao, setCidadesRegiao] = useState([])
  const [todasHabilidades, setTodasHabilidades] = useState([])
  
  const [slugDisponivel, setSlugDisponivel] = useState(true)
  const [checandoSlug, setChecandoSlug] = useState(false)
  const [editouSlugManualmente, setEditouSlugManualmente] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  const carregarCategorias = useCallback(async (grupoId) => {
    if (!grupoId) {
      setListaCategorias([]);
      return;
    }
    const { data } = await supabase.from('categorias').select('*').eq('grupo_id', grupoId).order('nome')
    setListaCategorias(data || [])
  }, [])

  const carregarRegioes = useCallback(async (siglaEstado) => {
    if (!siglaEstado) {
      setListaRegioes([]);
      return;
    }
    const { data } = await supabase.from('regioes').select('*').eq('estado_sigla', siglaEstado).order('nome')
    setListaRegioes(data || [])
  }, [])

  const carregarCidades = useCallback(async (regiaoId, estadoSigla) => {
    let query = supabase.from('cidades').select('*').eq('ativa', true).order('nome')
    
    if (regiaoId) {
      query = query.eq('regiao_id', regiaoId)
    } else if (estadoSigla) {
      query = query.eq('estado_sigla', estadoSigla)
    } else {
      setListaCidades([]);
      setCidadesRegiao([]);
      return;
    }
    
    const { data } = await query
    setListaCidades(data || [])
    setCidadesRegiao(data || [])
  }, [])

  const verificarSlugBD = useCallback(async (slugTeste) => {
    if (!slugTeste || slugTeste.length < 3) return;
    setChecandoSlug(true);
    const { data } = await supabase.from('prestadores').select('id')
      .eq('slug', slugTeste)
      .neq('id', formData.id || -1)
      .maybeSingle();
    setSlugDisponivel(!data);
    setChecandoSlug(false);
  }, [formData.id]);

  useEffect(() => {
    if (formData.slug) {
      const timer = setTimeout(() => verificarSlugBD(formData.slug), 500);
      return () => clearTimeout(timer);
    }
  }, [formData.slug, verificarSlugBD]);

  useEffect(() => {
    const carregarTudo = async () => {
      try {
        setLoading(true);

        const { data: { session } } = await supabase.auth.getSession()
        
        if (session?.user && !reivindicarId) {
            setIsRedirecting(true);
            router.replace('/dashboard');
            return;
        }

        if (session?.user) {
          setUserLogado(session.user);
          setEmail(session.user.email);
        } else {
          setUserLogado(null);
        }

        const [gruposRes, estadosRes, habilidadesRes] = await Promise.all([
          supabase.from('categorias_grupos').select('*').order('nome'),
          supabase.from('estados').select('*').order('nome'),
          supabase.from('habilidades').select('nome, categoria').order('nome')
        ]);

        if (gruposRes.data) setListaGrupos(gruposRes.data);
        if (estadosRes.data) setListaEstados(estadosRes.data);
        if (habilidadesRes.data) setTodasHabilidades(habilidadesRes.data);

        let perfilParaCarregar = null;

        if (reivindicarId) {
            const { data: perfilReivindicar } = await supabase.from('prestadores').select('*').eq('id', reivindicarId).maybeSingle();
            if (perfilReivindicar) {
                perfilParaCarregar = perfilReivindicar;
                setAceitouTermos(true);
                setAceitouPrivacidade(true);
                setModoEdicao(false); 
            }
        }

        if (perfilParaCarregar) {
            if (perfilParaCarregar.grupo_id) await carregarCategorias(perfilParaCarregar.grupo_id);
            if (perfilParaCarregar.estado_sigla) await carregarRegioes(perfilParaCarregar.estado_sigla);
            await carregarCidades(perfilParaCarregar.regiao_id, perfilParaCarregar.estado_sigla);

            setFormData({
                ...perfilParaCarregar,
                cidades_atendidas: perfilParaCarregar.cidades_atendidas || [],
                habilidades: perfilParaCarregar.habilidades || [],
                bio: perfilParaCarregar.bio || '',
                foto_perfil: perfilParaCarregar.foto_perfil || '',
                bairro: perfilParaCarregar.bairro || '',
                slug: perfilParaCarregar.slug || formatarParaSlug(perfilParaCarregar.nome),
                grupo_id: perfilParaCarregar.grupo_id || '',
                categoria_id: perfilParaCarregar.categoria_id || '',
                estado_sigla: perfilParaCarregar.estado_sigla || 'PR',
                regiao_id: perfilParaCarregar.regiao_id || '',
                cidade_id: perfilParaCarregar.cidade_id || ''
            });

            if (perfilParaCarregar.slug) setEditouSlugManualmente(true);
        } else if (!reivindicarId && !modoEdicao) {
            await carregarRegioes('PR');
            await carregarCidades('', 'PR');
        }

      } catch (error) {
        console.error('Erro inicialização:', error);
      } finally {
        setLoading(false);
      }
    };

    carregarTudo();
  }, [reivindicarId, router, carregarCategorias, carregarRegioes, carregarCidades]);

  const handleEstadoChange = async (e) => {
    const novaSigla = e.target.value;
    setFormData(prev => ({ 
        ...prev, 
        estado_sigla: novaSigla, 
        regiao_id: '', 
        cidade_id: '', 
        bairro: '', 
        cidades_atendidas: [] 
    }));
    await carregarRegioes(novaSigla);
    await carregarCidades('', novaSigla);
  };

  const handleRegiaoChange = async (e) => {
    const novoRegiaoId = e.target.value;
    setFormData(prev => ({ 
        ...prev, 
        regiao_id: novoRegiaoId, 
        cidade_id: '', 
        bairro: '', 
        cidades_atendidas: [] 
    }));
    await carregarCidades(novoRegiaoId, formData.estado_sigla);
  };

  const handleGrupoChange = async (e) => {
    const novoGrupoId = e.target.value;
    setFormData(prev => ({ 
        ...prev, 
        grupo_id: novoGrupoId, 
        categoria_id: '', 
        habilidades: [] 
    }));
    await carregarCategorias(novoGrupoId);
  };

  const toggleItem = (item, lista) => {
    const listaAtual = formData[lista] || [];
    const novaLista = listaAtual.includes(item)
      ? listaAtual.filter(i => i !== item)
      : [...listaAtual, item];
    setFormData(prev => ({ ...prev, [lista]: novaLista }));
  };

  const fazerUploadFoto = async (e) => {
    const arquivo = e.target.files[0]
    if (!arquivo) return
    setStatus('Subindo foto...')
    try {
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}`
      const { error: uploadError } = await supabase.storage.from('fotos-perfil').upload(fileName, arquivo)
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from('fotos-perfil').getPublicUrl(fileName)
      setFormData(prev => ({ ...prev, foto_perfil: publicUrl }))
      setStatus('Foto ok!')
    } catch (err) { 
        setStatus('Erro no upload');
    } finally { 
        setTimeout(() => setStatus(''), 2000) 
    }
  }

  const handleExcluirPerfil = async () => {
    setStatus('Excluindo...')
    try {
      const targetId = reivindicarId || formData.id;
      if (!targetId) return;
      const { error } = await supabase.from('prestadores').delete().eq('id', targetId)
      if (error) throw error
      router.push('/')
    } catch (err) { setStatus('Erro ao excluir') }
  }

  const handleLogout = async () => {
      await supabase.auth.signOut();
      window.location.reload();
  }

  const calcularProgresso = () => {
    const authOk = userLogado ? true : (email.includes('@') && senha.length >= 6);
    const campos = [
      formData.nome?.trim().length > 3,
      formData.whatsapp?.replace(/\D/g, "").length >= 10,
      formData.grupo_id, formData.categoria_id, formData.cidade_id,
      formData.foto_perfil?.length > 10, aceitouTermos, aceitouPrivacidade,
      slugDisponivel,
      authOk
    ]
    return Math.round((campos.filter(Boolean).length / campos.length) * 100)
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setTentouEnviar(true);
    
    if (!formData.foto_perfil) { setStatus('❌ A foto de perfil é obrigatória.'); return; }
    if (!slugDisponivel) { setStatus('❌ Escolha uma URL diferente.'); return; }
    if (loading || calcularProgresso() < 100) return;
    
    setLoading(true); setStatus('Sincronizando...');
    
    try {
      let userId = userLogado?.id;
      
      if (!userId) {
        const { data: auth, error: aErr } = await supabase.auth.signUp({ 
            email, password: senha, options: { data: { nome: formData.nome } }
        });
        if (aErr) throw aErr;
        userId = auth.user?.id;
        if (!userId) throw new Error("Erro ao criar usuário ID");
      }

      const cidadeSedeNome = listaCidades.find(c => String(c.id) === String(formData.cidade_id))?.nome;
      const cidadesAtendidasLimpo = [...new Set(formData.cidades_atendidas || [])].filter(nome => nome !== cidadeSedeNome && nome !== "");

      if (reivindicarId && userId) {
          await supabase.from('prestadores').update({ user_id: null }).eq('user_id', userId);
      }
      
      const payload = { 
        ...formData, 
        cidades_atendidas: cidadesAtendidasLimpo, 
        id: formData.id ? parseInt(formData.id) : undefined,
        user_id: userId, 
        status: 'ativo', 
        origem_tipo: reivindicarId ? 'reivindicado' : 'registro_direto',
        verificado: false 
      };
      
      const { error: dbError } = await supabase.from('prestadores').upsert(payload);
      if (dbError) throw dbError;
      
      if (!userLogado) {
          await supabase.auth.signInWithPassword({ email, password: senha });
      }

      window.location.href = '/dashboard';
    } catch (err) { 
        console.error(err);
        setStatus(`❌ Erro ao salvar: ${err.message}`); 
        setLoading(false); 
    }
  }

  const habilidadesExtrasDisponiveis = listaCategorias
    .filter(cat => String(cat.id) !== String(formData.categoria_id))
    .map(cat => cat.nome);

  if (!mounted || loading || isRedirecting) return <CadastroSkeleton />

  return (
    <main className="min-h-screen bg-[#F8FAFC] pb-20 font-sans antialiased overflow-x-hidden">
      <Header href="/" />
      
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100 h-16 md:h-20 flex items-center px-6">
        <div className="max-w-7xl mx-auto w-full flex justify-between items-center">
          <BackButton href="/" />
          <Link href="/"><img src="/logo.png" alt="Logo" className="h-10 md:h-12 w-auto" /></Link>
          <div className="w-10"></div>
        </div>
        <div className="absolute bottom-0 left-0 w-full h-1 bg-slate-50">
          <div className="h-full bg-blue-600 transition-all duration-700" style={{ width: `${calcularProgresso()}%` }} />
        </div>
      </nav>

      <div className="w-full px-4 pt-32 md:pt-40 max-w-7xl mx-auto">
        <CadastroCard 
            title={reivindicarId ? 'Assumir Perfil' : modoEdicao ? 'Meu Perfil' : 'Cadastro'} 
            progresso={calcularProgresso()} 
            isReivindicando={!!reivindicarId || modoEdicao} 
            onExcluir={() => setIsModalOpen(true)}
        >
          <form onSubmit={handleSubmit} className="grid grid-cols-12 gap-8">
            
            <div className="col-span-12 md:col-span-4 space-y-6">
              <section className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm flex flex-col items-center gap-6 sticky top-24">
                <div className={`relative w-40 h-40 md:w-48 md:h-48 rounded-[3.5rem] bg-slate-50 border-2 border-dashed flex items-center justify-center overflow-hidden group transition-all ${tentouEnviar && !formData.foto_perfil ? 'border-red-500 bg-red-50' : 'hover:border-blue-400 hover:bg-blue-50'}`}>
                  {formData.foto_perfil ? 
                    <img src={formData.foto_perfil} alt="Preview" className="w-full h-full object-cover transition-transform group-hover:scale-105" /> 
                    : <span className="text-slate-300 font-black text-xs text-center px-4 uppercase tracking-tighter italic">Foto Profissional</span>
                  }
                  <input type="file" accept="image/*" onChange={fazerUploadFoto} className="absolute inset-0 opacity-0 cursor-pointer" />
                  <div className="absolute bottom-2 bg-black/50 text-white text-[8px] px-3 py-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">Alterar</div>
                </div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic text-center">Complete seu perfil para finalizar</p>
              </section>
            </div>

            <div className="col-span-12 md:col-span-8 space-y-6">
              
              {!userLogado && (
                <section className="bg-blue-600 p-8 rounded-[2.5rem] shadow-xl shadow-blue-100 space-y-4">
                  <div className="flex justify-between items-center">
                    <h2 className="font-black uppercase text-[10px] tracking-widest text-blue-100 italic">Crie seu Acesso</h2>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input type="email" placeholder="E-mail" value={email} onChange={e => setEmail(e.target.value)} className="w-full p-4 rounded-2xl border-none outline-none font-bold text-slate-800 bg-white shadow-inner" required />
                    <input type="password" placeholder="Senha (mín. 6 caracteres)" value={senha} onChange={e => setSenha(e.target.value)} className={`w-full p-4 rounded-2xl border-none outline-none font-bold text-slate-800 bg-white shadow-inner ${tentouEnviar && senha.length < 6 ? 'border-2 border-red-400' : ''}`} required />
                  </div>
                </section>
              )}

              {userLogado && (
                <section className="bg-blue-50 p-6 rounded-[2rem] border border-blue-100 flex flex-col md:flex-row items-center justify-between gap-4">
                   <div className="text-center md:text-left">
                      <p className="text-[10px] font-black uppercase tracking-widest text-blue-400 italic">Você está logado como:</p>
                      <p className="font-bold text-blue-900 text-sm">{userLogado.email}</p>
                   </div>
                   <button 
                     type="button" 
                     onClick={handleLogout}
                     className="px-6 py-3 bg-white text-blue-600 rounded-xl text-xs font-black uppercase tracking-wider shadow-sm hover:shadow-md transition-all border border-blue-100"
                   >
                     Entrar com outra conta
                   </button>
                </section>
              )}

              <section className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm space-y-4">
                <h2 className="font-black uppercase text-[10px] tracking-widest text-slate-400 italic mb-4">O que você faz?</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <select value={formData.grupo_id || ''} onChange={handleGrupoChange} className={inputStyle()} required>
                    <option value="">Grupo de Atuação</option>
                    {listaGrupos.map(g => <option key={g.id} value={g.id}>{g.nome}</option>)}
                  </select>

                  <select value={formData.categoria_id || ''} onChange={e => setFormData({ ...formData, categoria_id: e.target.value, habilidades: [] })} className={inputStyle()} required>
                    <option value="">Profissão Principal</option>
                    {listaCategorias.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                  </select>
                </div>

                {formData.categoria_id && habilidadesExtrasDisponiveis.length > 0 && (
                  <div className="pt-2">
                    <label className="text-slate-400 font-black text-[9px] uppercase block italic mb-3 tracking-tighter">Habilidades extras:</label>
                    <div className="flex flex-wrap gap-2">
                      {habilidadesExtrasDisponiveis.map(h => (
                        <button key={h} type="button" onClick={() => toggleItem(h, 'habilidades')} className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase border transition-all ${formData.habilidades?.includes(h) ? 'bg-blue-600 text-white border-blue-600 shadow-lg scale-95' : 'bg-slate-50 text-slate-400 border-slate-100 hover:border-slate-200'}`}>
                          {h}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </section>

              <section className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm space-y-5">
                <div className="space-y-4">
                  <input value={formData.nome || ''} placeholder="Nome Profissional" onChange={e => { const novoNome = e.target.value; setFormData(prev => ({ ...prev, nome: novoNome, slug: editouSlugManualmente ? prev.slug : formatarParaSlug(novoNome) })); }} className={inputStyle()} required />
                    
                  <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 relative overflow-hidden">
                    <label className="text-slate-400 font-black text-[9px] uppercase tracking-widest italic mb-2 block">Link do seu perfil (slug)</label>
                    <div className="flex items-center gap-1 font-bold text-sm">
                      <span className="text-slate-300">procuroquemfaca.com.br/</span>
                      <input 
                        value={formData.slug || ''} 
                        onChange={(e) => { setEditouSlugManualmente(true); setFormData({...formData, slug: formatarParaSlug(e.target.value)}) }} 
                        className="bg-transparent border-none outline-none text-blue-600 flex-1 min-w-0"
                        placeholder="seu-nome"
                      />
                      {checandoSlug ? <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" /> : (
                        (formData.slug?.length > 2) && (slugDisponivel ? <span className="text-green-500 text-xs">✅ Disponível</span> : <span className="text-red-500 text-xs">❌ Já existe</span>)
                      )}
                    </div>
                  </div>

                  <input value={formData.whatsapp || ''} placeholder="Seu WhatsApp" onChange={e => setFormData({ ...formData, whatsapp: aplicarMascaraWhatsapp(e.target.value) })} className={inputStyle()} required />
                  <textarea value={formData.bio || ''} placeholder="Bio rápida: Conte o que você faz de melhor..." onChange={e => setFormData({ ...formData, bio: e.target.value })} className={`${inputStyle()} h-32 resize-none`} />
                </div>
              </section>

              <section className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm space-y-6">
                <h2 className="font-black uppercase text-[10px] tracking-widest text-slate-400 italic">Onde você atende?</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <select value={formData.estado_sigla || ''} onChange={handleEstadoChange} className={inputStyle()} required>
                    <option value="">Estado</option>
                    {listaEstados.map(est => <option key={est.sigla} value={est.sigla}>{est.nome}</option>)}
                  </select>
                  <select value={formData.regiao_id || ''} onChange={handleRegiaoChange} className={inputStyle()} disabled={!formData.estado_sigla}>
                    <option value="">Região (Opcional)</option>
                    {listaRegioes.map(reg => <option key={reg.id} value={reg.id}>{reg.nome}</option>)}
                  </select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <select 
                      value={formData.cidade_id || ''} 
                      onChange={e => {
                        const cidId = e.target.value;
                        const nomeSede = listaCidades.find(c => String(c.id) === String(cidId))?.nome;
                        setFormData({ 
                          ...formData, 
                          cidade_id: cidId,
                          cidades_atendidas: formData.cidades_atendidas.filter(n => n !== nomeSede)
                        });
                      }} 
                      className={inputStyle()} 
                      required
                      disabled={!formData.estado_sigla}
                    >
                      <option value="">Cidade Sede</option>
                      {listaCidades.map(cid => <option key={cid.id} value={cid.id}>{cid.nome}</option>)}
                    </select>
                    
                    <input value={formData.bairro || ''} placeholder="Bairro" onChange={e => setFormData({ ...formData, bairro: e.target.value })} className={inputStyle()} />
                </div>

                {/* CORREÇÃO CIRÚRGICA: cidadesRegiao só aparece se regiao_id estiver selecionado */}
                {(formData.regiao_id && cidadesRegiao.length > 1 && formData.cidade_id) && (
                  <div className="pt-6 border-t border-slate-50">
                    <label className="text-slate-400 font-black text-[9px] uppercase block italic mb-4">Cidades vizinhas que você também atende:</label>
                    <div className="flex flex-wrap gap-2">
                      {cidadesRegiao.filter(c => String(c.id) !== String(formData.cidade_id)).map(cid => (
                        <button key={cid.id} type="button" onClick={() => toggleItem(cid.nome, 'cidades_atendidas')} className={`px-4 py-3 rounded-2xl text-[10px] font-black uppercase border transition-all ${formData.cidades_atendidas?.includes(cid.nome) ? 'bg-blue-600 text-white border-blue-600 shadow-lg scale-95' : 'bg-slate-50 text-slate-400 border-slate-100 hover:border-slate-300'}`}>
                          {cid.nome}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </section>

              <section className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm space-y-4">
                <label className="flex items-center gap-4 cursor-pointer group">
                  <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${aceitouTermos ? 'bg-blue-600 border-blue-600' : 'border-slate-200'}`}>
                    <input type="checkbox" checked={aceitouTermos} onChange={(e) => setAceitouTermos(e.target.checked)} className="hidden" />
                    {aceitouTermos && <span className="text-white text-xs">✓</span>}
                  </div>
                  <span className="text-[10px] font-black text-slate-500 uppercase italic transition-colors group-hover:text-blue-600">Li e aceito os termos</span>
                </label>
                <label className="flex items-center gap-4 cursor-pointer group">
                  <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${aceitouPrivacidade ? 'bg-blue-600 border-blue-600' : 'border-slate-200'}`}>
                    <input type="checkbox" checked={aceitouPrivacidade} onChange={(e) => setAceitouPrivacidade(e.target.checked)} className="hidden" />
                    {aceitouPrivacidade && <span className="text-white text-xs">✓</span>}
                  </div>
                  <span className="text-[10px] font-black text-slate-500 uppercase italic transition-colors group-hover:text-blue-600">Política de Privacidade</span>
                </label>
              </section>

              <button 
                type="submit" 
                disabled={loading || calcularProgresso() < 100}
                className={`w-full py-6 rounded-[2.5rem] font-black text-xs uppercase tracking-[0.3em] transition-all shadow-2xl ${calcularProgresso() === 100 && slugDisponivel ? 'bg-blue-600 text-white shadow-blue-200 hover:scale-[1.02] active:scale-95' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}
              >
                {status || (modoEdicao ? 'Salvar Alterações' : (reivindicarId ? 'Assumir Perfil' : 'Finalizar Cadastro'))}
              </button>
            </div>
          </form>
        </CadastroCard>
      </div>
      <ModalConfirmacao isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onConfirm={handleExcluirPerfil} title="Excluir Perfil?" message="Esta ação apagará seus dados permanentemente." />
    </main>
  )
}

export default function CadastroPage() {
  return <Suspense fallback={<CadastroSkeleton />}><FormularioCadastro /></Suspense>
}