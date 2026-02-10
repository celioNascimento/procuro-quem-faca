'use client'
import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function PerfilDashboard() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState('')
  
  // Estados de listas do banco
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

  // 1. FUNÇÕES PADRONIZADAS (IGUAIS AO CADASTRO)
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

  // 2. USEEFFECT DE CARREGAMENTO INICIAL
  useEffect(() => {
    const carregarTudo = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) { router.push('/login'); return; }

        // Carregar Perfil
        const { data: perfil } = await supabase
          .from('prestadores')
          .select('*')
          .eq('user_id', session.user.id)
          .maybeSingle()

        // Carregar Listas Estáticas
        const [resGrupos, resEstados] = await Promise.all([
          supabase.from('categorias_grupos').select('*').order('nome'),
          supabase.from('estados').select('*').order('nome')
        ])

        setGrupos(resGrupos.data || [])
        setEstados(resEstados.data || [])

        if (perfil) {
          setFormData(perfil)
          // Carregar dependências baseadas no perfil salvo
          if (perfil.grupo_id) await carregarCategorias(perfil.grupo_id)
          if (perfil.estado_sigla) await carregarRegioes(perfil.estado_sigla)
          // Lógica inteligente para carregar cidades (por região ou estado)
          await carregarCidades(perfil.regiao_id, perfil.estado_sigla)
        } else {
          // Padrão para novo perfil
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
    setStatus('Salvando...')
    const { data: { session } } = await supabase.auth.getSession()
    
    // Removemos campos que não devem ser enviados (ex: relacionamentos se houver)
    const payload = { ...formData, user_id: session.user.id }
    
    const { error } = await supabase
      .from('prestadores')
      .upsert(payload)
    
    if (error) setStatus('Erro ao salvar')
    else setStatus('✅ Atualizado!')
    setTimeout(() => setStatus(''), 3000)
  }

  const fazerUploadFoto = async (e) => {
    const arquivo = e.target.files[0]
    if (!arquivo) return
    setStatus('Enviando foto...')
    try {
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}`
      await supabase.storage.from('fotos-perfil').upload(fileName, arquivo)
      const { data: { publicUrl } } = supabase.storage.from('fotos-perfil').getPublicUrl(fileName)
      setFormData(prev => ({ ...prev, foto_perfil: publicUrl }))
      setStatus('Foto atualizada!')
    } catch (err) { setStatus('Erro no upload') }
    setTimeout(() => setStatus(''), 2000)
  }

  const inputStyle = "w-full p-4 rounded-2xl bg-slate-50 border border-slate-100 font-bold outline-none focus:border-blue-500 transition-all text-slate-800"

  if (loading) return <div className="p-8 text-slate-400 font-bold animate-pulse text-center pt-20">Carregando perfil...</div>

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20">
      <header className="flex justify-between items-end border-b border-slate-100 pb-6">
        <div>
          <h2 className="text-2xl font-black text-slate-900 uppercase italic">Meu Perfil</h2>
          <p className="text-slate-500 text-[11px] font-bold uppercase tracking-widest">Gerencie sua identidade na vitrine</p>
        </div>
        <div className="text-[10px] font-black uppercase text-blue-600 bg-blue-50 px-4 py-2 rounded-full tracking-widest">
          {status || 'Sincronizado'}
        </div>
      </header>

      <form onSubmit={handleSalvar} className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Coluna Lateral: Foto */}
        <div className="md:col-span-1 space-y-4">
          <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col items-center">
             <div className="relative w-32 h-32 rounded-[2.5rem] bg-slate-50 border-2 border-dashed border-slate-200 overflow-hidden flex items-center justify-center group hover:border-blue-400 transition-colors">
                {formData.foto_perfil ? <img src={formData.foto_perfil} className="w-full h-full object-cover" /> : <span className="text-slate-300 font-bold text-[10px]">FOTO</span>}
                <input type="file" accept="image/*" onChange={fazerUploadFoto} className="absolute inset-0 opacity-0 cursor-pointer" />
             </div>
             <p className="mt-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Clique na foto para alterar</p>
          </div>
        </div>

        {/* Coluna Principal: Dados */}
        <div className="md:col-span-2 space-y-6">
          <section className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-4">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Dados Principais</h3>
            
            <input 
              value={formData.nome || ''} 
              onChange={e => setFormData({...formData, nome: e.target.value})}
              placeholder="Nome Profissional" 
              className={inputStyle} 
            />
            
            <input 
              value={formData.whatsapp || ''} 
              onChange={e => setFormData({...formData, whatsapp: e.target.value})} // Ideal adicionar máscara aqui depois
              placeholder="WhatsApp" 
              className={inputStyle} 
            />

            <div className="grid grid-cols-2 gap-4">
               <select 
                 value={formData.grupo_id || ''} 
                 onChange={e => { 
                    const val = e.target.value; 
                    setFormData({...formData, grupo_id: val, categoria_id: ''}); 
                    carregarCategorias(val); 
                 }}
                 className={inputStyle}
               >
                 <option value="">Grupo</option>
                 {grupos.map(g => <option key={g.id} value={g.id}>{g.nome}</option>)}
               </select>

               <select 
                 value={formData.categoria_id || ''} 
                 onChange={e => setFormData({...formData, categoria_id: e.target.value})}
                 className={inputStyle}
               >
                 <option value="">Categoria</option>
                 {categorias.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
               </select>
            </div>
            
            <textarea 
              value={formData.bio || ''} 
              onChange={e => setFormData({...formData, bio: e.target.value})}
              placeholder="Sua biografia..." 
              className={`${inputStyle} h-32 resize-none`}
            />
          </section>

          <section className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-4">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Localização</h3>
            
            <div className="grid grid-cols-2 gap-4">
                <select 
                  value={formData.estado_sigla || ''} 
                  onChange={e => { 
                    const sigla = e.target.value; 
                    setFormData({ ...formData, estado_sigla: sigla, regiao_id: '', cidade_id: '' }); 
                    carregarRegioes(sigla); 
                    carregarCidades('', sigla); 
                  }} 
                  className={inputStyle}
                >
                  {estados.map(est => <option key={est.sigla} value={est.sigla}>{est.nome}</option>)}
                </select>

                <select 
                  value={formData.regiao_id || ''} 
                  onChange={e => { 
                    const regId = e.target.value; 
                    setFormData({ ...formData, regiao_id: regId, cidade_id: '' }); 
                    carregarCidades(regId, formData.estado_sigla); 
                  }} 
                  className={inputStyle}
                >
                  <option value="">Região (Opcional)</option>
                  {regioes.map(reg => <option key={reg.id} value={reg.id}>{reg.nome}</option>)}
                </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <select 
                  value={formData.cidade_id || ''} 
                  onChange={e => setFormData({ ...formData, cidade_id: e.target.value })} 
                  className={inputStyle}
                >
                  <option value="">Cidade Sede</option>
                  {cidades.map(cid => <option key={cid.id} value={cid.id}>{cid.nome}</option>)}
                </select>

                <input 
                  value={formData.bairro || ''} 
                  onChange={e => setFormData({...formData, bairro: e.target.value})}
                  placeholder="Bairro" 
                  className={inputStyle} 
                />
            </div>
          </section>

          <button type="submit" className="w-full py-5 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] shadow-xl shadow-blue-100 hover:bg-blue-700 active:scale-[0.98] transition-all">
            Salvar Alterações
          </button>
        </div>
      </form>
    </div>
  )
}