'use client'
import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import {
  MapPin, User, ChevronRight, Briefcase, Loader2, Camera, CheckCircle2,
  Save, Activity, Clock, AlertCircle, Star, ArrowRight
} from 'lucide-react'
import HeaderCliente from '@/components/HeaderCliente'

export default function PerfilDoCliente() {
  const router = useRouter()
  const fileInputRef = useRef(null)
  const [aba, setAba] = useState('servicos')
  const [filtroStatus, setFiltroStatus] = useState('todos')
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [loadingServicos, setLoadingServicos] = useState(true)
  const [showSuccess, setShowSuccess] = useState(false)
  const [errorModal, setErrorModal] = useState({ show: false, title: '', message: '' })
  const [confirmLeaveModal, setConfirmLeaveModal] = useState({ show: false, destination: '' })
  const [user, setUser] = useState(null)
  const [servicos, setServicos] = useState([])
  const [isDirty, setIsDirty] = useState(false)
  const [listaEstados, setListaEstados] = useState([])
  const [listaCidades, setListaCidades] = useState([])

  const [perfil, setPerfil] = useState({
    full_name: '', email: '', whatsapp: '', logradouro: '',
    numero: '', complemento: '', bairro: '', cidade: '', uf: '', avatar_url: ''
  })

  const inputStyle = `w-full px-5 py-4 rounded-2xl border border-slate-100 outline-none transition-all font-medium text-slate-800 bg-white shadow-sm placeholder-slate-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-50 disabled:bg-slate-50 disabled:text-slate-400 text-[14px] md:text-[15px]`

  const aplicarMascara = (valor) => {
    if (!valor) return ''
    const num = valor.replace(/\D/g, "").substring(0, 11)
    let formatado = num
    if (num.length > 2) formatado = `(${num.substring(0, 2)}) ${num.substring(2)}`
    if (num.length > 7) formatado = `(${num.substring(0, 2)}) ${num.substring(2, 7)}-${num.substring(7)}`
    return formatado
  }

  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (isDirty) { e.preventDefault(); e.returnValue = '' }
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [isDirty])

  const handleNavigation = (e, destino) => {
    e.preventDefault()
    if (isDirty) {
      setConfirmLeaveModal({ show: true, destination: destino })
    } else {
      router.push(destino)
    }
  }

  const handleChangePerfil = (field, value) => {
    setPerfil(prev => ({ ...prev, [field]: value }))
    setIsDirty(true)
  }

  const handleUploadFoto = async (event) => {
    try {
      const file = event.target.files[0]
      if (!file) return
      const MAX_MB = 10
      const sizeMB = file.size / (1024 * 1024)
      if (sizeMB > MAX_MB) {
        setErrorModal({ show: true, title: 'Imagem muito pesada', message: `A imagem tem ${sizeMB.toFixed(1)}MB. O limite é de ${MAX_MB}MB.` })
        event.target.value = ''
        return
      }
      setUploading(true)
      if (perfil.avatar_url) {
        try {
          const oldFileName = perfil.avatar_url.split('/').pop()
          if (oldFileName) await supabase.storage.from('fotos-perfil').remove([oldFileName])
        } catch {}
      }
      const fileExt = file.name.split('.').pop()
      const fileName = `${user.id}-${Date.now()}.${fileExt}`
      const { error: uploadError } = await supabase.storage.from('fotos-perfil').upload(fileName, file)
      if (uploadError) throw uploadError
      const { data: { publicUrl } } = supabase.storage.from('fotos-perfil').getPublicUrl(fileName)
      const { error: dbError } = await supabase.from('profiles').update({ avatar_url: publicUrl, updated_at: new Date().toISOString() }).eq('id', user.id)
      if (dbError) throw dbError
      setPerfil(prev => ({ ...prev, avatar_url: publicUrl }))
      setShowSuccess(true)
      setTimeout(() => setShowSuccess(false), 2000)
    } catch {
      setErrorModal({ show: true, title: 'Erro ao salvar foto', message: 'Não foi possível salvar sua foto. Verifique sua conexão.' })
    } finally { setUploading(false) }
  }

  async function buscarServicos(whatsapp) {
    if (!whatsapp) { setLoadingServicos(false); return }
    setLoadingServicos(true)
    try {
      const numLimpo = whatsapp.replace(/\D/g, '')
      const { data, error } = await supabase
        .from('portfolio_projetos')
        .select(`
          id, titulo, status, created_at, avaliacao_token,
          portfolio_fotos(ordem),
          prestadores!inner(nome, foto_perfil, categoria:categorias(nome)),
          avaliacoes(id)
        `)
        .eq('cliente_whatsapp', numLimpo)
        .in('status', ['pendente', 'em_execucao', 'finalizado', 'concluido'])
      if (error) throw error
      if (data) setServicos(data.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)))
    } catch {
      setErrorModal({ show: true, title: 'Erro ao carregar', message: 'Não foi possível buscar seus projetos. Tente recarregar a página.' })
    } finally { setLoadingServicos(false) }
  }

  useEffect(() => {
    async function carregarDados() {
      const { data: { user: sessionUser } } = await supabase.auth.getUser()
      if (!sessionUser) { router.push('/'); return }
      setUser(sessionUser)
      const { data: profileData } = await supabase.from('profiles').select('*').eq('id', sessionUser.id).maybeSingle()
      const whatsappSalvo = profileData?.whatsapp || ''
      setPerfil({
        full_name: profileData?.full_name || sessionUser.user_metadata?.full_name || '',
        avatar_url: profileData?.avatar_url || sessionUser.user_metadata?.avatar_url || '',
        email: sessionUser.email,
        whatsapp: aplicarMascara(whatsappSalvo),
        logradouro: profileData?.logradouro || '',
        numero: profileData?.numero || '',
        complemento: profileData?.complemento || '',
        bairro: profileData?.bairro || '',
        cidade: profileData?.cidade || '',
        uf: profileData?.uf || ''
      })
      buscarServicos(whatsappSalvo)
    }
    carregarDados()
    supabase.from('estados').select('sigla, nome').order('nome')
      .then(({ data }) => { if (data) setListaEstados(data) })
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (perfil.uf) {
      supabase.from('cidades').select('nome').eq('estado_sigla', perfil.uf).eq('ativa', true).order('nome')
        .then(({ data }) => { if (data) setListaCidades(data) })
    }
  }, [perfil.uf])

  const atualizar = async () => {
    setLoading(true)
    try {
      const numLimpo = perfil.whatsapp.replace(/\D/g, '')
      const { error } = await supabase.from('profiles').upsert({
        id: user.id, full_name: perfil.full_name, avatar_url: perfil.avatar_url,
        whatsapp: numLimpo, logradouro: perfil.logradouro, numero: perfil.numero,
        complemento: perfil.complemento, bairro: perfil.bairro,
        cidade: perfil.cidade, uf: perfil.uf, updated_at: new Date().toISOString()
      })
      if (error) throw error
      setIsDirty(false)
      setShowSuccess(true)
      setTimeout(() => setShowSuccess(false), 3000)
    } catch {
      setErrorModal({ show: true, title: 'Falha ao salvar', message: 'Ocorreu um problema ao registrar seus dados. Tente novamente.' })
    } finally { setLoading(false) }
  }

  // ── Status do ponto de vista do CLIENTE ──────────────────────────────────
  // IMPORTANTE: o banco mantém status = 'em_execucao' até o cliente avaliar.
  // A presença da foto 3 (ordem === 3) é o sinal de que o prestador concluiu
  // e o cliente precisa avaliar — NÃO é "em andamento", é "Avaliar agora".
  const getStatusInfo = (servico) => {
    const s = servico?.status?.toLowerCase()
    const temFoto3 = servico?.portfolio_fotos?.some(f => f.ordem === 3)
    const jaAvaliado = servico?.avaliacoes?.length > 0

    if (s === 'pendente')
      return { label: 'Aguardando aceite', dot: 'bg-amber-400', badge: 'bg-amber-50 text-amber-700 border-amber-200', urgente: false }
    if (s === 'em_execucao' && temFoto3)
      return { label: 'Avaliar agora', dot: 'bg-blue-500', badge: 'bg-blue-600 text-white border-blue-600', urgente: true }
    if (s === 'em_execucao')
      return { label: 'Em andamento', dot: 'bg-blue-400', badge: 'bg-blue-50 text-blue-700 border-blue-200', urgente: false }
    if ((s === 'finalizado' || s === 'concluido') && jaAvaliado)
      return { label: 'Concluído', dot: 'bg-green-400', badge: 'bg-green-50 text-green-700 border-green-200', urgente: false }
    if (s === 'finalizado' || s === 'concluido')
      return { label: 'Finalizado', dot: 'bg-green-400', badge: 'bg-green-50 text-green-700 border-green-200', urgente: false }
    return { label: s, dot: 'bg-slate-300', badge: 'bg-slate-50 text-slate-500 border-slate-200', urgente: false }
  }

  const getRotaDestino = (s) => {
    const temFoto3 = s.portfolio_fotos?.some(f => f.ordem === 3)
    if (s.status === 'pendente') return `/meus-servicos?token=${s.avaliacao_token}`
    if (s.status === 'em_execucao' && !temFoto3) return `/meus-servicos?token=${s.avaliacao_token}`
    return `/avaliar/${s.id}?token=${s.avaliacao_token}`
  }

  const servicosFiltrados = servicos.filter(s => {
    const st = s.status?.toLowerCase()
    const temFoto3 = s.portfolio_fotos?.some(f => f.ordem === 3)
    if (filtroStatus === 'todos') return true
    if (filtroStatus === 'pendente') return st === 'pendente'
    if (filtroStatus === 'andamento') return st === 'em_execucao' && !temFoto3
    if (filtroStatus === 'avaliar') return st === 'em_execucao' && temFoto3
    if (filtroStatus === 'finalizados') return st === 'finalizado' || st === 'concluido'
    return true
  })

  const avaliarCount = servicos.filter(s =>
    s.status === 'em_execucao' && s.portfolio_fotos?.some(f => f.ordem === 3)
  ).length
  const ativosCount = servicos.filter(s => s.status === 'pendente' || s.status === 'em_execucao').length

  return (
    <main className="min-h-screen bg-[#F8FAFC] pb-24 font-sans antialiased">
      <HeaderCliente nomeCliente={perfil.full_name} />
      <input type="file" ref={fileInputRef} onChange={handleUploadFoto} accept="image/*" className="hidden" />

      {/* Modal saída sem salvar */}
      {confirmLeaveModal.show && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-[2.5rem] w-full max-w-sm p-8 shadow-2xl border border-slate-100 text-center space-y-6 animate-in zoom-in-95">
            <div className="w-16 h-16 bg-amber-50 text-amber-500 rounded-3xl flex items-center justify-center mx-auto border border-amber-100"><AlertCircle size={32} /></div>
            <div className="space-y-2">
              <h3 className="text-xl font-black italic uppercase text-slate-800 tracking-tighter">Sair sem salvar?</h3>
              <p className="text-[13px] font-medium text-slate-500 leading-relaxed">Suas alterações serão perdidas.</p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setConfirmLeaveModal({ show: false, destination: '' })} className="flex-1 py-4 bg-slate-50 text-slate-500 rounded-2xl font-bold uppercase text-[11px] tracking-wide hover:bg-slate-100 transition-all active:scale-95">Cancelar</button>
              <button onClick={() => router.push(confirmLeaveModal.destination)} className="flex-1 py-4 bg-red-500 text-white rounded-2xl font-black uppercase text-[11px] tracking-wide hover:bg-red-600 transition-all active:scale-95 shadow-lg shadow-red-200">Sair</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de erro */}
      {errorModal.show && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-[2.5rem] w-full max-w-sm p-8 shadow-2xl border border-slate-100 text-center space-y-6 animate-in zoom-in-95">
            <div className="w-16 h-16 bg-red-50 text-red-500 rounded-3xl flex items-center justify-center mx-auto border border-red-100"><AlertCircle size={32} /></div>
            <div className="space-y-2">
              <h3 className="text-xl font-black italic uppercase text-slate-800 tracking-tighter">{errorModal.title}</h3>
              <p className="text-[13px] font-medium text-slate-500 leading-relaxed">{errorModal.message}</p>
            </div>
            <button onClick={() => setErrorModal({ ...errorModal, show: false })} className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black uppercase text-[11px] tracking-widest italic hover:bg-blue-700 transition-all active:scale-95 shadow-xl shadow-blue-100">Entendido</button>
          </div>
        </div>
      )}

      {showSuccess && (
        <div className="fixed top-20 left-0 right-0 z-[100] flex justify-center px-6 animate-in slide-in-from-top-10 duration-500">
          <div className="bg-white border border-green-100 shadow-2xl rounded-full px-6 py-3 flex items-center gap-3">
            <div className="bg-green-500 rounded-full p-1"><CheckCircle2 className="text-white" size={14} /></div>
            <p className="text-[12px] font-bold text-slate-800">Salvo com sucesso</p>
          </div>
        </div>
      )}

      <div className="max-w-xl mx-auto px-5 pt-6 space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700">

        {/* ── CTA quando há serviços para avaliar ── */}
        {avaliarCount > 0 && (
          <button
            onClick={() => { setAba('servicos'); setFiltroStatus('avaliar') }}
            className="w-full bg-blue-600 rounded-[2rem] p-5 flex items-center gap-4 active:scale-[0.98] transition-all shadow-xl shadow-blue-200 animate-in fade-in duration-500 text-left"
          >
            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center shrink-0">
              <Star size={22} className="text-white" fill="white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-black text-sm uppercase italic tracking-tight leading-none">
                {avaliarCount === 1 ? '1 serviço aguarda avaliação' : `${avaliarCount} serviços aguardam avaliação`}
              </p>
              <p className="text-blue-200 text-[11px] font-medium mt-1">Toque para avaliar e concluir</p>
            </div>
            <ArrowRight size={20} className="text-white/70 shrink-0" />
          </button>
        )}

        {/* ── Resumo ── */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white rounded-[2rem] p-5 border border-slate-100 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-xl bg-blue-50 flex items-center justify-center"><Activity size={14} className="text-blue-600" /></div>
              <p className="text-[10px] font-bold uppercase text-slate-400 tracking-widest">Ativos</p>
            </div>
            <span className="text-4xl font-black text-slate-800 leading-none">{ativosCount}</span>
            <p className="text-[11px] text-slate-400 font-medium mt-1">em andamento</p>
          </div>
          <div className="bg-white rounded-[2rem] p-5 border border-slate-100 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-xl bg-slate-50 flex items-center justify-center"><Clock size={14} className="text-slate-400" /></div>
              <p className="text-[10px] font-bold uppercase text-slate-400 tracking-widest">Histórico</p>
            </div>
            <span className="text-4xl font-black text-slate-800 leading-none">{servicos.length}</span>
            <p className="text-[11px] text-slate-400 font-medium mt-1">total de projetos</p>
          </div>
        </div>

        {/* ── Abas ── */}
        <div className="flex bg-slate-100/80 p-1.5 rounded-[2rem] gap-1">
          {[{ id: 'servicos', label: 'Meus Projetos' }, { id: 'dados', label: 'Minha Conta' }].map(a => (
            <button key={a.id} onClick={() => setAba(a.id)}
              className={`flex-1 py-3.5 rounded-[1.5rem] text-[12px] font-semibold transition-all duration-200 ${aba === a.id ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
              {a.label}
            </button>
          ))}
        </div>

        {aba === 'servicos' ? (
          <div className="space-y-4 pb-4">

            {/* Filtros */}
            <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
              {[
                { id: 'todos',       label: 'Todos' },
                { id: 'pendente',    label: 'Aceitar' },
                { id: 'andamento',   label: 'Em andamento' },
                { id: 'avaliar',     label: avaliarCount > 0 ? `Avaliar (${avaliarCount})` : 'Avaliar' },
                { id: 'finalizados', label: 'Concluídos' }
              ].map(f => (
                <button key={f.id} onClick={() => setFiltroStatus(f.id)}
                  className={`px-4 py-2 rounded-full text-[11px] font-semibold transition-all shrink-0 border whitespace-nowrap ${
                    filtroStatus === f.id
                      ? 'bg-blue-600 text-white border-blue-600 shadow-md'
                      : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
                  }`}>
                  {f.label}
                </button>
              ))}
            </div>

            {/* Lista */}
            {loadingServicos ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => <div key={i} className="h-[80px] bg-slate-100 rounded-[2rem] animate-pulse" />)}
              </div>
            ) : servicosFiltrados.length === 0 ? (
              <div className="py-20 bg-white rounded-[2.5rem] border border-slate-100 flex flex-col items-center gap-4 text-center px-10">
                <div className="w-14 h-14 rounded-full bg-slate-50 flex items-center justify-center border-2 border-dashed border-slate-200">
                  <Briefcase size={24} className="text-slate-300" />
                </div>
                <p className="text-[13px] font-medium text-slate-400">Nenhum projeto nesta categoria.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {servicosFiltrados.map(s => {
                  const info = getStatusInfo(s)
                  const rota = getRotaDestino(s)
                  return (
                    <button key={s.id} onClick={(e) => handleNavigation(e, rota)}
                      className={`w-full bg-white rounded-[2rem] border p-4 flex items-center gap-4 text-left transition-all active:scale-[0.98] group ${
                        info.urgente ? 'border-blue-200 shadow-md shadow-blue-50' : 'border-slate-100 shadow-sm hover:border-slate-200 hover:shadow-md'
                      }`}
                    >
                      {/* Avatar do prestador com dot de status */}
                      <div className={`relative w-14 h-14 rounded-2xl overflow-hidden shrink-0 ${info.urgente ? 'ring-2 ring-blue-400 ring-offset-2' : ''}`}>
                        <img src={s.prestadores?.foto_perfil || '/placeholder-avatar.png'} className="w-full h-full object-cover" alt={s.prestadores?.nome} />
                        <span className={`absolute bottom-0.5 right-0.5 w-3 h-3 rounded-full border-2 border-white ${info.dot} ${info.urgente ? 'animate-pulse' : ''}`} />
                      </div>

                      {/* Textos */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full border tracking-wider ${info.badge}`}>{info.label}</span>
                          {s.prestadores?.categoria?.nome && (
                            <span className="text-[9px] text-slate-400 truncate">{s.prestadores.categoria.nome}</span>
                          )}
                        </div>
                        <p className="text-[14px] font-bold text-slate-800 leading-tight truncate">{s.titulo}</p>
                        <p className="text-[12px] text-slate-500 truncate mt-0.5">{s.prestadores?.nome}</p>
                      </div>

                      {/* Seta */}
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition-all ${
                        info.urgente ? 'bg-blue-600 text-white' : 'bg-slate-50 text-slate-400 group-hover:bg-blue-600 group-hover:text-white'
                      }`}>
                        <ChevronRight size={16} strokeWidth={2.5} />
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </div>

        ) : (

          <div className="space-y-4 pb-12 animate-in fade-in duration-300">

            {/* Perfil card com faixa azul */}
            <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
              <div className="h-20 bg-gradient-to-r from-blue-600 to-blue-500" />
              <div className="px-8 pb-8 -mt-10 flex flex-col items-center">
                <div className="relative group cursor-pointer" onClick={() => !uploading && fileInputRef.current.click()}>
                  <div className="w-20 h-20 rounded-[1.5rem] bg-slate-100 border-4 border-white overflow-hidden shadow-xl flex items-center justify-center">
                    {uploading
                      ? <Loader2 className="animate-spin text-blue-500" size={24} />
                      : perfil.avatar_url
                        ? <img src={perfil.avatar_url} className="w-full h-full object-cover" alt="Avatar" />
                        : <User size={32} className="text-slate-300" />
                    }
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all rounded-[1.2rem] flex items-center justify-center backdrop-blur-sm">
                      <Camera size={18} className="text-white" />
                    </div>
                  </div>
                </div>
                <h2 className="text-lg font-black text-slate-800 mt-3 leading-none">{perfil.full_name || 'Sua conta'}</h2>
                <p className="text-[11px] text-slate-400 mt-1">{perfil.email}</p>
              </div>
            </div>

            {/* Formulário */}
            <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-6 md:p-8 space-y-5">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Nome Completo</label>
                <input value={perfil.full_name} onChange={e => handleChangePerfil('full_name', e.target.value)} className={inputStyle} />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">WhatsApp</label>
                <input value={perfil.whatsapp} onChange={e => handleChangePerfil('whatsapp', aplicarMascara(e.target.value))} className={inputStyle} placeholder="(00) 00000-0000" />
              </div>

              <div className="border-t border-slate-50 pt-5 space-y-4">
                <div className="flex items-center gap-2">
                  <MapPin size={14} className="text-blue-600" />
                  <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Endereço</h3>
                </div>
                <div className="flex gap-3">
                  <div className="flex-[3]">
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Logradouro</label>
                    <input placeholder="Rua / Avenida" value={perfil.logradouro} onChange={e => handleChangePerfil('logradouro', e.target.value)} className={inputStyle} />
                  </div>
                  <div className="w-24 shrink-0">
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Nº</label>
                    <input placeholder="123" value={perfil.numero} onChange={e => handleChangePerfil('numero', e.target.value)} className={inputStyle} />
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="flex-1">
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Bairro</label>
                    <input placeholder="Centro" value={perfil.bairro} onChange={e => handleChangePerfil('bairro', e.target.value)} className={inputStyle} />
                  </div>
                  <div className="flex-1">
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Complemento</label>
                    <input placeholder="Apto 12" value={perfil.complemento} onChange={e => handleChangePerfil('complemento', e.target.value)} className={inputStyle} />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">UF</label>
                    <select value={perfil.uf} onChange={e => handleChangePerfil('uf', e.target.value)} className={inputStyle}>
                      <option value="">--</option>
                      {listaEstados.map(e => <option key={e.sigla} value={e.sigla}>{e.sigla}</option>)}
                    </select>
                  </div>
                  <div className="col-span-2">
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Cidade</label>
                    <select disabled={!perfil.uf} value={perfil.cidade} onChange={e => handleChangePerfil('cidade', e.target.value)} className={inputStyle}>
                      <option value="">Selecione...</option>
                      {listaCidades.map(c => <option key={c.nome} value={c.nome}>{c.nome}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              {isDirty && !showSuccess && (
                <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest flex items-center justify-center gap-1.5 animate-in fade-in duration-300">
                  <AlertCircle size={12} /> Alterações não salvas
                </p>
              )}
              <button onClick={atualizar} disabled={loading}
                className="w-full py-5 bg-blue-600 text-white rounded-2xl font-black italic uppercase text-[11px] tracking-widest shadow-lg hover:bg-blue-700 active:scale-95 transition-all flex items-center justify-center gap-3 shadow-blue-100 disabled:opacity-60">
                {loading ? <Loader2 size={18} className="animate-spin" /> : <><Save size={18} /> Salvar alterações</>}
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}