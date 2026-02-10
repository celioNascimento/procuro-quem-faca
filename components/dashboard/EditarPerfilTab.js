'use client'
import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function EditarPerfilTab() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState('')
  const [tentouEnviar, setTentouEnviar] = useState(false)
  const [userLogado, setUserLogado] = useState(null)

  // Listas do banco
  const [listaGrupos, setListaGrupos] = useState([])
  const [listaCategorias, setListaCategorias] = useState([])
  const [listaEstados, setListaEstados] = useState([])
  const [listaRegioes, setListaRegioes] = useState([])
  const [listaCidades, setListaCidades] = useState([])
  const [cidadesRegiao, setCidadesRegiao] = useState([])

  // Estados para o Slug (URL personalizada)
  const [slugDisponivel, setSlugDisponivel] = useState(true)
  const [checandoSlug, setChecandoSlug] = useState(false)
  const [editouSlugManualmente, setEditouSlugManualmente] = useState(false)

  const [formData, setFormData] = useState({
    id: null,
    nome: '', whatsapp: '', bio: '', foto_perfil: '',
    grupo_id: '', categoria_id: '', estado_sigla: 'PR',
    regiao_id: '', cidade_id: '', bairro: '', slug: '',
    habilidades: [], cidades_atendidas: []
  })

  const inputStyle = () => `w-full px-4 py-3.5 rounded-xl border border-slate-100 outline-none transition-all font-bold text-slate-800 bg-white shadow-sm placeholder-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-50 disabled:bg-slate-50`

  const formatarParaSlug = (txt) => txt ? txt.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, "").replace(/[^\w\s-]/g, '').replace(/\s+/g, '').trim() : "";

  // --- LÓGICA DE UPLOAD DE FOTO ---
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

  // --- LÓGICA DE VERIFICAÇÃO DE SLUG ---
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
          if (perfil.grupo_id) await carregarCategorias(perfil.grupo_id)
          if (perfil.estado_sigla) await carregarRegioes(perfil.estado_sigla)
          await carregarCidades(perfil.regiao_id, perfil.estado_sigla)

          setFormData({
            ...perfil,
            habilidades: perfil.habilidades || [],
            cidades_atendidas: perfil.cidades_atendidas || [],
            bio: perfil.bio || '',
            bairro: perfil.bairro || '',
            slug: perfil.slug || formatarParaSlug(perfil.nome)
          })
          if (perfil.slug) setEditouSlugManualmente(true)
        }
      } catch (err) {
        console.error("Erro ao inicializar dashboard:", err)
      } finally {
        setLoading(false)
      }
    }
    inicializar()
  }, [router, carregarCategorias, carregarRegioes, carregarCidades])

  const handleSalvar = async (e) => {
    e.preventDefault()
    if (!slugDisponivel) { setStatus('❌ URL indisponível'); return; }
    
    setTentouEnviar(true)
    setStatus('Sincronizando...')
    
    const cidadeSedeNome = listaCidades.find(c => String(c.id) === String(formData.cidade_id))?.nome;
    const cidadesLimpo = (formData.cidades_atendidas || []).filter(c => c !== cidadeSedeNome);

    const { error } = await supabase.from('prestadores').upsert({ 
      ...formData, 
      cidades_atendidas: cidadesLimpo,
      user_id: userLogado.id 
    })
    
    if (error) setStatus('❌ Erro ao salvar')
    else {
      setStatus('✅ Perfil Atualizado!')
      setTentouEnviar(false)
    }
    setTimeout(() => setStatus(''), 3000)
  }

  if (loading) return <div className="p-20 text-center animate-pulse font-black text-slate-300">SINCRONIZANDO...</div>

  const habilidadesExtrasDisponiveis = listaCategorias
    .filter(cat => String(cat.id) !== String(formData.categoria_id))
    .map(cat => cat.nome);

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-24">
      <header className="border-b border-slate-100 pb-8 flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-black text-slate-900 uppercase italic tracking-tighter">Meu Perfil Profissional</h2>
          <p className="text-slate-400 text-xs font-black uppercase tracking-[0.2em] mt-2">Painel de Controle — procuroquemfaca.com.br</p>
        </div>
      </header>

      <form onSubmit={handleSalvar} className="grid grid-cols-12 gap-8">
        {/* COLUNA ESQUERDA: FOTO (COM UPLOAD) */}
        <div className="col-span-12 md:col-span-4 space-y-6">
          <section className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm flex flex-col items-center gap-6 sticky top-24">
            <div className={`relative w-40 h-40 rounded-[3.5rem] bg-slate-50 border-2 border-dashed flex items-center justify-center overflow-hidden group transition-all hover:border-blue-400 hover:bg-blue-50`}>
              {formData.foto_perfil ? (
                <img src={formData.foto_perfil} className="w-full h-full object-cover transition-transform group-hover:scale-105" alt="Foto" />
              ) : (
                <span className="text-slate-300 font-black text-xs italic uppercase">Foto Profissional</span>
              )}
              <input type="file" accept="image/*" onChange={fazerUploadFoto} className="absolute inset-0 opacity-0 cursor-pointer z-10" />
              <div className="absolute bottom-2 bg-black/50 text-white text-[8px] px-3 py-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-20">Alterar</div>
            </div>
            <div className="text-center space-y-2">
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic text-center">Clique na imagem para atualizar</p>
               <div className="flex items-center justify-center gap-2">
                 <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                 <span className="text-[9px] font-black text-slate-600 uppercase tracking-tighter">Perfil Online</span>
               </div>
            </div>
          </section>
        </div>

        {/* COLUNA DIREITA: DADOS */}
        <div className="col-span-12 md:col-span-8 space-y-6">
          
          {userLogado && (
            <section className="bg-blue-50 p-6 rounded-[2rem] border border-blue-100 flex flex-col md:flex-row items-center justify-between gap-4">
               <div className="text-center md:text-left">
                  <p className="text-[10px] font-black uppercase tracking-widest text-blue-400 italic">Sessão Ativa:</p>
                  <p className="font-bold text-blue-900 text-sm">{userLogado.email}</p>
               </div>
               <Link href="/login" className="px-6 py-3 bg-white text-blue-600 rounded-xl text-xs font-black uppercase tracking-wider shadow-sm hover:shadow-md transition-all border border-blue-100">Trocar Conta</Link>
            </section>
          )}

          <section className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm space-y-4">
            <h3 className="font-black uppercase text-[10px] tracking-widest text-slate-400 italic mb-4">Dados da Vitrine</h3>
            
            <input 
              value={formData.nome || ''} 
              onChange={e => {
                const n = e.target.value;
                setFormData({...formData, nome: n, slug: editouSlugManualmente ? formData.slug : formatarParaSlug(n)});
              }} 
              placeholder="Nome Profissional" 
              className={inputStyle()} 
              required 
            />

            <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 relative overflow-hidden">
              <label className="text-slate-400 font-black text-[9px] uppercase tracking-widest italic mb-2 block">Link exclusivo no procuroquemfaca.com.br/</label>
              <div className="flex items-center gap-1 font-bold text-sm">
                <input 
                  value={formData.slug || ''} 
                  onChange={(e) => { setEditouSlugManualmente(true); setFormData({...formData, slug: formatarParaSlug(e.target.value)}) }} 
                  className="bg-transparent border-none outline-none text-blue-600 flex-1 min-w-0"
                  placeholder="seu-link"
                />
                {checandoSlug ? <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" /> : (
                  (formData.slug?.length > 2) && (slugDisponivel ? <span className="text-green-500 text-xs font-black uppercase">✅ Livre</span> : <span className="text-red-500 text-xs font-black uppercase">❌ Em uso</span>)
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <select value={formData.grupo_id || ''} onChange={e => { carregarCategorias(e.target.value); setFormData({...formData, grupo_id: e.target.value, categoria_id: '', habilidades: []})}} className={inputStyle()}>
                <option value="">Grupo</option>
                {listaGrupos.map(g => <option key={g.id} value={g.id}>{g.nome}</option>)}
              </select>
              <select value={formData.categoria_id || ''} onChange={e => setFormData({...formData, categoria_id: e.target.value, habilidades: []})} className={inputStyle()}>
                <option value="">Profissão Principal</option>
                {listaCategorias.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
              </select>
            </div>

            {formData.categoria_id && habilidadesExtrasDisponiveis.length > 0 && (
              <div className="pt-2">
                <label className="text-slate-400 font-black text-[9px] uppercase block italic mb-3">Habilidades complementares:</label>
                <div className="flex flex-wrap gap-2">
                  {habilidadesExtrasDisponiveis.map(h => (
                    <button key={h} type="button" onClick={() => toggleItem(h, 'habilidades')} className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase border transition-all ${formData.habilidades?.includes(h) ? 'bg-blue-600 text-white border-blue-600 shadow-lg scale-95' : 'bg-slate-50 text-slate-400 border-slate-100'}`}>
                      {h}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <textarea value={formData.bio || ''} onChange={e => setFormData({...formData, bio: e.target.value})} placeholder="Conte sobre sua experiência..." className={`${inputStyle()} h-32 resize-none`} />
          </section>

          <section className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm space-y-6">
            <h3 className="font-black uppercase text-[10px] tracking-widest text-slate-400 italic">Área de Atendimento</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <select value={formData.estado_sigla || ''} onChange={e => { carregarRegioes(e.target.value); carregarCidades('', e.target.value); setFormData({...formData, estado_sigla: e.target.value, regiao_id: '', cidade_id: '', cidades_atendidas: []})}} className={inputStyle()}>
                {listaEstados.map(est => <option key={est.sigla} value={est.sigla}>{est.nome}</option>)}
              </select>
              <select value={formData.regiao_id || ''} onChange={e => { carregarCidades(e.target.value, formData.estado_sigla); setFormData({...formData, regiao_id: e.target.value, cidade_id: '', cidades_atendidas: []})}} className={inputStyle()}>
                <option value="">Região (Opcional)</option>
                {listaRegioes.map(reg => <option key={reg.id} value={reg.id}>{reg.nome}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <select value={formData.cidade_id || ''} onChange={e => setFormData({...formData, cidade_id: e.target.value})} className={inputStyle()}>
                <option value="">Cidade</option>
                {listaCidades.map(cid => <option key={cid.id} value={cid.id}>{cid.nome}</option>)}
              </select>
              <input value={formData.bairro || ''} onChange={e => setFormData({...formData, bairro: e.target.value})} placeholder="Bairro Principal" className={inputStyle()} />
            </div>

            {formData.regiao_id && cidadesRegiao.length > 1 && formData.cidade_id && (
              <div className="pt-6 border-t border-slate-50">
                <label className="text-slate-400 font-black text-[9px] uppercase block italic mb-4">Também atendo em:</label>
                <div className="flex flex-wrap gap-2">
                  {cidadesRegiao.filter(c => String(c.id) !== String(formData.cidade_id)).map(cid => (
                    <button key={cid.id} type="button" onClick={() => toggleItem(cid.nome, 'cidades_atendidas')} className={`px-4 py-3 rounded-2xl text-[10px] font-black uppercase border transition-all ${formData.cidades_atendidas?.includes(cid.nome) ? 'bg-blue-600 text-white border-blue-600 shadow-lg scale-95' : 'bg-slate-50 text-slate-400 border-slate-100'}`}>
                      {cid.nome}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </section>

          <button type="submit" className="w-full py-6 bg-blue-600 text-white rounded-[2.5rem] font-black uppercase tracking-[0.3em] text-[11px] shadow-2xl hover:bg-blue-700 active:scale-95 transition-all">
            {status || 'Salvar Perfil Profissional'}
          </button>
        </div>
      </form>
    </div>
  )
}