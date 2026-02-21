'use client'
import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import ModalConfirmacao from '@/components/ui/ModalConfirmacao'
import { Camera, MapPin, User, Briefcase, Globe, Save, Loader2, LogOut, Trash2, CheckCircle2 } from 'lucide-react'

export default function EditarPerfilTab() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState('')
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

  // PADRÃO GRANDE APP: Sem itálico, fonte média e leitura fluida
  const inputStyle = `w-full px-5 py-4 rounded-2xl border border-slate-100 outline-none transition-all font-medium text-slate-800 bg-white shadow-sm placeholder-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-50 disabled:bg-slate-50 disabled:text-slate-400 text-[14px] md:text-[15px]`

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
      await supabase.from('prestadores').delete().eq('user_id', userLogado.id)
      await supabase.auth.signOut()
      router.push('/')
    } catch (err) {
      setStatus('❌ Erro na exclusão')
    }
  }

  const verificarSlugBD = useCallback(async (slugTeste) => {
    if (!slugTeste || slugTeste.length < 3) return;
    setChecandoSlug(true);
    const { data } = await supabase.from('prestadores').select('id')
      .eq('slug', slugTeste)
      .neq('user_id', userLogado?.id) // Verificação baseada no user_id
      .maybeSingle();
    setSlugDisponivel(!data);
    setChecandoSlug(false);
  }, [userLogado]);

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
            id: perfil.id,
            nome: perfil.nome || '',
            whatsapp: aplicarMascaraWhatsapp(perfil.whatsapp || ''),
            habilidades: perfil.habilidades || [],
            cidades_atendidas: perfil.cidades_atendidas || [],
            bio: perfil.bio || '',
            bairro: perfil.bairro || '',
            slug: perfil.slug || formatarParaSlug(perfil.nome),
            estado_sigla: perfil.estado_sigla || 'PR'
          })
          if (perfil.slug) setEditouSlugManualmente(true)
        }
      } catch (err) {
        console.error("Erro ao inicializar:", err)
      } finally {
        setLoading(false)
      }
    }
    inicializar()
  }, []);

  const handleSalvar = async (e) => {
    e.preventDefault();
    if (!slugDisponivel) { setStatus('❌ URL indisponível'); return; }
    setStatus('Sincronizando...');

    try {
      const cidadeSedeNome = listaCidades.find(c => String(c.id) === String(formData.cidade_id))?.nome;
      const cidadesLimpo = (formData.cidades_atendidas || []).filter(c => c !== cidadeSedeNome);

      // PRECISÃO TÉCNICA: Limpamos o payload para evitar Erro 400
      const { id, ...dadosParaSalvar } = formData;
      const payload = {
        ...dadosParaSalvar,
        whatsapp: formData.whatsapp.replace(/\D/g, ''),
        cidade_id: formData.cidade_id ? parseInt(formData.cidade_id) : null,
        regiao_id: formData.regiao_id ? parseInt(formData.regiao_id) : null,
        grupo_id: formData.grupo_id ? parseInt(formData.grupo_id) : null,
        categoria_id: formData.categoria_id ? parseInt(formData.categoria_id) : null,
        cidades_atendidas: cidadesLimpo,
        user_id: userLogado.id
      };

      const { data: salvo, error } = await supabase
        .from('prestadores')
        .upsert(payload, { onConflict: 'user_id' }) // Garante que use a constraint correta
        .select()
        .single();

      if (error) throw error;

      setStatus('✅ Perfil Atualizado!');
    } catch (err) {
      setStatus(`❌ Erro no servidor`);
      console.error(err);
    }
    setTimeout(() => setStatus(''), 3000);
  };

  if (loading) return (
    <div className="h-96 flex flex-col items-center justify-center gap-4 animate-pulse">
        <div className="w-12 h-12 bg-slate-100 rounded-full" />
        <div className="w-48 h-4 bg-slate-100 rounded-full" />
    </div>
  )

  const habilidadesExtrasDisponiveis = listaCategorias
    .filter(cat => String(cat.id) !== String(formData.categoria_id))
    .map(cat => cat.nome);

  return (
    <div className="space-y-8 pb-20">
      
      {/* HEADER LIMPO */}
      <header className="bg-white p-6 md:p-8 rounded-[2.5rem] border border-slate-50 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 leading-tight">Configurar Perfil</h2>
          <p className="text-slate-500 text-[13px] font-medium mt-1">Dados visíveis para seus clientes em Londrina</p>
        </div>
        {userLogado && (
           <div className="flex items-center gap-3 bg-slate-50 px-4 py-2 rounded-2xl border border-slate-100">
              <div className="text-right hidden md:block">
                 <p className="text-[10px] uppercase font-bold text-slate-400">Logado</p>
                 <p className="text-xs font-bold text-slate-700 truncate max-w-[150px]">{userLogado.email}</p>
              </div>
              <button onClick={() => supabase.auth.signOut()} className="w-8 h-8 flex items-center justify-center bg-white border border-slate-200 text-slate-400 rounded-xl hover:text-red-500 transition-colors">
                 <LogOut size={14} />
              </button>
           </div>
        )}
      </header>

      <form onSubmit={handleSalvar} className="grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-8">
        
        {/* COLUNA FOTO */}
        <div className="col-span-1 md:col-span-4 space-y-6">
          <section className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm flex flex-col items-center gap-6 sticky top-24">
            <div className="relative w-40 h-40 md:w-48 md:h-48 rounded-[3rem] bg-slate-50 border-4 border-white flex items-center justify-center overflow-hidden group transition-all hover:border-blue-100 shadow-xl cursor-pointer">
              {formData.foto_perfil ? (
                <img src={formData.foto_perfil} className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-700" alt="Foto" />
              ) : (
                <User size={48} className="text-slate-200" />
              )}
              <input type="file" accept="image/*" onChange={fazerUploadFoto} className="absolute inset-0 opacity-0 cursor-pointer z-20" />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity z-10 flex items-center justify-center text-white backdrop-blur-sm">
                 <Camera size={24} />
              </div>
            </div>
            
            <div className="text-center space-y-2">
              <h3 className="font-bold text-slate-700">Foto de Perfil</h3>
              <p className="text-[12px] font-medium text-slate-400 leading-tight px-4">Utilize uma foto nítida para passar mais confiança.</p>
            </div>
          </section>
        </div>

        {/* COLUNA FORMULÁRIO */}
        <div className="col-span-1 md:col-span-8 space-y-6">
          
          <section className="bg-white rounded-[2.5rem] p-6 md:p-10 border border-slate-100 shadow-sm space-y-8">
            <div className="flex items-center gap-3 border-b border-slate-50 pb-4 mb-2">
                <Briefcase size={20} className="text-blue-600" />
                <h3 className="font-bold text-slate-800 text-lg">Dados Profissionais</h3>
            </div>

            <div className="space-y-6">
               <div className="space-y-2">
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 ml-2">Nome de Exibição</label>
                  <input value={formData.nome || ''} onChange={e => { const n = e.target.value; setFormData({ ...formData, nome: n, slug: editouSlugManualmente ? formData.slug : formatarParaSlug(n) }); }} placeholder="Como os clientes devem te chamar" className={inputStyle} required />
               </div>

               <div className="space-y-2">
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 ml-2">WhatsApp de Contato</label>
                  <input value={formData.whatsapp || ''} onChange={e => setFormData({ ...formData, whatsapp: aplicarMascaraWhatsapp(e.target.value) })} placeholder="(00) 0 0000-0000" className={inputStyle} required />
               </div>

               <div className="space-y-2">
                   <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 ml-2">Seu Link (URL)</label>
                   <div className="bg-slate-50 px-5 py-4 rounded-2xl border border-slate-200 flex items-center gap-2 relative">
                      <Globe size={16} className="text-slate-400 shrink-0" />
                      <span className="text-slate-400 text-[13px] md:text-[14px] font-medium hidden md:inline">procuroquemfaca.com.br/</span>
                      <input value={formData.slug || ''} onChange={(e) => { setEditouSlugManualmente(true); setFormData({ ...formData, slug: formatarParaSlug(e.target.value) }) }} className="bg-transparent border-none outline-none text-blue-600 font-bold text-[14px] flex-1 min-w-0" />
                      <div className="absolute right-4 top-1/2 -translate-y-1/2">
                        {checandoSlug ? <Loader2 size={16} className="animate-spin text-blue-500" /> : (slugDisponivel ? <CheckCircle2 size={16} className="text-green-500" /> : <span className="text-red-500 text-[10px] font-bold">EM USO</span>)}
                      </div>
                   </div>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                 <div className="space-y-2">
                    <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 ml-2">Área de Atuação</label>
                    <select value={formData.grupo_id || ''} onChange={handleGrupoChange} className={inputStyle} required>
                      <option value="">Selecione...</option>
                      {listaGrupos.map(g => <option key={g.id} value={g.id}>{g.nome}</option>)}
                    </select>
                 </div>
                 <div className="space-y-2">
                    <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 ml-2">Especialidade</label>
                    <select value={formData.categoria_id || ''} onChange={e => setFormData({ ...formData, categoria_id: e.target.value, habilidades: [] })} className={inputStyle} required>
                      <option value="">Selecione...</option>
                      {listaCategorias.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                    </select>
                 </div>
               </div>

               <div className="space-y-2">
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 ml-2">Sua Bio (Resumo)</label>
                  <textarea value={formData.bio || ''} onChange={e => setFormData({ ...formData, bio: e.target.value })} placeholder="Fale um pouco sobre seus serviços e experiência..." className={`${inputStyle} h-32 resize-none`} />
               </div>
            </div>
          </section>

          <section className="bg-white rounded-[2.5rem] p-6 md:p-10 border border-slate-100 shadow-sm space-y-8">
            <div className="flex items-center gap-3 border-b border-slate-50 pb-4 mb-2">
                <MapPin size={20} className="text-blue-600" />
                <h3 className="font-bold text-slate-800 text-lg">Atendimento</h3>
            </div>

            <div className="space-y-6">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                 <div className="space-y-2">
                    <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 ml-2">Cidade Base</label>
                    <select value={formData.cidade_id || ''} onChange={e => setFormData({ ...formData, cidade_id: e.target.value })} className={inputStyle} required>
                      <option value="">Selecione...</option>
                      {listaCidades.map(cid => <option key={cid.id} value={cid.id}>{cid.nome}</option>)}
                    </select>
                 </div>
                 <div className="space-y-2">
                    <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 ml-2">Bairro</label>
                    <input value={formData.bairro || ''} onChange={e => setFormData({ ...formData, bairro: e.target.value })} placeholder="Ex: Centro" className={inputStyle} />
                 </div>
               </div>
            </div>
          </section>

          <div className="pt-4 space-y-6">
            <button type="submit" className="w-full py-5 md:py-6 bg-blue-600 text-white rounded-[2rem] font-bold text-[15px] shadow-xl hover:bg-blue-700 active:scale-95 transition-all flex items-center justify-center gap-3">
              {status === 'Sincronizando...' ? <Loader2 className="animate-spin" /> : <Save size={20} />}
              {status || 'Salvar Alterações'}
            </button>

            <button type="button" onClick={() => setIsModalExcluirOpen(true)} className="w-full flex items-center justify-center gap-2 text-[11px] font-bold text-slate-400 uppercase tracking-widest hover:text-red-500 transition-colors py-2">
              <Trash2 size={14} /> Excluir Conta Permanentemente
            </button>
          </div>
        </div>
      </form>

      <ModalConfirmacao
        isOpen={isModalExcluirOpen}
        onClose={() => setIsModalExcluirOpen(false)}
        onConfirm={handleExcluirContaTotal}
        title="Encerrar sua conta?"
        message="Isso apagará seu perfil e suas fotos permanentemente. Não há como desfazer."
      />
    </div>
  )
}