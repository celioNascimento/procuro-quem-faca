'use client'
import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { Camera, User, Briefcase, MapPin, Save, Loader2, Phone } from 'lucide-react'

export default function PerfilDashboard() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState('')
  
  const [grupos, setGrupos] = useState([])
  const [categorias, setCategorias] = useState([])
  const [estados, setEstados] = useState([])
  const [regioes, setRegioes] = useState([])
  const [cidades, setCidades] = useState([])

  const [formData, setFormData] = useState({
    nome: '', whatsapp: '', bio: '', foto_perfil: '',
    grupo_id: '', categoria_id: '', estado_sigla: 'PR',
    regiao_id: '', cidade_id: '', bairro: '', tags: [], habilidades: []
  })

  const carregarCategorias = useCallback(async (grupoId) => {
    if (!grupoId) { setCategorias([]); return; }
    const { data } = await supabase.from('categorias').select('*').eq('grupo_id', grupoId).order('nome')
    setCategorias(data || [])
  }, [])

  const carregarRegioes = useCallback(async (sigla) => {
    if (!sigla) { setRegioes([]); return; }
    const { data } = await supabase.from('regioes').select('*').eq('estado_sigla', sigla).order('nome')
    setRegioes(data || [])
  }, [])

  const carregarCidades = useCallback(async (regiaoId, estadoSigla) => {
    let query = supabase.from('cidades').select('*').eq('ativa', true).order('nome')
    if (regiaoId) query = query.eq('regiao_id', regiaoId)
    else if (estadoSigla) query = query.eq('estado_sigla', estadoSigla)
    else { setCidades([]); return; }
    const { data } = await query
    setCidades(data || [])
  }, [])

  useEffect(() => {
    const carregarTudo = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) { router.push('/login'); return; }

        const { data: perfil } = await supabase
          .from('prestadores')
          .select('*')
          .eq('user_id', session.user.id)
          .maybeSingle()

        const [resGrupos, resEstados] = await Promise.all([
          supabase.from('categorias_grupos').select('*').order('nome'),
          supabase.from('estados').select('*').order('nome')
        ])

        setGrupos(resGrupos.data || [])
        setEstados(resEstados.data || [])

        if (perfil) {
          setFormData(perfil)
          if (perfil.grupo_id) await carregarCategorias(perfil.grupo_id)
          if (perfil.estado_sigla) await carregarRegioes(perfil.estado_sigla)
          await carregarCidades(perfil.regiao_id, perfil.estado_sigla)
        } else {
          carregarRegioes('PR')
          carregarCidades(null, 'PR')
        }
      } catch (err) {
        console.error("Erro ao carregar:", err)
      } finally {
        setLoading(false)
      }
    }
    carregarTudo()
  }, [router, carregarCategorias, carregarRegioes, carregarCidades])

  const handleSalvar = async (e) => {
    e.preventDefault()
    setStatus('Sincronizando...')
    const { data: { session } } = await supabase.auth.getSession()
    const payload = { ...formData, user_id: session.user.id }
    
    const { error } = await supabase.from('prestadores').upsert(payload)
    
    if (error) setStatus('Erro ao salvar')
    else setStatus('✅ Atualizado!')
    setTimeout(() => setStatus(''), 3000)
  }

  const fazerUploadFoto = async (e) => {
    const arquivo = e.target.files[0]
    if (!arquivo) return
    setStatus('Subindo foto...')
    try {
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}`
      await supabase.storage.from('fotos-perfil').upload(fileName, arquivo)
      const { data: { publicUrl } } = supabase.storage.from('fotos-perfil').getPublicUrl(fileName)
      setFormData(prev => ({ ...prev, foto_perfil: publicUrl }))
      setStatus('Foto atualizada!')
    } catch (err) { setStatus('Erro no upload') }
    setTimeout(() => setStatus(''), 2000)
  }

  const inputStyle = "w-full px-5 py-4 rounded-2xl bg-white border border-slate-100 font-medium outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50 transition-all text-slate-800 shadow-sm placeholder-slate-300 text-[14px] md:text-[15px]"

  if (loading) return (
    <div className="h-96 flex flex-col items-center justify-center gap-4 animate-pulse">
        <div className="w-12 h-12 bg-slate-100 rounded-full" />
        <div className="w-48 h-4 bg-slate-100 rounded-full" />
    </div>
  )

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
      
      {/* HEADER REFINADO */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-100 pb-8">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-slate-800 leading-tight">Perfil Profissional</h2>
          <p className="text-slate-500 text-[13px] font-medium mt-1">Como os clientes verão você na plataforma</p>
        </div>
        <div className={`text-[11px] font-bold uppercase px-4 py-2 rounded-full tracking-wider transition-all ${status.includes('✅') ? 'bg-green-50 text-green-600' : 'bg-blue-50 text-blue-600'}`}>
          {status || 'Sincronizado'}
        </div>
      </header>

      <form onSubmit={handleSalvar} className="grid grid-cols-1 md:grid-cols-12 gap-8">
        
        {/* COLUNA LATERAL: FOTO */}
        <div className="md:col-span-4 space-y-4">
          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-50 shadow-sm flex flex-col items-center sticky top-24">
            <div className="relative group cursor-pointer">
              <div className="w-32 h-32 md:w-40 md:h-40 rounded-[2.8rem] bg-slate-50 border-4 border-white overflow-hidden shadow-xl flex items-center justify-center relative transition-all group-hover:border-blue-50">
                {formData.foto_perfil ? (
                  <img src={formData.foto_perfil} className="w-full h-full object-cover duration-700 group-hover:scale-110" />
                ) : (
                  <User size={48} className="text-slate-200" />
                )}
                <input type="file" accept="image/*" onChange={fazerUploadFoto} className="absolute inset-0 opacity-0 cursor-pointer z-20" />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center text-white backdrop-blur-sm z-10">
                   <Camera size={24} />
                </div>
              </div>
            </div>
            <h4 className="mt-6 font-bold text-slate-700">Sua Foto</h4>
            <p className="text-[12px] font-medium text-slate-400 text-center mt-2 leading-relaxed">
              Clique para alterar. Prefira fotos com fundo neutro.
            </p>
          </div>
        </div>

        {/* COLUNA PRINCIPAL: DADOS */}
        <div className="md:col-span-8 space-y-6">
          
          <section className="bg-white p-6 md:p-10 rounded-[2.5rem] border border-slate-50 shadow-sm space-y-8">
            <div className="flex items-center gap-3 border-b border-slate-50 pb-5 mb-2">
                <Briefcase size={20} className="text-blue-600" />
                <h3 className="font-bold text-slate-800 text-lg">Dados Profissionais</h3>
            </div>

            <div className="space-y-6">
               <div className="space-y-2">
                  <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-2">Nome Comercial</label>
                  <input value={formData.nome || ''} onChange={e => setFormData({...formData, nome: e.target.value})} placeholder="Ex: João Reparos" className={inputStyle} />
               </div>

               <div className="space-y-2">
                  <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-2">WhatsApp de Contato</label>
                  <div className="relative">
                    <Phone size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input value={formData.whatsapp || ''} onChange={e => setFormData({...formData, whatsapp: e.target.value})} placeholder="(00) 00000-0000" className={`${inputStyle} pl-12`} />
                  </div>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                 <div className="space-y-2">
                    <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-2">Grupo</label>
                    <select value={formData.grupo_id || ''} onChange={e => { const val = e.target.value; setFormData({...formData, grupo_id: val, categoria_id: ''}); carregarCategorias(val); }} className={inputStyle}>
                      <option value="">Selecione...</option>
                      {grupos.map(g => <option key={g.id} value={g.id}>{g.nome}</option>)}
                    </select>
                 </div>
                 <div className="space-y-2">
                    <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-2">Categoria</label>
                    <select value={formData.categoria_id || ''} onChange={e => setFormData({...formData, categoria_id: e.target.value})} className={inputStyle}>
                      <option value="">Selecione...</option>
                      {categorias.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                    </select>
                 </div>
               </div>

               <div className="space-y-2">
                  <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-2">Bio / Descrição</label>
                  <textarea value={formData.bio || ''} onChange={e => setFormData({...formData, bio: e.target.value})} placeholder="Conte um pouco sobre sua experiência e serviços..." className={`${inputStyle} h-32 resize-none`} />
               </div>
            </div>
          </section>

          <section className="bg-white p-6 md:p-10 rounded-[2.5rem] border border-slate-50 shadow-sm space-y-8">
            <div className="flex items-center gap-3 border-b border-slate-50 pb-5 mb-2">
                <MapPin size={20} className="text-blue-600" />
                <h3 className="font-bold text-slate-800 text-lg">Onde você atende</h3>
            </div>

            <div className="space-y-6">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                 <div className="space-y-2">
                    <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-2">Estado</label>
                    <select value={formData.estado_sigla || ''} onChange={e => { const sigla = e.target.value; setFormData({ ...formData, estado_sigla: sigla, regiao_id: '', cidade_id: '' }); carregarRegioes(sigla); carregarCidades('', sigla); }} className={inputStyle}>
                      {estados.map(est => <option key={est.sigla} value={est.sigla}>{est.nome}</option>)}
                    </select>
                 </div>
                 <div className="space-y-2">
                    <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-2">Região</label>
                    <select value={formData.regiao_id || ''} onChange={e => { const regId = e.target.value; setFormData({ ...formData, regiao_id: regId, cidade_id: '' }); carregarCidades(regId, formData.estado_sigla); }} className={inputStyle}>
                      <option value="">Opcional</option>
                      {regioes.map(reg => <option key={reg.id} value={reg.id}>{reg.nome}</option>)}
                    </select>
                 </div>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                 <div className="space-y-2">
                    <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-2">Cidade Base</label>
                    <select value={formData.cidade_id || ''} onChange={e => setFormData({ ...formData, cidade_id: e.target.value })} className={inputStyle}>
                      <option value="">Selecione...</option>
                      {cidades.map(cid => <option key={cid.id} value={cid.id}>{cid.nome}</option>)}
                    </select>
                 </div>
                 <div className="space-y-2">
                    <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-2">Bairro</label>
                    <input value={formData.bairro || ''} onChange={e => setFormData({...formData, bairro: e.target.value})} placeholder="Ex: Centro" className={inputStyle} />
                 </div>
               </div>
            </div>
          </section>

          <button type="submit" className="w-full py-6 bg-blue-600 text-white rounded-[2rem] font-bold text-[15px] shadow-xl shadow-blue-100 hover:bg-blue-700 active:scale-95 transition-all flex items-center justify-center gap-3">
            {status === 'Sincronizando...' ? <Loader2 size={20} className="animate-spin" /> : <Save size={20} />}
            Salvar Alterações
          </button>
        </div>
      </form>
    </div>
  )
}
