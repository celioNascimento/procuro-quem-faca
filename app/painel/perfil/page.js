'use client'
import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link' 
import { 
  MapPin, User, ChevronRight, Briefcase, X, Loader2, Camera, CheckCircle2, 
  Save, Activity, Clock, AlertCircle
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

  // Proteção de F5 / fechar aba
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (isDirty) { e.preventDefault(); e.returnValue = '' }
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [isDirty])

  // Interceptador de navegação interna com alterações não salvas
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

      // Validação de tamanho: máx 10MB, erro visível ao usuário
      const MAX_MB = 10
      const sizeMB = file.size / (1024 * 1024)
      if (sizeMB > MAX_MB) {
        setErrorModal({
          show: true,
          title: 'Imagem muito pesada',
          message: `A imagem tem ${sizeMB.toFixed(1)}MB. O limite é de ${MAX_MB}MB. Reduza o tamanho e tente novamente.`
        })
        event.target.value = ''
        return
      }

      setUploading(true)

      // Remover foto antiga do storage
      if (perfil.avatar_url) {
        try {
          const urlParts = perfil.avatar_url.split('/')
          const oldFileName = urlParts[urlParts.length - 1]
          if (oldFileName) await supabase.storage.from('fotos-perfil').remove([oldFileName])
        } catch (removeError) {
          console.warn("Aviso: foto antiga não removida", removeError)
        }
      }

      const fileExt = file.name.split('.').pop()
      const fileName = `${user.id}-${Date.now()}.${fileExt}`

      const { error: uploadError } = await supabase.storage.from('fotos-perfil').upload(fileName, file)
      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage.from('fotos-perfil').getPublicUrl(fileName)

      const { error: dbError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl, updated_at: new Date().toISOString() })
        .eq('id', user.id)

      if (dbError) throw dbError

      setPerfil(prev => ({ ...prev, avatar_url: publicUrl }))
      setShowSuccess(true)
      setTimeout(() => setShowSuccess(false), 2000)

    } catch (error) {
      console.error("Erro upload foto perfil:", error)
      setErrorModal({
        show: true,
        title: 'Erro ao salvar foto',
        message: 'Não foi possível salvar sua foto. Verifique sua conexão e tente novamente.'
      })
    } finally {
      setUploading(false)
    }
  }

  // buscarServicos: inclui portfolio_fotos para detectar "Aguardando Avaliação"
  async function buscarServicos(whatsapp) {
    if (!whatsapp) return
    try {
      const numLimpo = whatsapp.replace(/\D/g, '')
      const { data, error } = await supabase
        .from('portfolio_projetos')
        .select(`
          id, titulo, status, created_at, avaliacao_token, cliente_whatsapp,
          prestadores!inner(nome, foto_perfil, whatsapp, categoria:categorias(nome)),
          avaliacoes(id),
          portfolio_fotos(ordem)
        `)
        .eq('cliente_whatsapp', numLimpo)
        .in('status', ['pendente', 'em_execucao', 'finalizado', 'concluido'])

      if (error) throw error
      if (data) {
        const ordenados = data.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        setServicos(ordenados)
      }
    } catch (err) {
      console.error("Erro ao buscar serviços:", err)
      // Falha silenciosa aceitável — não bloqueia o carregamento da página
    }
  }

  useEffect(() => {
    async function carregarDados() {
      const { data: { user: sessionUser } } = await supabase.auth.getUser()
      if (!sessionUser) { router.push('/'); return }

      setUser(sessionUser)
      const { data: profileData } = await supabase
        .from('profiles').select('*').eq('id', sessionUser.id).maybeSingle()

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
    carregarDados()
    supabase.from('estados').select('sigla, nome').order('nome')
      .then(({ data }) => data && setListaEstados(data))
  }, [])

  useEffect(() => {
    if (perfil.uf) {
      supabase.from('cidades').select('nome')
        .eq('estado_sigla', perfil.uf).eq('ativa', true).order('nome')
        .then(({ data }) => data && setListaCidades(data))
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
      setIsDirty(false)
      setShowSuccess(true)
      setTimeout(() => setShowSuccess(false), 3000)
    } catch (err) {
      console.error("Erro ao salvar perfil:", err)
      setErrorModal({
        show: true,
        title: 'Falha ao salvar',
        message: 'Não foi possível registrar seus dados. Verifique sua conexão e tente novamente.'
      })
    } finally { setLoading(false) }
  }

  // getStatusInfo: detecta "Avaliar agora" quando em_execucao + foto_3 enviada.
  // Espelha a mesma lógica do PortfolioDashboardTab (lado do prestador) para consistência.
  const getStatusInfo = (servico) => {
    const s = servico.status?.toLowerCase()
    const jaAvaliado = servico.avaliacoes?.length > 0
    const temFoto3 = servico.portfolio_fotos?.some(f => f.ordem === 3)

    if (s === 'pendente')
      return { label: 'Aguardando aceite', color: 'bg-amber-50 text-amber-600 border-amber-100' }

    if (s === 'em_execucao' && temFoto3)
      return { label: 'Avaliar agora', color: 'bg-blue-50 text-blue-700 border-blue-200 animate-pulse' }

    if (s === 'em_execucao')
      return { label: 'Em andamento', color: 'bg-blue-50 text-blue-600 border-blue-100' }

    if (s === 'finalizado' || s === 'concluido')
      return jaAvaliado
        ? { label: 'Concluído',             color: 'bg-green-50 text-green-600 border-green-100' }
        : { label: 'Aguardando avaliação',  color: 'bg-amber-50 text-amber-600 border-amber-100 animate-pulse' }

    return { label: servico.status, color: 'bg-slate-50 text-slate-600 border-slate-100' }
  }

  // Rota destino: pendente → aceitar via /meus-servicos; todo o resto → /avaliar
  const getRotaDestino = (s) => {
    if (s.status?.toLowerCase() === 'pendente')
      return `/meus-servicos?token=${s.avaliacao_token}`
    return `/avaliar/${s.id}?token=${s.avaliacao_token}`
  }

  const servicosFiltrados = servicos.filter(s => {
    const status = s.status?.toLowerCase()
    if (filtroStatus === 'todos') return true
    if (filtroStatus === 'pendente') return status === 'pendente'
    if (filtroStatus === 'em_progresso') return status === 'em_execucao'
    if (filtroStatus === 'finalizados') return status === 'finalizado' || status === 'concluido'
    return true
  })

  // Ativos = pendente + em andamento (inclui aguardando avaliação — ainda não fechados)
  const servicosAtivosCount = servicos.filter(
    s => s.status === 'pendente' || s.status === 'em_execucao'
  ).length

  return (
    <main className="min-h-screen bg-[#FDFDFD] pb-24 font-sans antialiased text-slate-600">
      {/* Nome completo sem split — consistente com os outros componentes */}
      <HeaderCliente nomeCliente={perfil.full_name} />

      <input type="file" ref={fileInputRef} onChange={handleUploadFoto} accept="image/*" className="hidden" />

      {/* Modal de confirmação de saída com alterações não salvas */}
      {confirmLeaveModal.show && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-[2.5rem] w-full max-w-sm p-8 shadow-2xl border border-slate-100 text-center space-y-6 animate-in zoom-in-95">
            <div className="w-16 h-16 bg-amber-50 text-amber-500 rounded-3xl flex items-center justify-center mx-auto border border-amber-100/50">
              <AlertCircle size={32} />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-black italic uppercase text-slate-800 leading-none tracking-tighter">Sair sem salvar?</h3>
              <p className="text-[13px] font-medium text-slate-500 leading-relaxed">Você tem alterações pendentes. Se sair agora, elas serão perdidas.</p>
            </div>
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setConfirmLeaveModal({ show: false, destination: '' })}
                className="flex-1 py-4 bg-slate-50 text-slate-500 rounded-2xl font-bold uppercase text-[11px] tracking-[0.1em] hover:bg-slate-100 transition-all active:scale-95"
              >
                Cancelar
              </button>
              <button
                onClick={() => router.push(confirmLeaveModal.destination)}
                className="flex-1 py-4 bg-red-500 text-white rounded-2xl font-black uppercase text-[11px] tracking-[0.1em] hover:bg-red-600 transition-all active:scale-95 shadow-lg shadow-red-500/30"
              >
                Sair mesmo assim
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de erro */}
      {errorModal.show && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-[2.5rem] w-full max-w-sm p-8 shadow-2xl border border-slate-100 text-center space-y-6 animate-in zoom-in-95">
            <div className="w-16 h-16 bg-red-50 text-red-500 rounded-3xl flex items-center justify-center mx-auto border border-red-100/50">
              <AlertCircle size={32} />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-black italic uppercase text-slate-800 leading-none tracking-tighter">{errorModal.title}</h3>
              <p className="text-[13px] font-medium text-slate-500 leading-relaxed">{errorModal.message}</p>
            </div>
            <button
              onClick={() => setErrorModal({ ...errorModal, show: false })}
              className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black uppercase text-[11px] tracking-[0.2em] italic hover:bg-blue-700 transition-all active:scale-95 shadow-xl shadow-blue-100"
            >
              Entendido
            </button>
          </div>
        </div>
      )}

      {showSuccess && (
        <div className="fixed top-20 md:top-24 left-0 right-0 z-[100] flex justify-center px-6 animate-in slide-in-from-top-10 duration-500">
          <div className="bg-white border-2 border-green-50 shadow-2xl rounded-full px-6 py-3 flex items-center gap-3">
            <div className="bg-green-500 rounded-full p-1"><CheckCircle2 className="text-white" size={14} /></div>
            <p className="text-[12px] font-bold text-slate-800 leading-none">Salvo com sucesso</p>
          </div>
        </div>
      )}

      <div className="max-w-xl mx-auto px-5 md:px-6 pt-8 md:pt-10 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">

        {/* Cards de resumo */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white p-5 md:p-6 rounded-[2.5rem] border border-slate-50 shadow-sm flex flex-col justify-center">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-[1rem] bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
                <Activity size={16} />
              </div>
              <p className="text-[11px] font-semibold uppercase text-slate-500 tracking-wider">Em aberto</p>
            </div>
            <div className="flex items-baseline gap-1.5 truncate">
              <span className="text-3xl md:text-4xl font-black text-slate-800 leading-none">{servicosAtivosCount}</span>
              <span className="text-xs md:text-sm font-medium text-slate-400 truncate">Projetos</span>
            </div>
          </div>

          <div className="bg-white p-5 md:p-6 rounded-[2.5rem] border border-slate-50 shadow-sm flex flex-col justify-center">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-[1rem] bg-slate-50 flex items-center justify-center text-slate-400 shrink-0">
                <Clock size={16} />
              </div>
              <p className="text-[11px] font-semibold uppercase text-slate-500 tracking-wider">Histórico</p>
            </div>
            <div className="flex items-baseline gap-1.5 truncate">
              <span className="text-3xl md:text-4xl font-black text-slate-800 leading-none">{servicos.length}</span>
              <span className="text-xs md:text-sm font-medium text-slate-400 truncate">Total</span>
            </div>
          </div>
        </div>

        {/* Abas */}
        <div className="flex bg-slate-100/60 p-1.5 rounded-[2.5rem] border border-slate-100">
          <button onClick={() => setAba('servicos')} className={`flex-1 py-3.5 md:py-4 rounded-[2rem] text-[12px] md:text-[13px] font-semibold transition-all duration-300 ${aba === 'servicos' ? 'bg-white text-blue-600 shadow-sm scale-[1.01]' : 'text-slate-500'}`}>
            Meus Projetos
          </button>
          <button onClick={() => setAba('dados')} className={`flex-1 py-3.5 md:py-4 rounded-[2rem] text-[12px] md:text-[13px] font-semibold transition-all duration-300 ${aba === 'dados' ? 'bg-white text-blue-600 shadow-sm scale-[1.01]' : 'text-slate-500'}`}>
            Dados da Conta
          </button>
        </div>

        {aba === 'servicos' ? (
          <div className="space-y-6">
            {/* Filtros */}
            <div className="flex items-center gap-2 overflow-x-auto pb-4 -mx-4 px-4 custom-scrollbar">
              {[
                { id: 'todos',        label: 'Todos' },
                { id: 'pendente',     label: 'Aguardando' },
                { id: 'em_progresso', label: 'Em andamento' },
                { id: 'finalizados',  label: 'Concluídos' }
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => setFiltroStatus(f.id)}
                  className={`px-5 py-2.5 md:px-6 md:py-3 rounded-full text-[11px] md:text-[12px] font-medium transition-all shrink-0 border ${
                    filtroStatus === f.id
                      ? 'bg-blue-600 text-white border-blue-600 shadow-md'
                      : 'bg-white text-slate-500 border-slate-100 hover:border-slate-200'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* Lista de serviços */}
            <div className="space-y-5">
              {servicosFiltrados.length === 0 ? (
                <div className="py-24 bg-white rounded-[3rem] border border-slate-50 shadow-sm flex flex-col items-center gap-5 text-center px-10">
                  <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center text-slate-300 border-2 border-dashed border-slate-200">
                    <Briefcase size={28} />
                  </div>
                  <p className="text-[13px] font-medium text-slate-400 leading-relaxed">Nenhum projeto encontrado nesta categoria.</p>
                </div>
              ) : (
                servicosFiltrados.map((s) => {
                  const statusInfo = getStatusInfo(s)
                  const rotaDestino = getRotaDestino(s)
                  const precisaAvaliar = s.status === 'em_execucao' && s.portfolio_fotos?.some(f => f.ordem === 3)

                  return (
                    <div
                      key={s.id}
                      className={`bg-white p-5 md:p-6 rounded-[2.5rem] md:rounded-[3rem] border shadow-sm flex items-center group relative overflow-hidden transition-all active:scale-[0.99] ${
                        precisaAvaliar
                          ? 'border-blue-200 hover:border-blue-300 shadow-blue-50'
                          : 'border-slate-50 hover:border-blue-100'
                      }`}
                    >
                      <div className="flex items-center gap-4 md:gap-5 flex-1 min-w-0 pr-14 md:pr-20">
                        <div className="w-14 h-14 md:w-16 md:h-16 rounded-[1.2rem] md:rounded-[1.5rem] bg-slate-100 overflow-hidden shrink-0 shadow-inner">
                          <img
                            src={s.prestadores?.foto_perfil || '/placeholder-avatar.png'}
                            className="w-full h-full object-cover grayscale-[20%] group-hover:grayscale-0 transition-all duration-500"
                            alt={s.prestadores?.nome}
                          />
                        </div>
                        <div className="flex-1 min-w-0 flex flex-col justify-center">
                          <div className="flex items-center mb-1">
                            <span className={`text-[9px] md:text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full tracking-wider border ${statusInfo.color}`}>
                              {statusInfo.label}
                            </span>
                          </div>
                          <h3 className="text-[15px] md:text-base font-bold text-slate-800 leading-tight mb-0.5 truncate">{s.titulo}</h3>
                          <p className="text-[12px] md:text-[13px] font-medium text-slate-500 truncate">{s.prestadores?.nome}</p>
                        </div>
                      </div>
                      <div className="absolute right-5 md:right-6">
                        <button
                          onClick={(e) => handleNavigation(e, rotaDestino)}
                          className={`w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center border transition-all shadow-sm ${
                            precisaAvaliar
                              ? 'bg-blue-600 text-white border-blue-600 shadow-blue-100 animate-pulse'
                              : 'bg-slate-50 text-slate-400 border-slate-100 group-hover:bg-blue-600 group-hover:text-white'
                          }`}
                        >
                          <ChevronRight size={18} strokeWidth={2.5} />
                        </button>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500 pb-12">
            {/* Foto de perfil */}
            <section className="bg-white rounded-[3rem] p-8 md:p-10 border border-slate-50 shadow-sm flex flex-col items-center relative overflow-hidden">
              <div className="relative group cursor-pointer" onClick={() => !uploading && fileInputRef.current.click()}>
                <div className="w-28 h-28 md:w-32 md:h-32 rounded-[2.5rem] md:rounded-[3rem] bg-slate-50 border-4 border-white overflow-hidden shadow-xl flex items-center justify-center relative">
                  {uploading
                    ? <Loader2 className="animate-spin text-blue-500" />
                    : perfil.avatar_url
                      ? <img src={perfil.avatar_url} className="w-full h-full object-cover" alt="Avatar" />
                      : <User size={40} className="text-slate-200" />
                  }
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center text-white backdrop-blur-sm">
                    <Camera size={20} />
                  </div>
                </div>
              </div>
              <div className="mt-5 text-center">
                <h2 className="text-xl md:text-2xl font-bold text-slate-800 leading-none">{perfil.full_name || 'Sua Conta'}</h2>
                <p className="text-[12px] font-medium text-slate-500 mt-2">Clique na foto para atualizar</p>
              </div>
            </section>

            {/* Formulário */}
            <div className="bg-white rounded-[3rem] p-7 md:p-10 border border-slate-50 shadow-sm space-y-8">
              <div className="space-y-5">
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 ml-2 mb-1.5">Nome Completo</label>
                  <input value={perfil.full_name} onChange={e => handleChangePerfil('full_name', e.target.value)} className={inputStyle} />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 ml-2 mb-1.5">WhatsApp</label>
                  <input value={perfil.whatsapp} onChange={e => handleChangePerfil('whatsapp', aplicarMascara(e.target.value))} className={inputStyle} />
                </div>
              </div>

              <div className="pt-8 border-t border-slate-50 space-y-6">
                <h3 className="font-bold text-[14px] text-slate-800 flex items-center gap-2 px-1">
                  <MapPin size={18} className="text-blue-600" /> Endereço de Referência
                </h3>

                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-[3]">
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 ml-2 mb-1.5">Logradouro</label>
                    <input placeholder="Rua / Avenida" value={perfil.logradouro} onChange={e => handleChangePerfil('logradouro', e.target.value)} className={inputStyle} />
                  </div>
                  <div className="md:w-32 shrink-0">
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 ml-2 mb-1.5">Nº</label>
                    <input placeholder="Ex: 123" value={perfil.numero} onChange={e => handleChangePerfil('numero', e.target.value)} className={inputStyle} />
                  </div>
                </div>

                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1">
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 ml-2 mb-1.5">Bairro</label>
                    <input placeholder="Ex: Centro" value={perfil.bairro} onChange={e => handleChangePerfil('bairro', e.target.value)} className={inputStyle} />
                  </div>
                  <div className="flex-1">
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 ml-2 mb-1.5">Complemento</label>
                    <input placeholder="Ex: Apto 12" value={perfil.complemento} onChange={e => handleChangePerfil('complemento', e.target.value)} className={inputStyle} />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-1">
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 ml-2 mb-1.5">UF</label>
                    <select value={perfil.uf} onChange={e => handleChangePerfil('uf', e.target.value)} className={inputStyle}>
                      <option value="">--</option>
                      {listaEstados.map(e => <option key={e.sigla} value={e.sigla}>{e.sigla}</option>)}
                    </select>
                  </div>
                  <div className="col-span-2">
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 ml-2 mb-1.5">Cidade</label>
                    <select disabled={!perfil.uf} value={perfil.cidade} onChange={e => handleChangePerfil('cidade', e.target.value)} className={inputStyle}>
                      <option value="">Selecione...</option>
                      {listaCidades.map(c => <option key={c.nome} value={c.nome}>{c.nome}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              <div>
                {isDirty && !showSuccess && (
                  <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest text-center mb-4 flex items-center justify-center gap-1.5 animate-in fade-in duration-300">
                    <AlertCircle size={14} /> Você tem alterações não salvas
                  </p>
                )}
                <button
                  onClick={atualizar}
                  disabled={loading}
                  className="w-full py-5 md:py-6 bg-blue-600 text-white rounded-[2rem] md:rounded-[2.5rem] font-black italic uppercase text-[11px] tracking-[0.2em] shadow-xl hover:bg-blue-700 active:scale-95 transition-all flex items-center justify-center gap-3 shadow-blue-100"
                >
                  {loading ? <Loader2 size={20} className="animate-spin" /> : <><Save size={20} /> Salvar Alterações</>}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}