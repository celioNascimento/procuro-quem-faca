'use client'
import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { 
  MapPin, User, ChevronRight, Briefcase, X, Loader2, Camera, CheckCircle2, Save, Star 
} from 'lucide-react'
import Link from 'next/link'
import ModalConfirmacao from '@/components/ui/ModalConfirmacao'
import HeaderCliente from '@/components/HeaderCliente' // Importação do novo componente

export default function PerfilDoCliente() {
  const router = useRouter()
  const fileInputRef = useRef(null)
  const [aba, setAba] = useState('servicos') 
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [user, setUser] = useState(null)
  const [servicos, setServicos] = useState([])
  const [isModalExcluirOpen, setIsModalExcluirOpen] = useState(false)
  
  const [listaEstados, setListaEstados] = useState([])
  const [listaCidades, setListaCidades] = useState([])

  const [perfil, setPerfil] = useState({
    full_name: '', email: '', whatsapp: '', logradouro: '',
    numero: '', complemento: '', bairro: '', cidade: '', uf: '', avatar_url: ''
  })

  const inputStyle = `w-full px-4 py-3.5 rounded-xl border border-slate-100 outline-none transition-all font-bold text-slate-800 bg-white shadow-sm placeholder-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-50 disabled:bg-slate-50 disabled:text-slate-400`

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
    const { data } = await supabase
      .from('portfolio_projetos')
      .select(`*, prestadores!inner(nome, foto_perfil, categorias(nome)), avaliacoes(id)`)
      .eq('cliente_whatsapp', numLimpo)
    
    if (data) {
      const ordenados = data.sort((a, b) => {
        const aAvaliado = a.avaliacoes?.length > 0;
        const bAvaliado = b.avaliacoes?.length > 0;
        if (!aAvaliado && a.status === 'finalizado' && (bAvaliado || b.status !== 'finalizado')) return -1;
        if (!bAvaliado && b.status === 'finalizado' && (aAvaliado || a.status !== 'finalizado')) return 1;
        return new Date(b.created_at) - new Date(a.created_at);
      });
      setServicos(ordenados)
    }
  }

  useEffect(() => {
    async function carregarDados() {
      const { data: { user: sessionUser } } = await supabase.auth.getUser()
      if (sessionUser) {
        setUser(sessionUser)
        const { data: profileData } = await supabase.from('profiles').select('*').eq('id', sessionUser.id).maybeSingle()
        const wppFormatado = profileData?.whatsapp || ''
        
        setPerfil({
          full_name: profileData?.full_name || sessionUser.user_metadata?.full_name || '',
          avatar_url: profileData?.avatar_url || sessionUser.user_metadata?.avatar_url || '',
          email: sessionUser.email,
          whatsapp: aplicarMascara(wppFormatado),
          logradouro: profileData?.logradouro || '',
          numero: profileData?.numero || '',
          complemento: profileData?.complemento || '',
          bairro: profileData?.bairro || '',
          cidade: profileData?.cidade || '',
          uf: profileData?.uf || ''
        })
        if (wppFormatado) buscarServicos(wppFormatado)
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
      buscarServicos(numLimpo)
      setShowSuccess(true)
      setTimeout(() => setShowSuccess(false), 3000)
    } catch (err) {
      alert("Erro ao salvar")
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-[#F8FAFC] pb-24 font-sans antialiased text-slate-600">
      {/* NOVO HEADER COM LOGO DA PASTA PUBLIC */}
      <HeaderCliente nomeCliente={perfil.full_name?.split(' ')[0]} />

      <input type="file" ref={fileInputRef} onChange={handleUploadFoto} accept="image/*" className="hidden" />

      {showSuccess && (
        <div className="fixed top-20 left-0 right-0 z-[100] flex justify-center px-6 animate-in slide-in-from-top-10 duration-500">
          <div className="bg-white border border-green-100 shadow-2xl rounded-[2rem] px-8 py-4 flex items-center gap-4">
            <CheckCircle2 className="text-green-500" size={20} />
            <p className="text-sm font-black text-slate-800 uppercase italic tracking-tighter leading-none">Perfil Sincronizado</p>
          </div>
        </div>
      )}

      <div className="max-w-xl mx-auto px-4 pt-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        
        <div className="flex bg-slate-200/50 p-1.5 rounded-3xl border border-slate-200/50">
          <button onClick={() => setAba('servicos')} className={`flex-1 py-3.5 rounded-[1.25rem] text-[10px] font-black uppercase tracking-widest transition-all ${aba === 'servicos' ? 'bg-white text-blue-600 shadow-md scale-[1.02]' : 'text-slate-500'}`}>
            Histórico ({servicos.length})
          </button>
          <button onClick={() => setAba('dados')} className={`flex-1 py-3.5 rounded-[1.25rem] text-[10px] font-black uppercase tracking-widest transition-all ${aba === 'dados' ? 'bg-white text-blue-600 shadow-md scale-[1.02]' : 'text-slate-500'}`}>
            Meus Dados
          </button>
        </div>

        {aba === 'servicos' ? (
          <div className="space-y-4">
            {servicos.length === 0 ? (
              <div className="py-24 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col items-center gap-4 text-center px-10">
                 <Briefcase size={32} className="text-slate-200" />
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Nenhum serviço registrado ainda.</p>
              </div>
            ) : (
              servicos.map((s) => {
                const jaAvaliado = s.avaliacoes?.length > 0;
                const aguardandoAvaliacao = s.status === 'finalizado' && !jaAvaliado;
                return (
                  <Link key={s.id} href={`/avaliar/${s.id}?token=${s.avaliacao_token}`}>
                    <div className={`bg-white p-5 rounded-[2.5rem] border transition-all group flex items-center gap-4 ${aguardandoAvaliacao ? 'border-blue-200 shadow-lg shadow-blue-50 bg-blue-50/10' : 'border-slate-100 shadow-sm'}`}>
                      <div className="w-14 h-14 rounded-2xl bg-slate-50 overflow-hidden shrink-0">
                          <img src={s.prestadores.foto_perfil || '/placeholder-avatar.png'} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-[8px] font-black uppercase text-blue-500 tracking-widest truncate">{s.prestadores.categorias?.nome}</p>
                          {aguardandoAvaliacao ? (
                            <span className="flex items-center gap-1 bg-blue-600 text-white text-[7px] font-black uppercase px-2 py-0.5 rounded-full animate-pulse"><Star size={8} fill="currentColor" /> Avaliar Agora</span>
                          ) : jaAvaliado ? (
                            <span className="bg-green-100 text-green-600 text-[7px] font-black uppercase px-2 py-0.5 rounded-full">Concluído</span>
                          ) : (
                            <span className="bg-amber-100 text-amber-600 text-[7px] font-black uppercase px-2 py-0.5 rounded-full">Em Progresso</span>
                          )}
                        </div>
                        <h3 className="text-base font-bold text-slate-800 truncate leading-none mb-1">{s.titulo}</h3>
                        <p className="text-[10px] font-black text-slate-400 uppercase italic tracking-tighter">Prestador: {s.prestadores.nome}</p>
                      </div>
                      <ChevronRight size={18} className={`${aguardandoAvaliacao ? 'text-blue-500 translate-x-1' : 'text-slate-200'} transition-all`} />
                    </div>
                  </Link>
                );
              })
            )}
          </div>
        ) : (
          <div className="space-y-6 animate-in fade-in duration-500">
            {/* SEÇÃO DE FOTO DE PERFIL */}
            <section className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm flex flex-col items-center gap-4">
              <div className="relative group cursor-pointer" onClick={() => fileInputRef.current.click()}>
                <div className="w-32 h-32 rounded-[3rem] bg-slate-50 border-2 border-slate-50 overflow-hidden shadow-inner flex items-center justify-center">
                   {uploading ? <Loader2 className="animate-spin text-blue-500" /> : perfil.avatar_url ? <img src={perfil.avatar_url} className="w-full h-full object-cover" /> : <User size={40} className="text-slate-200" />}
                </div>
                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 rounded-[3rem] transition-all flex items-center justify-center text-white"><Camera size={20} /></div>
              </div>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest italic text-center">Toque para alterar foto</p>
            </section>

            {/* SEÇÃO INFORMAÇÕES PESSOAIS */}
            <section className="bg-white rounded-[2.5rem] p-6 md:p-8 border border-slate-100 shadow-sm space-y-4">
              <h3 className="font-black uppercase text-[10px] tracking-widest text-slate-400 italic mb-2 px-4">Informações Pessoais</h3>
              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-4 italic">Nome Completo</label>
                  <input placeholder="Ex: João Silva" value={perfil.full_name} onChange={e => setPerfil({...perfil, full_name: e.target.value})} className={inputStyle} />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-4 italic">WhatsApp</label>
                  <input placeholder="(00) 00000-0000" value={perfil.whatsapp} onChange={e => setPerfil({...perfil, whatsapp: aplicarMascara(e.target.value)})} className={inputStyle} />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-4 italic">E-mail de Acesso</label>
                  <input value={perfil.email} disabled className={inputStyle} />
                </div>
              </div>
            </section>

            {/* SEÇÃO ENDEREÇO */}
            <section className="bg-white rounded-[2.5rem] p-6 md:p-8 border border-slate-100 shadow-sm space-y-4">
              <h3 className="font-black uppercase text-[10px] tracking-widest text-slate-400 italic mb-2 px-4 flex items-center gap-2">
                <MapPin size={14} /> Endereço de Instalação
              </h3>
              <div className="grid grid-cols-4 gap-3">
                <div className="col-span-3">
                  <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-4 italic">Rua / Avenida</label>
                  <input placeholder="Nome da rua" value={perfil.logradouro} onChange={e => setPerfil({...perfil, logradouro: e.target.value})} className={inputStyle} />
                </div>
                <div className="col-span-1">
                  <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-4 italic">Nº</label>
                  <input placeholder="123" value={perfil.numero} onChange={e => setPerfil({...perfil, numero: e.target.value})} className={inputStyle} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-4 italic">Bairro</label>
                  <input placeholder="Seu bairro" value={perfil.bairro} onChange={e => setPerfil({...perfil, bairro: e.target.value})} className={inputStyle} />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-4 italic">Complemento</label>
                  <input placeholder="Ap / Bloco" value={perfil.complemento} onChange={e => setPerfil({...perfil, complemento: e.target.value})} className={inputStyle} />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-1">
                  <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-4 italic">Estado (UF)</label>
                  <select value={perfil.uf} onChange={e => setPerfil({...perfil, uf: e.target.value, cidade: ''})} className={inputStyle}>
                    <option value="">--</option>
                    {listaEstados.map(e => <option key={e.sigla} value={e.sigla}>{e.sigla}</option>)}
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-4 italic">Cidade</label>
                  <select disabled={!perfil.uf} value={perfil.cidade} onChange={e => setPerfil({...perfil, cidade: e.target.value})} className={inputStyle}>
                    <option value="">Selecione...</option>
                    {listaCidades.map(c => <option key={c.nome} value={c.nome}>{c.nome}</option>)}
                  </select>
                </div>
              </div>
            </section>

            <button onClick={atualizar} disabled={loading} className="w-full py-6 bg-blue-600 text-white rounded-[2.5rem] font-black uppercase tracking-[0.3em] text-[11px] shadow-2xl hover:bg-blue-700 active:scale-95 transition-all flex items-center justify-center gap-3">
               {loading ? <Loader2 size={16} className="animate-spin" /> : <><Save size={16} /> Salvar Meus Dados</>}
            </button>
          </div>
        )}
      </div>

      <ModalConfirmacao 
        isOpen={isModalExcluirOpen} 
        onClose={() => setIsModalExcluirOpen(false)} 
        onConfirm={() => {/* handleExcluirConta */}} 
        title="Encerrar sua conta?" 
        message="Seu acesso será revogado permanentemente. Seu histórico e avaliações permanecerão registrados para fins de integridade dos serviços prestados."
      />
    </main>
  )
}