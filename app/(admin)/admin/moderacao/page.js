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
      <div className="w-full max-w-xl">
        <div className="mb-10 pl-2">
          <div className="h-10 bg-slate-200 rounded-2xl w-48 mb-3" />
          <div className="h-4 bg-slate-100 rounded-lg w-64" />
        </div>
        <div className="bg-white rounded-[3rem] h-96 border border-slate-100 shadow-sm" />
      </div>
    </div>
  )
}

export function FormularioCadastro() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const reivindicarId = searchParams.get('reivindicar')

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

  // Definição de estilos movida para cima para evitar ReferenceError
  const inputStyle = () => `w-full p-4 rounded-2xl border border-slate-100 outline-none transition-all font-bold text-slate-800 bg-white shadow-sm placeholder-slate-400 focus:border-blue-500`

  useEffect(() => { setMounted(true) }, [])

  const registrarLog = async (acao, detalhes = {}) => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      await supabase.from('logs_atividades').insert({
        acao,
        usuario_id: session?.user?.id || null,
        usuario_email: email || session?.user?.email,
        entidade_tipo: 'prestador',
        entidade_id: reivindicarId || formData?.id || null,
        detalhes: { ...detalhes, url: typeof window !== 'undefined' ? window.location.href : '', timestamp: new Date().toISOString() }
      })
    } catch (err) { console.error('Falha crítica:', err) }
  }

  const aplicarMascaraWhatsapp = (v) => {
    v = v.replace(/\D/g, "");
    if (v.length > 11) v = v.slice(0, 11);
    if (v.length <= 10) return v.replace(/(\d{2})(\d{4})(\d{0,4})/, "($1) $2-$3");
    return v.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
  };

  const calcularProgresso = () => {
    const campos = [
      formData.nome?.trim().length > 3,
      formData.whatsapp?.replace(/\D/g, "").length >= 10,
      formData.grupo_id,
      formData.categoria_id,
      formData.cidade_id,
      formData.foto_perfil?.length > 10,
      aceitouTermos,
      aceitouPrivacidade,
      slugDisponivel,
      (userLogado ? true : (email.includes('@') && senha.length >= 6))
    ]
    return Math.round((campos.filter(Boolean).length / campos.length) * 100)
  }

  const formatarParaSlug = (txt) => txt ? txt.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, "").replace(/[^\w\s-]/g, '').replace(/\s+/g, '').trim() : "";

  const verificarSlugBD = useCallback(async (slugTeste) => {
    if (!slugTeste || slugTeste.length < 3) return;
    setChecandoSlug(true);
    const { data } = await supabase.from('prestadores').select('id').eq('slug', slugTeste).neq('id', formData.id || -1).maybeSingle();
    setSlugDisponivel(!data);
    setChecandoSlug(false);
  }, [formData.id]);

  useEffect(() => {
    if (formData.slug) {
      const timer = setTimeout(() => verificarSlugBD(formData.slug), 500);
      return () => clearTimeout(timer);
    }
  }, [formData.slug, verificarSlugBD]);

  const carregarGrupos = async () => {
    const { data } = await supabase.from('categorias_grupos').select('*').order('nome')
    if (data) setListaGrupos(data)
  }

  const carregarCategorias = async (grupoId) => {
    if (!grupoId) return
    const { data } = await supabase.from('categorias').select('*').eq('grupo_id', grupoId).order('nome')
    setListaCategorias(data || [])
  }

  const carregarEstados = async () => {
    const { data } = await supabase.from('estados').select('*').order('nome')
    if (data) setListaEstados(data)
  }

  const carregarRegioes = useCallback(async (sigla) => {
    if (!sigla) { setListaRegioes([]); return; }
    const { data } = await supabase.from('regioes').select('*').eq('estado_sigla', sigla).order('nome')
    setListaRegioes(data || [])
  }, []);

  const carregarCidades = useCallback(async (regiaoId, estadoSigla) => {
    let query = supabase.from('cidades').select('*').eq('ativa', true).order('nome')
    if (regiaoId) query = query.eq('regiao_id', regiaoId)
    else if (estadoSigla) query = query.eq('estado_sigla', estadoSigla)
    else { setListaCidades([]); return; }
    const { data } = await query
    setListaCidades(data || [])
    if (regiaoId) setCidadesRegiao(data || [])
    else setCidadesRegiao([])
  }, []);

  const carregarDependencias = useCallback(async (perfil) => {
    if (perfil.estado_sigla) await carregarRegioes(perfil.estado_sigla)
    if (perfil.grupo_id) await carregarCategorias(perfil.grupo_id)
    await carregarCidades(perfil.regiao_id, perfil.estado_sigla)
  }, [carregarRegioes, carregarCidades]);

  useEffect(() => {
    if (mounted && formData.estado_sigla) {
      carregarRegioes(formData.estado_sigla);
      if (!formData.cidade_id) carregarCidades(formData.regiao_id, formData.estado_sigla);
    }
  }, [mounted, formData.estado_sigla, carregarRegioes, carregarCidades, formData.regiao_id, formData.cidade_id]);

  const toggleItem = (item, lista) => {
    const novaLista = formData[lista]?.includes(item)
      ? formData[lista].filter(i => i !== item)
      : [...(formData[lista] || []), item];
    setFormData({ ...formData, [lista]: novaLista });
  };

  useEffect(() => {
    const inicializar = async () => {
      try {
        await Promise.all([carregarEstados(), carregarGrupos()])
        const { data: { session } } = await supabase.auth.getSession()
        if (session) {
          setUserLogado(session.user); setEmail(session.user.email)
          const { data: perfil } = await supabase.from('prestadores').select('*').eq('user_id', session.user.id).maybeSingle()
          if (perfil) {
            if (perfil.nome && perfil.categoria_id && !reivindicarId && !modoEdicao && typeof window !== 'undefined' && window.location.pathname === '/cadastro') {
              setIsRedirecting(true); router.replace('/dashboard'); return
            }
            await carregarDependencias(perfil)
            setFormData({ ...perfil, cidades_atendidas: perfil.cidades_atendidas || [], habilidades: perfil.habilidades || [], bio: perfil.bio || '', foto_perfil: perfil.foto_perfil || '', bairro: perfil.bairro || '' })
            setModoEdicao(true)
            if (perfil.slug) setEditouSlugManualmente(true)
          }
        }
        if (reivindicarId) {
          const { data: perfilReivindicar } = await supabase.from('prestadores').select('*').eq('id', reivindicarId).single()
          if (perfilReivindicar) {
            await carregarDependencias(perfilReivindicar)
            setFormData({ ...perfilReivindicar, cidades_atendidas: perfilReivindicar.cidades_atendidas || [], habilidades: perfilReivindicar.habilidades || [], bio: perfilReivindicar.bio || '', foto_perfil: perfilReivindicar.foto_perfil || '', bairro: perfilReivindicar.bairro || '', slug: perfilReivindicar.slug || formatarParaSlug(perfilReivindicar.nome) })
            setAceitouTermos(true); setAceitouPrivacidade(true);
          }
        }
      } catch (error) { console.error('Erro inicialização:', error) } finally { setLoading(false) }
    }
    inicializar()
  }, [reivindicarId, router, carregarDependencias]);

  const fazerUploadFoto = async (e) => {
    const arquivo = e.target.files[0]
    if (!arquivo) return
    setStatus('Subindo foto...')
    try {
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}`
      await supabase.storage.from('fotos-perfil').upload(fileName, arquivo)
      const { data: { publicUrl } } = supabase.storage.from('fotos-perfil').getPublicUrl(fileName)
      setFormData(prev => ({ ...prev, foto_perfil: publicUrl }))
      setStatus('Foto ok!')
    } catch (err) { setStatus('Erro upload') } finally { setTimeout(() => setStatus(''), 2000) }
  }

  const handleExcluirPerfil = async () => {
    setStatus('Excluindo...')
    try {
      const targetId = reivindicarId || formData.id;
      await supabase.from('prestadores').delete().eq('id', targetId)
      router.push('/')
    } catch (err) { setStatus('Erro excluir') }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setTentouEnviar(true);
    if (!formData.foto_perfil) { setStatus('❌ Foto obrigatória.'); return; }
    if (!slugDisponivel) { setStatus('❌ URL indisponível.'); return; }
    if (loading || calcularProgresso() < 100) return;

    setLoading(true); setStatus('Sincronizando...');
    try {
      let userId = userLogado?.id;
      if (!userId) {
        const { data: auth, error: authErr } = await supabase.auth.signUp({ email, password: senha, options: { data: { nome: formData.nome } } });
        if (authErr) throw authErr;
        userId = auth.user?.id;
      }

      // --- LIMPEZA CIRÚRGICA DE DUPLICADOS ---
      const cidadeSedeNome = listaCidades.find(c => String(c.id) === String(formData.cidade_id))?.nome;
      const cidadesAtendidasLimpo = [...new Set(formData.cidades_atendidas || [])]
        .filter(nome => nome !== cidadeSedeNome && nome !== "");

      await supabase.from('prestadores').update({ user_id: null }).eq('user_id', userId);

      const payload = {
        ...formData,
        cidades_atendidas: cidadesAtendidasLimpo,
        id: reivindicarId ? parseInt(reivindicarId) : formData.id,
        user_id: userId,
        status: 'ativo',
        origem_tipo: reivindicarId ? 'reivindicado' : 'registro_direto'
      };

      const { error: dbError } = await supabase.from('prestadores').upsert(payload);
      if (dbError) throw dbError;
      await registrarLog('PERFIL_SALVO_SUCESSO', { prestador_id: payload.id });
      window.location.href = '/dashboard';
    } catch (err) { setStatus(`❌ Erro ao salvar.`); setLoading(false); }
  }

  const grupoAtual = listaGrupos.find(g => String(g.id) === String(formData.grupo_id));
  const habilidadesExtrasDisponiveis = listaCategorias
    .filter(cat => String(cat.id) !== String(formData.categoria_id))
    .map(cat => cat.nome);

  if (!mounted || loading || isRedirecting) return <CadastroSkeleton />

  return (
    <main className="min-h-screen bg-[#F8FAFC] pb-20 font-sans antialiased">
      <Header href="/" />
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100 h-16 md:h-20 flex items-center px-6">
        <div className="max-w-4xl mx-auto w-full flex justify-between items-center">
          <BackButton href="/" />
          <Link href="/"><img src="/logo.png" alt="Logo" className="h-12 w-auto" /></Link>
          <div className="w-10"></div>
        </div>
        <div className="absolute bottom-0 left-0 w-full h-1 bg-slate-50">
          <div className="h-full bg-blue-600 transition-all duration-700" style={{ width: `${calcularProgresso()}%` }} />
        </div>
      </nav>

      <div className="w-full px-4 pt-32 md:pt-40">
        <CadastroCard title={reivindicarId ? 'Assumir Perfil' : modoEdicao ? 'Meu Perfil' : 'Cadastro'} progresso={calcularProgresso()} isReivindicando={!!reivindicarId || modoEdicao} onExcluir={() => setIsModalOpen(true)}>
          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            {!userLogado && (
              <section className="bg-slate-50/50 p-8 rounded-[2.5rem] border border-blue-50 space-y-4">
                <h2 className="font-bold uppercase text-[10px] tracking-widest text-slate-400 italic">Segurança</h2>
                <input type="email" placeholder="E-mail" value={email} onChange={e => setEmail(e.target.value)} className={inputClass(false)} required />
                <input type="password" placeholder="Senha (mín. 6)" value={senha} onChange={e => setSenha(e.target.value)} className={`${inputStyle()} ${tentouEnviar && senha.length < 6 ? 'border-red-500' : ''}`} required />
              </section>
            )}

            <section className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm flex flex-col items-center gap-6">
              <div className={`relative w-32 h-32 rounded-[2.5rem] bg-slate-50 border-2 border-dashed flex items-center justify-center overflow-hidden transition-colors ${tentouEnviar && !formData.foto_perfil ? 'border-red-500 bg-red-50' : 'hover:border-blue-400'}`}>
                {formData.foto_perfil ? <img src={formData.foto_perfil} alt="Preview" className="w-full h-full object-cover" /> : <span className="text-slate-300 font-black text-[10px]">FOTO OBRIGATÓRIA</span>}
                <input type="file" accept="image/*" onChange={fazerUploadFoto} className="absolute inset-0 opacity-0 cursor-pointer" />
              </div>
              
              <div className="w-full space-y-4">
                <select value={formData.grupo_id || ''} onChange={e => { const val = e.target.value; setFormData({ ...formData, grupo_id: val, categoria_id: '', habilidades: [] }); carregarCategorias(val); }} className={inputStyle()} required>
                  <option value="">Grupo de Atuação</option>
                  {listaGrupos.map(g => <option key={g.id} value={g.id}>{g.nome}</option>)}
                </select>

                <select value={formData.categoria_id || ''} onChange={e => setFormData({ ...formData, categoria_id: e.target.value, habilidades: [] })} className={inputStyle()} required>
                  <option value="">Profissão Principal</option>
                  {listaCategorias.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                </select>

                {formData.categoria_id && habilidadesExtrasDisponiveis.length > 0 && (
                  <div className="pt-2">
                    <label className="text-slate-400 font-black text-[9px] uppercase block italic mb-3 tracking-tighter">Habilidades extras:</label>
                    <div className="flex flex-wrap gap-2">
                      {habilidadesExtrasDisponiveis.map(h => (
                        <button key={h} type="button" onClick={() => toggleItem(h, 'habilidades')} className={`px-3 py-1.5 rounded-xl text-[8px] font-black uppercase transition-all border ${formData.habilidades?.includes(h) ? 'bg-blue-600 text-white border-blue-600' : 'bg-slate-50 text-slate-400 border-slate-100'}`}>
                          {h}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </section>

            <section className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm space-y-5">
              <input value={formData.nome || ''} placeholder="Nome Completo" onChange={e => { const novoNome = e.target.value; setFormData(prev => ({ ...prev, nome: novoNome, slug: editouSlugManualmente ? prev.slug : formatarParaSlug(novoNome) })); }} className={inputStyle()} required />
              <div className="bg-blue-50/50 p-6 rounded-[2rem] border border-blue-100">
                  <label className="text-blue-400 font-black text-[9px] uppercase tracking-widest italic mb-3 block">URL do Perfil</label>
                  <div className="flex items-center bg-white rounded-xl border border-slate-100 px-4 py-3">
                    <span className="text-slate-300 font-bold text-xs shrink-0">procuro.com.br/</span>
                    <input value={formData.slug} onChange={(e) => { setEditouSlugManualmente(true); setFormData({...formData, slug: formatarParaSlug(e.target.value)}); }} placeholder="seunome" className="flex-1 bg-transparent outline-none font-black text-xs text-blue-600 ml-0.5" />
                    {checandoSlug ? <div className="w-3 h-3 border-2 border-blue-600 border-t-transparent rounded-full animate-spin ml-2" /> : slugDisponivel && formData.slug.length > 2 ? <span className="text-green-500 text-[10px] ml-2">✅</span> : formData.slug.length > 2 ? <span className="text-red-500 text-[10px] ml-2">❌</span> : null}
                  </div>
              </div>
              <input value={formData.whatsapp || ''} placeholder="WhatsApp" onChange={e => setFormData({ ...formData, whatsapp: aplicarMascaraWhatsapp(e.target.value) })} className={inputStyle()} required />
              <textarea value={formData.bio || ''} placeholder="Bio..." onChange={e => setFormData({ ...formData, bio: e.target.value })} className="w-full p-4 rounded-2xl border border-slate-100 h-32 resize-none font-bold text-slate-800" />
            </section>

            <section className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <select value={formData.estado_sigla || ''} onChange={e => { const sigla = e.target.value; setFormData({ ...formData, estado_sigla: sigla, regiao_id: '', cidade_id: '', bairro: '', cidades_atendidas: [] }); carregarRegioes(sigla); carregarCidades('', sigla); }} className={inputStyle()} required>
                  {listaEstados.map(est => <option key={est.sigla} value={est.sigla}>{est.nome}</option>)}
                </select>
                <select value={formData.regiao_id || ''} onChange={e => { const regId = e.target.value; setFormData({ ...formData, regiao_id: regId, cidade_id: '', bairro: '', cidades_atendidas: [] }); carregarCidades(regId, formData.estado_sigla); }} className={inputStyle()}>
                  <option value="">Região (Opcional)</option>
                  {listaRegioes.map(reg => <option key={reg.id} value={reg.id}>{reg.nome}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
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
                >
                  <option value="">Cidade Sede</option>
                  {listaCidades.map(cid => <option key={cid.id} value={cid.id}>{cid.nome}</option>)}
                </select>
                <input value={formData.bairro || ''} placeholder="Bairro" onChange={e => setFormData({ ...formData, bairro: e.target.value })} className={inputStyle()} />
              </div>
              {formData.regiao_id && cidadesRegiao.length > 1 && formData.cidade_id && (
                <div className="mt-4 pt-6 border-t border-slate-50">
                  <label className="text-slate-400 font-black text-[9px] uppercase block italic mb-4">Atendimento Extra:</label>
                  <div className="flex flex-wrap gap-2">
                    {cidadesRegiao.filter(cid => String(cid.id) !== String(formData.cidade_id)).map(cid => (
                      <button key={cid.id} type="button" onClick={() => toggleItem(cid.nome, 'cidades_atendidas')} className={`px-4 py-2.5 rounded-xl text-[9px] font-black uppercase transition-all border ${formData.cidades_atendidas?.includes(cid.nome) ? 'bg-blue-600 text-white border-blue-600' : 'bg-slate-50 text-slate-400 border-slate-100'}`}>{cid.nome}</button>
                    ))}
                  </div>
                </div>
              )}
            </section>

            <section className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm space-y-4">
              <label className="flex items-center gap-4 cursor-pointer">
                <input type="checkbox" checked={aceitouTermos} onChange={(e) => setAceitouTermos(e.target.checked)} className="w-5 h-5 rounded border-slate-200 text-blue-600" />
                <span className="text-[10px] font-black text-slate-500 uppercase italic">Aceito os termos</span>
              </label>
              <label className="flex items-center gap-4 cursor-pointer">
                <input type="checkbox" checked={aceitouPrivacidade} onChange={(e) => setAceitouPrivacidade(e.target.checked)} className="w-5 h-5 rounded border-slate-200 text-blue-600" />
                <span className="text-[10px] font-black text-slate-500 uppercase italic">Política de Privacidade</span>
              </label>
            </section>

            <button type="submit" className={`w-full py-6 rounded-[2.5rem] font-black text-xs uppercase tracking-[0.3em] transition-all shadow-xl ${calcularProgresso() === 100 ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-100 active:scale-95' : 'bg-slate-200 text-slate-300 cursor-not-allowed'}`}>
              {status || (modoEdicao ? 'Salvar Alterações' : (reivindicarId ? 'Assumir Perfil' : 'Finalizar Cadastro'))}
            </button>
          </form>
        </CadastroCard>
      </div>
      <ModalConfirmacao isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onConfirm={handleExcluirPerfil} title="Excluir Perfil?" message="Apagar permanentemente?" />
    </main>
  )
}

function inputClass(error) {
  return `w-full p-4 rounded-2xl border ${error ? 'border-red-500' : 'border-slate-100'} outline-none transition-all font-bold text-slate-800 bg-white shadow-sm placeholder-slate-400 focus:border-blue-500`
}

export default function CadastroPage() {
  return (
    <Suspense fallback={<CadastroSkeleton />}>
      <FormularioCadastro />
    </Suspense>
  )
}