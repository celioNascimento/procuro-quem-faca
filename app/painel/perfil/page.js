'use client'
import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { 
  MapPin, Mail, Smartphone, User, ChevronRight, Clock, CheckCircle2, Save, Briefcase, X, Loader2, Camera, LogOut
} from 'lucide-react'
import Link from 'next/link'

export default function PerfilDoCliente() {
  const router = useRouter()
  const fileInputRef = useRef(null) // Referência para o input de arquivo oculto
  const [aba, setAba] = useState('servicos') 
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

  // Função de Logout
  const handleLogout = async () => {
    const confirmacao = window.confirm("Tem certeza que deseja sair da sua conta?")
    if (confirmacao) {
      await supabase.auth.signOut()
      router.push('/')
    }
  }

  const aplicarMascara = (valor) => {
    if (!valor) return ''
    const num = valor.replace(/\D/g, "").substring(0, 11)
    let formatado = num
    if (num.length > 2) formatado = `(${num.substring(0, 2)}) ${num.substring(2)}`
    if (num.length > 7) formatado = `(${num.substring(0, 2)}) ${num.substring(2, 7)}-${num.substring(7)}`
    return formatado
  }

  // Lógica de Upload de Foto
  const handleUploadFoto = async (event) => {
    try {
      setUploading(true)
      const file = event.target.files[0]
      if (!file) return

      const fileExt = file.name.split('.').pop()
      const fileName = `${user.id}-${Math.random()}.${fileExt}`
      const filePath = `${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('fotos-perfil')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('fotos-perfil')
        .getPublicUrl(filePath)

      setPerfil(prev => ({ ...prev, avatar_url: publicUrl }))
      
    } catch (error) {
      alert('Erro no upload: ' + error.message)
    } finally {
      setUploading(false)
    }
  }

  useEffect(() => {
    async function getEstados() {
      const { data } = await supabase.from('estados').select('sigla, nome').order('nome')
      if (data) setListaEstados(data)
    }
    getEstados()
  }, [])

  useEffect(() => {
    async function getCidades() {
      if (!perfil.uf) { setListaCidades([]); return; }
      const { data } = await supabase.from('cidades').select('nome').eq('estado_sigla', perfil.uf).eq('ativa', true).order('nome')
      if (data) setListaCidades(data)
    }
    getCidades()
  }, [perfil.uf])

  useEffect(() => {
    async function carregarDados() {
      const { data: { user: sessionUser } } = await supabase.auth.getUser()
      if (sessionUser) {
        setUser(sessionUser)
        const { data: profileData } = await supabase.from('profiles').select('*').eq('id', sessionUser.id).maybeSingle()
        
        const dadosBase = {
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
        }
        setPerfil(dadosBase)
        if (profileData?.whatsapp) buscarServicos(profileData.whatsapp)
      }
    }
    carregarDados()
  }, [])

  async function buscarServicos(whatsapp) {
    const numLimpo = whatsapp.replace(/\D/g, '')
    const { data } = await supabase.from('portfolio_projetos').select(`*, prestadores(nome, foto_perfil, categoria:categorias(nome))`).eq('cliente_whatsapp', numLimpo).order('created_at', { ascending: false })
    if (data) setServicos(data)
  }

  const atualizar = async () => {
    setLoading(true)
    try {
      const dadosParaSalvar = {
        id: user.id, full_name: perfil.full_name, avatar_url: perfil.avatar_url,
        whatsapp: perfil.whatsapp.replace(/\D/g, ''), logradouro: perfil.logradouro,
        numero: perfil.numero, complemento: perfil.complemento, bairro: perfil.bairro,
        cidade: perfil.cidade, uf: perfil.uf, updated_at: new Date().toISOString()
      }
      const { error } = await supabase.from('profiles').upsert(dadosParaSalvar)
      if (error) throw error
      
      setShowSuccess(true)
      setTimeout(() => setShowSuccess(false), 3000)
    } catch (err) {
      alert("Erro ao salvar: " + err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-12 font-sans antialiased text-slate-600">
      
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleUploadFoto} 
        accept="image/*" 
        className="hidden" 
      />

      {showSuccess && (
        <div className="fixed top-10 left-0 right-0 z-[100] flex justify-center px-6 animate-in slide-in-from-top-10 duration-500">
          <div className="bg-white border border-green-100 shadow-2xl rounded-[2rem] px-8 py-4 flex items-center gap-4">
            <div className="bg-green-500 text-white p-2 rounded-full">
              <CheckCircle2 size={20} />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-800 uppercase tracking-tight leading-none">Perfil Sincronizado</p>
              <p className="text-[10px] font-medium text-slate-400 uppercase tracking-widest mt-1">Dados oficiais atualizados</p>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-xl mx-auto px-6 pt-12 space-y-10">
        
        <div className="flex flex-col items-center text-center space-y-4">
          <div className="relative group cursor-pointer" onClick={() => fileInputRef.current.click()}>
            <div className="absolute inset-0 bg-blue-500 rounded-full blur-2xl opacity-10" />
            
            <div className="w-28 h-28 rounded-[2.5rem] bg-white overflow-hidden border-[6px] border-white shadow-2xl relative z-10 transition-transform duration-500 hover:scale-105 flex items-center justify-center">
              {uploading ? (
                <Loader2 size={32} className="animate-spin text-blue-500" />
              ) : perfil.avatar_url ? (
                <img src={perfil.avatar_url} className="w-full h-full object-cover" alt="Avatar" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-200 bg-slate-50"><User size={44} /></div>
              )}

              <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white z-20">
                <Camera size={24} />
              </div>
            </div>

            <div className="absolute -bottom-2 -right-2 bg-blue-600 text-white p-2.5 rounded-2xl border-4 border-white shadow-lg z-20">
              <CheckCircle2 size={18} strokeWidth={2.5} />
            </div>
          </div>

          <div className="pt-2">
            <h1 className="text-3xl font-bold text-slate-900 leading-none tracking-tight">
              {perfil.full_name?.split(' ')[0] || 'Meu'} Painel
            </h1>
            <p className="text-[11px] font-semibold text-blue-600/70 uppercase tracking-[0.25em] mt-3 bg-blue-50 py-1.5 px-5 rounded-full inline-block">
              Identidade Digital Verificada
            </p>
          </div>
        </div>

        <div className="flex bg-slate-200/50 p-1.5 rounded-3xl backdrop-blur-sm border border-slate-200/50 shadow-sm">
          <button onClick={() => setAba('servicos')} className={`flex-1 py-3.5 rounded-[1.25rem] text-[10px] font-bold uppercase tracking-widest transition-all duration-300 ${aba === 'servicos' ? 'bg-white text-blue-600 shadow-md scale-[1.02]' : 'text-slate-500 hover:text-slate-700'}`}>
            Histórico
          </button>
          <button onClick={() => setAba('dados')} className={`flex-1 py-3.5 rounded-[1.25rem] text-[10px] font-bold uppercase tracking-widest transition-all duration-300 ${aba === 'dados' ? 'bg-white text-blue-600 shadow-md scale-[1.02]' : 'text-slate-500 hover:text-slate-700'}`}>
            Meus Dados
          </button>
        </div>

        {aba === 'servicos' ? (
          <div className="space-y-4 animate-in fade-in duration-700">
            {servicos.length === 0 ? (
              <div className="py-24 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col items-center gap-4 text-center px-10">
                 <div className="w-16 h-16 bg-slate-50 rounded-3xl flex items-center justify-center text-slate-200">
                    <Briefcase size={32} />
                 </div>
                 <p className="text-[11px] font-medium text-slate-400 uppercase tracking-widest">Aguardando seu primeiro serviço.</p>
              </div>
            ) : (
              servicos.map((s) => (
                <Link key={s.id} href={`/avaliar/${s.id}?token=${s.avaliacao_token}`}>
                  <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm flex items-center gap-5 hover:border-blue-200 hover:shadow-xl transition-all group">
                    <img src={s.prestadores.foto_perfil} className="w-16 h-16 rounded-3xl object-cover shadow-md" />
                    <div className="flex-1">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-[9px] font-bold uppercase text-blue-500 tracking-wider bg-blue-50 px-2 py-0.5 rounded-lg">{s.prestadores.categoria?.nome}</span>
                        <span className={`text-[9px] font-bold uppercase ${s.status === 'finalizado' ? 'text-green-500' : 'text-amber-500 animate-pulse'}`}>
                           {s.status === 'finalizado' ? 'Concluído' : 'Ativo'}
                        </span>
                      </div>
                      <h3 className="text-lg font-bold text-slate-800 leading-tight tracking-tight">{s.titulo}</h3>
                      <p className="text-[10px] font-medium text-slate-400 uppercase mt-1">Prof. {s.prestadores.nome}</p>
                    </div>
                    <ChevronRight size={20} className="text-slate-200 group-hover:text-blue-500 transition-all" />
                  </div>
                </Link>
              ))
            )}
          </div>
        ) : (
          <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-700">
            <div className="space-y-4">
              <h3 className="text-[10px] font-bold uppercase text-slate-400 tracking-[0.2em] px-4">Identificação Pessoal</h3>
              <div className="bg-white rounded-[2.5rem] border border-slate-100 p-8 shadow-sm space-y-4">
                <ItemInput label="Nome Completo" value={perfil.full_name} onChange={(v) => setPerfil({...perfil, full_name: v})} icon={<User size={16}/>} />
                <ItemInput label="WhatsApp" value={perfil.whatsapp} onChange={(v) => setPerfil({...perfil, whatsapp: aplicarMascara(v)})} icon={<Smartphone size={16}/>} />
                <ItemInput label="E-mail Verificado" value={perfil.email} icon={<Mail size={16}/>} disabled />
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-[10px] font-bold uppercase text-slate-400 tracking-[0.2em] px-4 flex items-center gap-2">
                <MapPin size={14} /> Endereço de Instalação
              </h3>
              <div className="bg-white rounded-[2.5rem] border border-slate-100 p-8 shadow-sm space-y-4">
                <div className="grid grid-cols-4 gap-3">
                  <div className="col-span-3">
                    <ItemInput label="Rua / Avenida" value={perfil.logradouro} onChange={(v) => setPerfil({...perfil, logradouro: v})} />
                  </div>
                  <div className="col-span-1">
                    <ItemInput label="Nº" value={perfil.numero} onChange={(v) => setPerfil({...perfil, numero: v})} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <ItemInput label="Complemento" value={perfil.complemento} onChange={(v) => setPerfil({...perfil, complemento: v})} />
                  <ItemInput label="Bairro" value={perfil.bairro} onChange={(v) => setPerfil({...perfil, bairro: v})} />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-1 flex flex-col gap-1.5 bg-slate-50 p-4 rounded-2xl border border-slate-100 transition-all focus-within:border-blue-300">
                    <label className="text-[8px] font-bold uppercase text-slate-400">UF</label>
                    <select value={perfil.uf} onChange={(e) => setPerfil({...perfil, uf: e.target.value, cidade: ''})} className="w-full bg-transparent text-[12px] font-bold text-slate-700 outline-none appearance-none cursor-pointer">
                      <option value="">--</option>
                      {listaEstados.map(e => <option key={e.sigla} value={e.sigla}>{e.sigla}</option>)}
                    </select>
                  </div>
                  <div className="col-span-2 flex flex-col gap-1.5 bg-slate-50 p-4 rounded-2xl border border-slate-100 transition-all focus-within:border-blue-300">
                    <label className="text-[8px] font-bold uppercase text-slate-400">Cidade</label>
                    <select disabled={!perfil.uf} value={perfil.cidade} onChange={(e) => setPerfil({...perfil, cidade: e.target.value})} className="w-full bg-transparent text-[12px] font-bold text-slate-700 outline-none appearance-none cursor-pointer">
                      <option value="">Selecione...</option>
                      {listaCidades.map(c => <option key={c.nome} value={c.nome}>{c.nome}</option>)}
                    </select>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4 pt-4">
              <button onClick={atualizar} disabled={loading} className={`w-full py-6 text-white rounded-[2rem] font-bold uppercase text-[12px] tracking-[0.3em] shadow-xl transition-all flex items-center justify-center gap-3 active:scale-95 ${loading ? 'bg-slate-400' : 'bg-blue-600 shadow-blue-200 hover:bg-blue-700'}`}>
                {loading ? (
                  <>Sincronizando... <Loader2 size={18} className="animate-spin" /></>
                ) : (
                  <>Salvar Perfil <Save size={18} /></>
                )}
              </button>

              <button 
                onClick={handleLogout}
                className="w-full py-4 bg-white border-2 border-slate-100 text-slate-400 rounded-[2rem] font-bold uppercase text-[10px] tracking-[0.2em] transition-all flex items-center justify-center gap-2 hover:bg-red-50 hover:text-red-500 hover:border-red-100"
              >
                <LogOut size={14} /> Sair da Conta
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function ItemInput({ label, value, icon, disabled, onChange }) {
  return (
    <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100 transition-all focus-within:border-blue-400 focus-within:bg-white focus-within:shadow-md group">
      {icon && <div className="text-slate-400 transition-colors group-focus-within:text-blue-500">{icon}</div>}
      <div className="flex-1">
        <p className="text-[8px] font-bold uppercase text-slate-400 leading-none mb-1.5">{label}</p>
        <input disabled={disabled} value={value || ''} onChange={(e) => onChange && onChange(e.target.value)} className="w-full bg-transparent text-[12px] font-bold text-slate-700 outline-none disabled:opacity-50" placeholder="..." />
      </div>
    </div>
  )
}