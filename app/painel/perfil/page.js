'use client'
import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { 
  MapPin, User, ChevronRight, Briefcase, X, Loader2, Camera, CheckCircle2, 
  Save, Star, Search, ArrowRight, Activity, Clock, Filter
} from 'lucide-react'
import Link from 'next/link'
import HeaderCliente from '@/components/HeaderCliente'

export default function PerfilDoCliente() {
  const router = useRouter()
  const fileInputRef = useRef(null)
  const [aba, setAba] = useState('servicos') 
  const [filtroStatus, setFiltroStatus] = useState('todos') 
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [user, setUser] = useState(null)
  const [servicos, setServicos] = useState([])
  
  const [listaEstados, setListaEstados] = useState([])
  const [listaCidades, setListaCidades] = useState([])

  const [perfil, setPerfil] = useState({
    full_name: '', email: '', whatsapp: '', logradouro: '',
    numero: '', complemento: '', bairro: '', cidade: '', uf: '', avatar_url: ''
  })

  const inputStyle = `w-full px-5 py-4 rounded-2xl border border-slate-100 outline-none transition-all font-bold text-slate-800 bg-white shadow-sm placeholder-slate-300 focus:border-blue-500 focus:ring-8 focus:ring-blue-50 disabled:bg-slate-50 disabled:text-slate-400 italic text-sm`

  const aplicarMascara = (valor) => {
    if (!valor) return ''
    const num = valor.replace(/\D/g, "").substring(0, 11)
    let formatado = num
    if (num.length > 2) formatado = `(${num.substring(0, 2)}) ${num.substring(2)}`
    if (num.length > 7) formatado = `(${num.substring(0, 2)}) ${num.substring(2, 7)}-${num.substring(7)}`
    return formatado
  }

  const handleUploadFoto = async (event) => {
    try {
      setUploading(true)
      const file = event.target.files[0]
      if (!file) return
      const fileName = `${user.id}-${Date.now()}.${file.name.split('.').pop()}`
      const { error: uploadError } = await supabase.storage.from('fotos-perfil').upload(fileName, file)
      if (uploadError) throw uploadError
      const { data: { publicUrl } } = supabase.storage.from('fotos-perfil').getPublicUrl(fileName)
      setPerfil(prev => ({ ...prev, avatar_url: publicUrl }))
    } catch (error) {
      alert('Erro no upload')
    } finally {
      setUploading(false)
    }
  }

  async function buscarServicos(whatsapp) {
    if (!whatsapp) return;
    const numLimpo = whatsapp.replace(/\D/g, '')
    
    // CORREÇÃO CIRÚRGICA: Ocultamos 'em_registro' (fluxo interno do prestador)
    // Mostramos apenas projetos que o cliente já pode interagir
    const { data } = await supabase
      .from('portfolio_projetos')
      .select(`id, titulo, status, created_at, avaliacao_token, cliente_whatsapp, prestadores!inner(nome, foto_perfil, categoria:categorias(nome)), avaliacoes(id)`)
      .eq('cliente_whatsapp', numLimpo)
      .in('status', ['pendente', 'em_execucao', 'finalizado', 'concluido']) 
    
    if (data) {
      const ordenados = data.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      setServicos(ordenados)
    }
  }

  useEffect(() => {
    async function carregarDados() {
      const { data: { user: sessionUser } } = await supabase.auth.getUser()
      if (sessionUser) {
        setUser(sessionUser)
        const { data: profileData } = await supabase.from('profiles').select('*').eq('id', sessionUser.id).maybeSingle()
        
        setPerfil({
          full_name: profileData?.full_name || sessionUser.user_metadata?.full_name || '',
          avatar_url: profileData?.avatar_url || sessionUser.user_metadata?.avatar_url || '',
          email: sessionUser.email,
          whatsapp: aplicarMascara(profileData?.whatsapp || ''),
          logradouro: profileData?.logradouro || '',
          numero: profileData?.numero || '',
          complemento: profileData?.complemento || '',
          bairro: profileData?.bairro || '',
          cidade: profileData?.cidade || '',
          uf: profileData?.uf || ''
        })
        if (profileData?.whatsapp) buscarServicos(profileData.whatsapp)
      }
    }
    carregarDados()
    supabase.from('estados').select('sigla, nome').order('nome').then(({data}) => data && setListaEstados(data))
  }, [])

  useEffect(() => {
    if (perfil.uf) {
      supabase.from('cidades').select('nome').eq('estado_sigla', perfil.uf).eq('ativa', true).order('nome').then(({data}) => data && setListaCidades(data))
    }
  }, [perfil.uf])

  const atualizar = async () => {
    setLoading(true)
    try {
      const numLimpo = perfil.whatsapp.replace(/\D/g, '')
      const { error } = await supabase.from('profiles').upsert({
        id: user.id, 
        full_name: perfil.full_name, 
        avatar_url: perfil.avatar_url,
        whatsapp: numLimpo, 
        logradouro: perfil.logradouro,
        numero: perfil.numero, 
        complemento: perfil.complemento, 
        bairro: perfil.bairro,
        cidade: perfil.cidade, 
        uf: perfil.uf, 
        updated_at: new Date().toISOString()
      })
      if (error) throw error
      setShowSuccess(true)
      setTimeout(() => setShowSuccess(false), 3000)
    } catch (err) { alert("Erro ao salvar") } finally { setLoading(false) }
  }

  const getStatusInfo = (status) => {
    const s = status?.toLowerCase()
    // REVISÃO SEMÂNTICA: 'pendente' agora é Pendente (de aceite) para o cliente
    if (s === 'pendente') return { label: 'Pendente', color: 'bg-amber-50 text-amber-600 border-amber-100' }
    if (s === 'em_execucao') return { label: 'Em Progresso', color: 'bg-blue-50 text-blue-600 border-blue-100' }
    if (s === 'finalizado' || s === 'concluido') return { label: 'Finalizado', color: 'bg-green-50 text-green-600 border-green-100' }
    return { label: status, color: 'bg-slate-50 text-slate-600 border-slate-100' }
  }

  const servicosFiltrados = servicos.filter(s => {
    const status = s.status?.toLowerCase();
    if (filtroStatus === 'todos') return true;
    if (filtroStatus === 'pendente') return status === 'pendente';
    if (filtroStatus === 'em_progresso') return status === 'em_execucao';
    if (filtroStatus === 'finalizados') return status === 'finalizado' || status === 'concluido';
    return true;
  });

  const servicosAtivosCount = servicos.filter(s => s.status === 'pendente' || s.status === 'em_execucao').length;

  return (
    <main className="min-h-screen bg-[#F8FAFC] pb-24 font-sans antialiased text-slate-600">
      <HeaderCliente nomeCliente={perfil.full_name?.split(' ')[0]} />

      <input type="file" ref={fileInputRef} onChange={handleUploadFoto} accept="image/*" className="hidden" />

      {showSuccess && (
        <div className="fixed top-24 left-0 right-0 z-[100] flex justify-center px-6 animate-in slide-in-from-top-10 duration-500">
          <div className="bg-white border-2 border-green-50 shadow-2xl rounded-full px-8 py-3 flex items-center gap-3">
            <div className="bg-green-500 rounded-full p-1"><CheckCircle2 className="text-white" size={14} /></div>
            <p className="text-[10px] font-black text-slate-800 uppercase italic tracking-widest leading-none">Perfil Atualizado</p>
          </div>
        </div>
      )}

      <div className="max-w-xl mx-auto px-6 pt-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        
        <div className="grid grid-cols-2 gap-4">
            <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
                    <Activity size={20} />
                </div>
                <div>
                    <p className="text-[8px] font-black uppercase text-slate-400 italic tracking-widest leading-none mb-1">Em Aberto</p>
                    <p className="text-lg font-black text-slate-800 leading-none italic uppercase tracking-tighter">{servicosAtivosCount} Ativos</p>
                </div>
            </div>

            <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 shrink-0">
                    <Clock size={20} />
                </div>
                <div>
                    <p className="text-[8px] font-black uppercase text-slate-400 italic tracking-widest leading-none mb-1">Histórico</p>
                    <p className="text-lg font-black text-slate-800 leading-none italic uppercase tracking-tighter">{servicos.length} Total</p>
                </div>
            </div>
        </div>

        <div className="flex bg-slate-200/40 p-1.5 rounded-[2.5rem] border border-slate-200/50 backdrop-blur-sm">
          <button onClick={() => setAba('servicos')} className={`flex-1 py-4 rounded-[2rem] text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-300 ${aba === 'servicos' ? 'bg-white text-blue-600 shadow-xl scale-[1.02]' : 'text-slate-400'}`}>
            Meus Projetos
          </button>
          <button onClick={() => setAba('dados')} className={`flex-1 py-4 rounded-[2rem] text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-300 ${aba === 'dados' ? 'bg-white text-blue-600 shadow-xl scale-[1.02]' : 'text-slate-400'}`}>
            Dados da Conta
          </button>
        </div>

        {aba === 'servicos' ? (
          <div className="space-y-6">
            <div className="flex items-center gap-2 overflow-x-auto pb-2 custom-scrollbar">
              {[
                { id: 'todos', label: 'Todos' },
                { id: 'pendente', label: 'Pendente' },
                { id: 'em_progresso', label: 'Em Progresso' },
                { id: 'finalizados', label: 'Concluídos' }
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => setFiltroStatus(f.id)}
                  className={`px-6 py-2.5 rounded-full text-[9px] font-black uppercase tracking-widest italic transition-all shrink-0 border ${
                    filtroStatus === f.id 
                    ? 'bg-blue-600 text-white border-blue-600 shadow-lg' 
                    : 'bg-white text-slate-400 border-slate-100 hover:border-slate-200'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <div className="space-y-5">
              {servicosFiltrados.length === 0 ? (
                <div className="py-24 bg-white rounded-[3rem] border border-slate-100 shadow-sm flex flex-col items-center gap-5 text-center px-10">
                   <div className="w-20 h-20 rounded-full bg-slate-50 flex items-center justify-center text-slate-200 border-2 border-dashed border-slate-100">
                      <Briefcase size={32} />
                   </div>
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.25em] italic leading-relaxed text-center">Nenhum projeto encontrado nesta categoria.</p>
                </div>
              ) : (
                servicosFiltrados.map((s) => {
                  const statusInfo = getStatusInfo(s.status)
                  
                  const rotaDestino = s.status === 'pendente' 
                    ? `/meus-servicos?token=${s.avaliacao_token}` 
                    : `/avaliar/${s.id}?token=${s.avaliacao_token}`

                  return (
                    <div key={s.id} className="bg-white p-6 rounded-[3rem] border border-slate-50 shadow-sm flex items-center group relative overflow-hidden hover:border-blue-100 transition-all">
                      <div className="flex items-center gap-5 flex-1 min-w-0 pr-28">
                        <div className="w-16 h-16 rounded-[1.5rem] bg-slate-100 overflow-hidden shrink-0 shadow-inner">
                            <img src={s.prestadores?.foto_perfil || '/placeholder-avatar.png'} className="w-full h-full object-cover transition-transform group-hover:scale-110 duration-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <span className={`text-[7px] font-black uppercase px-3 py-1 rounded-full tracking-widest border ${statusInfo.color}`}>
                              {statusInfo.label}
                            </span>
                          </div>
                          <h3 className="text-[13px] font-black text-slate-800 italic uppercase leading-tight mb-1 truncate">{s.titulo}</h3>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter truncate italic">{s.prestadores?.nome}</p>
                        </div>
                      </div>
                      <div className="absolute right-6">
                        <Link href={rotaDestino} className="w-12 h-12 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center border border-slate-100 hover:bg-blue-600 hover:text-white transition-all active:scale-90 shadow-sm">
                          <ChevronRight size={18} strokeWidth={3} />
                        </Link>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
            {/* O conteúdo de Dados da Conta permanece igual para manter a estrutura aprovada */}
            <section className="bg-white rounded-[3rem] p-10 border border-slate-100 shadow-sm flex flex-col items-center relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-2 bg-slate-100"></div>
              <div className="relative group cursor-pointer" onClick={() => fileInputRef.current.click()}>
                <div className="w-36 h-36 rounded-[3.5rem] bg-slate-50 border-4 border-white overflow-hidden shadow-2xl flex items-center justify-center relative">
                   {uploading ? <Loader2 className="animate-spin text-blue-500" /> : perfil.avatar_url ? <img src={perfil.avatar_url} className="w-full h-full object-cover" /> : <User size={48} className="text-slate-200" />}
                   <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center text-white backdrop-blur-sm"><Camera size={24} /></div>
                </div>
              </div>
              <div className="mt-6 text-center">
                 <h2 className="text-lg font-black text-slate-800 uppercase italic leading-none">{perfil.full_name || 'Configurações'}</h2>
                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-2 italic flex items-center justify-center gap-2">
                   Gerencie seus dados de contato e endereço
                 </p>
              </div>
            </section>

            <div className="bg-white rounded-[3rem] p-8 md:p-10 border border-slate-100 shadow-sm space-y-8">
                <div className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-5 italic leading-none">Nome Completo</label>
                        <input value={perfil.full_name} onChange={e => setPerfil({...perfil, full_name: e.target.value})} className={inputStyle} />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-5 italic leading-none">WhatsApp</label>
                        <input value={perfil.whatsapp} onChange={e => setPerfil({...perfil, whatsapp: aplicarMascara(e.target.value)})} className={inputStyle} />
                    </div>
                </div>

                <div className="pt-6 border-t border-slate-50 space-y-6">
                    <h3 className="font-black uppercase text-[10px] tracking-[0.2em] text-slate-800 italic flex items-center gap-2"><MapPin size={14} /> Localização</h3>
                    <div className="grid grid-cols-4 gap-4">
                        <div className="col-span-3 space-y-2">
                          <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-5 italic leading-none">Logradouro</label>
                          <input placeholder="Rua / Avenida" value={perfil.logradouro} onChange={e => setPerfil({...perfil, logradouro: e.target.value})} className={inputStyle} />
                        </div>
                        <div className="col-span-1 space-y-2">
                          <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-5 italic leading-none">Nº</label>
                          <input placeholder="Ex: 10" value={perfil.numero} onChange={e => setPerfil({...perfil, numero: e.target.value})} className={inputStyle} />
                        </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                        <div className="col-span-1 space-y-2">
                          <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-5 italic leading-none">UF</label>
                          <select value={perfil.uf} onChange={e => setPerfil({...perfil, uf: e.target.value, cidade: ''})} className={inputStyle}>
                            <option value="">--</option>
                            {listaEstados.map(e => <option key={e.sigla} value={e.sigla}>{e.sigla}</option>)}
                          </select>
                        </div>
                        <div className="col-span-2 space-y-2">
                          <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-5 italic leading-none">Cidade</label>
                          <select disabled={!perfil.uf} value={perfil.cidade} onChange={e => setPerfil({...perfil, cidade: e.target.value})} className={inputStyle}>
                            <option value="">Selecione...</option>
                            {listaCidades.map(c => <option key={c.nome} value={c.nome}>{c.nome}</option>)}
                          </select>
                        </div>
                    </div>
                </div>

                <button onClick={atualizar} disabled={loading} className="w-full py-7 bg-blue-600 text-white rounded-[3rem] font-black uppercase tracking-[0.4em] text-[12px] shadow-[0_20px_40px_rgba(37,99,235,0.3)] hover:bg-blue-700 active:scale-95 transition-all flex items-center justify-center gap-4 group">
                    {loading ? <Loader2 size={20} className="animate-spin" /> : <><Save size={20} /> Efetivar Alterações</>}
                </button>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}