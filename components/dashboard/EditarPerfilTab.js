'use client'
import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import ModalConfirmacao from '@/components/ui/ModalConfirmacao'

export default function EditarPerfilTab() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState('')
  const [tentouEnviar, setTentouEnviar] = useState(false)
  const [userLogado, setUserLogado] = useState(null)
  const [isModalExcluirOpen, setIsModalExcluirOpen] = useState(false)

  // Listas do banco
  const [listaGrupos, setListaGrupos] = useState([])
  const [listaCategorias, setListaCategorias] = useState([])
  const [listaEstados, setListaEstados] = useState([])
  const [listaRegioes, setListaRegioes] = useState([])
  const [listaCidades, setListaCidades] = useState([])
  const [cidadesRegiao, setCidadesRegiao] = useState([])

  // Estados para o Slug
  const [slugDisponivel, setSlugDisponivel] = useState(true)
  const [checandoSlug, setChecandoSlug] = useState(false)
  const [editouSlugManualmente, setEditouSlugManualmente] = useState(false)

  const [formData, setFormData] = useState({
    id: null,
    nome: '', whatsapp: '', bio: '', foto_perfil: '',
    grupo_id: '', categoria_id: '', estado_sigla: 'PR',
    regiao_id: '', cidade_id: '', bairro: '', slug: '',
    habilidades: [], cidades_atendidas: [],
    status: 'ativo'
  })

  // AJUSTE ESTÉTICO: font-medium e borda suave
  const inputStyle = () => `w-full px-5 py-4 rounded-2xl border border-slate-100 outline-none transition-all font-medium text-[14px] text-slate-800 bg-white shadow-sm placeholder-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-50 disabled:bg-slate-50 disabled:text-slate-400`

  const aplicarMascaraWhatsapp = (v) => {
    if (!v) return "";
    v = v.replace(/\D/g, "");
    if (v.length > 11) v = v.slice(0, 11);
    if (v.length <= 10) return v.replace(/(\d{2})(\d{4})(\d{0,4})/, "($1) $2-$3");
    return v.replace(/(\d{2})(\d{1})(\d{4})(\d{4})/, "($1) $2 $3-$4");
  };

  const formatarParaSlug = (txt) => txt ? txt.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, "").replace(/[^\w\s-]/g, '').replace(/\s+/g, '').trim() : "";

  const carregarCategorias = useCallback(async (gid) => {
    if (!gid) return setListaCategorias([]);
    const { data } = await supabase.from('categorias').select('*').eq('grupo_id', gid).order('nome')
    setListaCategorias(data || [])
  }, [])

  const carregarRegioes = useCallback(async (sigla) => {
    if (!sigla) return setListaRegioes([]);
    const { data } = await supabase.from('regioes').select('*').eq('estado_sigla', sigla).order('nome')
    setListaRegioes(data || [])
  }, [])

  const carregarCidades = useCallback(async (rid, sigla) => {
    let query = supabase.from('cidades').select('*').eq('ativa', true).order('nome')
    if (rid) query = query.eq('regiao_id', rid)
    else if (sigla) query = query.eq('estado_sigla', sigla)
    else return setListaCidades([]);

    const { data } = await query
    setListaCidades(data || [])
    setCidadesRegiao(data || [])
  }, [])

  const handleEstadoChange = async (e) => {
    const sigla = e.target.value;
    setFormData(prev => ({ ...prev, estado_sigla: sigla, regiao_id: '', cidade_id: '', bairro: '', cidades_atendidas: [] }));
    await carregarRegioes(sigla);
    await carregarCidades('', sigla);
  };

  const handleRegiaoChange = async (e) => {
    const rid = e.target.value;
    setFormData(prev => ({ ...prev, regiao_id: rid, cidade_id: '', cidades_atendidas: [] }));
    await carregarCidades(rid, formData.estado_sigla);
  };

  const handleGrupoChange = async (e) => {
    const gid = e.target.value;
    setFormData(prev => ({ ...prev, grupo_id: gid, categoria_id: '', habilidades: [] }));
    await carregarCategorias(gid);
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

  const handleExcluirContaTotal = async () => {
    setStatus('Excluindo tudo...')
    try {
      if (formData.foto_perfil) {
        const urlParts = formData.foto_perfil.split('/')
        const fileName = urlParts[urlParts.length - 1]
        await supabase.storage.from('fotos-perfil').remove([fileName])
      }
      const { error: dbError } = await supabase.from('prestadores').delete().eq('user_id', userLogado.id)
      if (dbError) throw dbError
      await supabase.auth.signOut()
      router.push('/')
      router.refresh()
    } catch (err) {
      console.error(err)
      setStatus('❌ Erro na exclusão')
    }
  }

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

  const toggleItem = (item, lista) => {
    const listaAtual = formData[lista] || [];
    const novaLista = listaAtual.includes(item)
      ? listaAtual.filter(i => i !== item)
      : [...listaAtual, item];
    setFormData(prev => ({ ...prev, [lista]: novaLista }));
  };

  useEffect(() => {
    async function inicializar() {
      try {
        setLoading(true)
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) return router.push('/login')
        setUserLogado(session.user)

        const [gruposRes, estadosRes] = await Promise.all([
          supabase.from('categorias_grupos').select('*').order('nome'),
          supabase.from('estados').select('*').order('nome')
        ])
        setListaGrupos(gruposRes.data || [])
        setListaEstados(estadosRes.data || [])

        const { data: perfil } = await supabase.from('prestadores').select('*').eq('user_id', session.user.id).maybeSingle()

        if (perfil) {
          if (perfil.grupo_id) await carregarCategorias(perfil.grupo_id);
          if (perfil.estado_sigla) await carregarRegioes(perfil.estado_sigla);
          await carregarCidades(perfil.regiao_id, perfil.estado_sigla);

          setFormData({
            ...perfil,
            nome: perfil.nome || '',
            whatsapp: perfil.whatsapp || '',
            habilidades: perfil.habilidades || [],
            cidades_atendidas: perfil.cidades_atendidas || [],
            bio: perfil.bio || '',
            bairro: perfil.bairro || '',
            slug: perfil.slug || formatarParaSlug(perfil.nome),
            estado_sigla: perfil.estado_sigla || 'PR',
            status: perfil.status || 'ativo'
          })
          if (perfil.slug) setEditouSlugManualmente(true)
        } else {
          await carregarRegioes('PR');
          await carregarCidades('', 'PR');
        }
      } catch (err) {
        console.error("Erro ao inicializar dashboard:", err)
      } finally {
        setLoading(false)
      }
    }
    inicializar()
  }, [router, carregarCategorias, carregarRegioes, carregarCidades]);

  const handleSalvar = async (e) => {
    e.preventDefault();
    if (!slugDisponivel) { setStatus('❌ URL indisponível'); return; }
    setTentouEnviar(true);
    setStatus('Sincronizando...');

    try {
      const cidadeSedeNome = listaCidades.find(c => String(c.id) === String(formData.cidade_id))?.nome;
      const cidadesLimpo = (formData.cidades_atendidas || []).filter(c => c !== cidadeSedeNome);

      const payload = {
        ...formData,
        cidade_id: formData.cidade_id || null,
        regiao_id: formData.regiao_id || null,
        grupo_id: formData.grupo_id || null,
        categoria_id: formData.categoria_id || null,
        cidades_atendidas: cidadesLimpo,
        user_id: userLogado.id,
        status: formData.status || 'ativo'
      };

      if (!payload.id) delete payload.id;

      const { data: prestadorSalvo, error } = await supabase
        .from('prestadores')
        .upsert(payload)
        .select('id')
        .single();

      if (error) throw error;

      await supabase.from('logs_atividades').insert([{
        usuario_id: userLogado.id,
        usuario_email: userLogado.email,
        acao: 'PERFIL_ATUALIZADO',
        entidade_tipo: 'configuracao',
        entidade_id: String(prestadorSalvo.id),
        detalhes: {
          plataforma: 'web',
          campos_alterados: Object.keys(payload).filter(k => payload[k] !== formData[k])
        }
      }]);

      setStatus('✅ Perfil Atualizado!');
      setTentouEnviar(false);
    } catch (err) {
      console.error("Erro detalhado do Supabase:", err);
      setStatus(`❌ Erro: ${err.message || 'Verifique os dados'}`);
    }

    setTimeout(() => setStatus(''), 3000);
  };

  if (loading) return <div className="p-20 text-center animate-pulse font-bold text-slate-300 uppercase tracking-widest">Sincronizando perfil...</div>

  const habilidadesExtrasDisponiveis = listaCategorias
    .filter(cat => String(cat.id) !== String(formData.categoria_id))
    .map(cat => cat.nome);

  return (
    <main className="min-h-screen bg-[#F8FAFC] pb-24 font-sans antialiased">
      <div className="max-w-5xl mx-auto px-4 pt-12 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <header className="border-b border-slate-100 pb-8">
          <h2 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">Configurações de Perfil</h2>
          <p className="text-slate-400 text-[11px] font-bold uppercase tracking-widest mt-2">Personalize sua vitrine profissional</p>
        </header>

        <form onSubmit={handleSalvar} className="grid grid-cols-1 md:grid-cols-12 gap-8">
          <div className="col-span-1 md:col-span-4 space-y-6">
            <section className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm flex flex-col items-center gap-6 sticky top-24">
              {/* FOTO: SEM PONTILHADO, BORDA SÓLIDA E SOMBRA */}
              <div className="relative w-40 h-40 md:w-48 md:h-48 rounded-[3.5rem] bg-slate-50 border-4 border-white flex items-center justify-center overflow-hidden group transition-all hover:scale-[1.02] shadow-xl">
                {formData.foto_perfil ? (
                  <img src={formData.foto_perfil} className="w-full h-full object-cover" alt="Foto" />
                ) : (
                  <span className="text-slate-300 font-bold text-[10px] uppercase tracking-widest">Foto</span>
                )}
                <input type="file" accept="image/*" onChange={fazerUploadFoto} className="absolute inset-0 opacity-0 cursor-pointer z-10" />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center text-white font-bold text-[10px] uppercase tracking-widest z-20">Alterar Foto</div>
              </div>
              <div className="text-center space-y-3">
                <div className="flex items-center justify-center gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">Seu perfil está ativo</span>
                </div>
                <p className="text-[11px] font-medium text-slate-400 px-4 leading-relaxed">Clique na imagem para atualizar sua foto de exibição</p>
              </div>
            </section>
          </div>

          <div className="col-span-1 md:col-span-8 space-y-6">
            {userLogado && (
              <section className="bg-white p-6 rounded-[2rem] border border-slate-100 flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm">
                <div className="text-center md:text-left">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Conta conectada</p>
                  <p className="font-bold text-slate-700 text-sm">{userLogado.email}</p>
                </div>
                <Link href="/login" className="px-5 py-2.5 bg-slate-50 text-slate-500 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-slate-100 transition-all border border-slate-100">Trocar Acesso</Link>
              </section>
            )}

            <section className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm space-y-6">
              <h3 className="font-bold uppercase text-[11px] tracking-widest text-slate-400 mb-4">Dados da Vitrine</h3>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase text-slate-400 ml-2 tracking-widest">Nome Profissional</label>
                  <input value={formData.nome || ''} onChange={e => { const n = e.target.value; setFormData({ ...formData, nome: n, slug: editouSlugManualmente ? formData.slug : formatarParaSlug(n) }); }} placeholder="Como os clientes te verão" className={inputStyle()} required />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase text-slate-400 ml-2 tracking-widest">WhatsApp Comercial</label>
                  <input value={formData.whatsapp || ''} onChange={e => setFormData({ ...formData, whatsapp: aplicarMascaraWhatsapp(e.target.value) })} placeholder="(00) 00000-0000" className={inputStyle()} required />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase text-slate-400 ml-2 tracking-widest">URL Exclusiva</label>
                  <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 relative overflow-hidden">
                    <div className="flex items-center gap-1 font-bold text-sm">
                      <span className="text-slate-400 font-medium hidden md:inline">procuroquemfaca.com.br/</span>
                      <input value={formData.slug || ''} onChange={(e) => { setEditouSlugManualmente(true); setFormData({ ...formData, slug: formatarParaSlug(e.target.value) }) }} className="bg-transparent border-none outline-none text-blue-600 flex-1 min-w-0" placeholder="seu-link" />
                      {checandoSlug ? <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" /> : ((formData.slug?.length > 2) && (slugDisponivel ? <span className="text-green-500 text-[10px] font-bold uppercase">Livre</span> : <span className="text-red-500 text-[10px] font-bold uppercase">Em uso</span>))}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <select value={formData.grupo_id || ''} onChange={handleGrupoChange} className={inputStyle()} required>
                    <option value="">Grupo de Atuação</option>
                    {listaGrupos.map(g => <option key={g.id} value={g.id}>{g.nome}</option>)}
                  </select>
                  <select value={formData.categoria_id || ''} onChange={e => setFormData({ ...formData, categoria_id: e.target.value, habilidades: [] })} className={inputStyle()} required>
                    <option value="">Categoria Principal</option>
                    {listaCategorias.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                  </select>
                </div>

                {formData.categoria_id && habilidadesExtrasDisponiveis.length > 0 && (
                  <div className="pt-2">
                    <label className="text-slate-400 font-bold text-[10px] uppercase block mb-3 tracking-widest">Especialidades Extras:</label>
                    <div className="flex flex-wrap gap-2">
                      {habilidadesExtrasDisponiveis.map(h => (
                        <button key={h} type="button" onClick={() => toggleItem(h, 'habilidades')} className={`px-4 py-2.5 rounded-xl text-[10px] font-bold uppercase border transition-all ${formData.habilidades?.includes(h) ? 'bg-blue-600 text-white border-blue-600 shadow-md scale-95' : 'bg-slate-50 text-slate-500 border-slate-100 hover:border-slate-200'}`}>
                          {h}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase text-slate-400 ml-2 tracking-widest">Sobre seus Serviços</label>
                  <textarea value={formData.bio || ''} onChange={e => setFormData({ ...formData, bio: e.target.value })} placeholder="Fale brevemente sobre sua experiência..." className={`${inputStyle()} h-32 resize-none`} />
                </div>
              </div>
            </section>

            <section className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm space-y-6">
              <h3 className="font-bold uppercase text-[11px] tracking-widest text-slate-400 mb-4">Localização e Atendimento</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <select value={formData.estado_sigla || ''} onChange={handleEstadoChange} className={inputStyle()}>
                  {listaEstados.map(est => <option key={est.sigla} value={est.sigla}>{est.nome}</option>)}
                </select>
                <select value={formData.regiao_id || ''} onChange={handleRegiaoChange} className={inputStyle()} disabled={!formData.estado_sigla}>
                  <option value="">Região de Atendimento</option>
                  {listaRegioes.map(reg => <option key={reg.id} value={reg.id}>{reg.nome}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <select value={formData.cidade_id || ''} onChange={e => setFormData({ ...formData, cidade_id: e.target.value })} className={inputStyle()} required disabled={!formData.estado_sigla}>
                  <option value="">Cidade Base</option>
                  {listaCidades.map(cid => <option key={cid.id} value={cid.id}>{cid.nome}</option>)}
                </select>
                <input value={formData.bairro || ''} onChange={e => setFormData({ ...formData, bairro: e.target.value })} placeholder="Bairro principal" className={inputStyle()} />
              </div>

              {formData.regiao_id && cidadesRegiao.length > 1 && formData.cidade_id && (
                <div className="pt-6 border-t border-slate-50">
                  <label className="text-slate-400 font-bold text-[10px] uppercase block mb-4 tracking-widest">Cidades que você também atende:</label>
                  <div className="flex flex-wrap gap-2">
                    {cidadesRegiao.filter(c => String(c.id) !== String(formData.cidade_id)).map(cid => (
                      <button key={cid.id} type="button" onClick={() => toggleItem(cid.nome, 'cidades_atendidas')} className={`px-4 py-2.5 rounded-xl text-[10px] font-bold uppercase border transition-all ${formData.cidades_atendidas?.includes(cid.nome) ? 'bg-blue-600 text-white border-blue-600 shadow-md scale-95' : 'bg-slate-50 text-slate-500 border-slate-100 hover:border-slate-300'}`}>
                        {cid.nome}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </section>

            <div className="space-y-6 pt-4">
              <button type="submit" className="w-full py-6 bg-blue-600 text-white rounded-[2rem] font-bold uppercase tracking-[0.2em] text-[13px] shadow-2xl hover:bg-blue-700 active:scale-95 transition-all">
                {status || 'Atualizar Meu Perfil'}
              </button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => setIsModalExcluirOpen(true)}
                  className="text-[10px] font-bold text-slate-300 uppercase tracking-widest hover:text-red-400 transition-colors py-4"
                >
                  Excluir meu perfil permanentemente
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>

      <ModalConfirmacao
        isOpen={isModalExcluirOpen}
        onClose={() => setIsModalExcluirOpen(false)}
        onConfirm={handleExcluirContaTotal}
        title="Deseja excluir seu perfil?"
        message="Atenção: Seu perfil profissional, fotos e histórico serão apagados para sempre. Esta ação não tem volta."
      />
    </main>
  )
}