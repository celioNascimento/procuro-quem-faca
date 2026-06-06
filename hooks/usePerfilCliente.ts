import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import * as ClienteService from '@/lib/services/cliente.service'

const aplicarMascara = (valor: string) => {
  if (!valor) return ''
  const num = valor.replace(/\D/g, "").substring(0, 11)
  let formatado = num
  if (num.length > 2) formatado = `(${num.substring(0, 2)}) ${num.substring(2)}`
  if (num.length > 7) formatado = `(${num.substring(0, 2)}) ${num.substring(2, 7)}-${num.substring(7)}`
  return formatado
}

export function usePerfilCliente() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [aba, setAba] = useState('servicos')
  const [filtroStatus, setFiltroStatus] = useState('todos')
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [loadingServicos, setLoadingServicos] = useState(true)
  const [showSuccess, setShowSuccess] = useState(false)
  const [errorModal, setErrorModal] = useState({ show: false, title: '', message: '' })
  const [confirmLeaveModal, setConfirmLeaveModal] = useState({ show: false, destination: '' })
  const [deleteModal, setDeleteModal] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')
  const [deleting, setDeleting] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [servicos, setServicos] = useState<any[]>([])
  const [isDirty, setIsDirty] = useState(false)
  const [listaEstados, setListaEstados] = useState<any[]>([])
  const [listaCidades, setListaCidades] = useState<any[]>([])

  const [perfil, setPerfil] = useState({
    full_name: '', email: '', whatsapp: '', logradouro: '',
    numero: '', complemento: '', bairro: '', cidade: '', uf: '', avatar_url: ''
  })

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) { e.preventDefault(); e.returnValue = '' }
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [isDirty])

  const handleNavigation = (e: React.MouseEvent, destino: string) => {
    e.preventDefault()
    if (isDirty) {
      setConfirmLeaveModal({ show: true, destination: destino })
    } else {
      router.push(destino)
    }
  }

  const handleChangePerfil = (field: string, value: string) => {
    setPerfil(prev => ({ ...prev, [field]: value }))
    setIsDirty(true)
  }

  const handleUploadFoto = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const file = event.target.files?.[0]
      if (!file) return
      const MAX_MB = 10
      const sizeMB = file.size / (1024 * 1024)
      if (sizeMB > MAX_MB) {
        setErrorModal({ show: true, title: 'Imagem muito pesada', message: `A imagem tem ${sizeMB.toFixed(1)}MB. O limite é de ${MAX_MB}MB.` })
        event.target.value = ''
        return
      }
      setUploading(true)
      
      const publicUrl = await ClienteService.uploadClienteAvatar(user.id, file, perfil.avatar_url)
      
      setPerfil(prev => ({ ...prev, avatar_url: publicUrl }))
      setShowSuccess(true)
      setTimeout(() => setShowSuccess(false), 2000)
    } catch {
      setErrorModal({ show: true, title: 'Erro ao salvar foto', message: 'Não foi possível salvar sua foto. Verifique sua conexão.' })
    } finally { setUploading(false) }
  }

  async function buscarServicos(whatsapp: string) {
    if (!whatsapp) { setLoadingServicos(false); return }
    setLoadingServicos(true)
    try {
      const data = await ClienteService.fetchClienteServicos(whatsapp)
      if (data) setServicos(data.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()))
    } catch {
      setErrorModal({ show: true, title: 'Erro ao carregar', message: 'Não foi possível buscar seus projetos. Tente recarregar a página.' })
    } finally { setLoadingServicos(false) }
  }

  useEffect(() => {
    async function carregarDados() {
      const { data: { user: sessionUser } } = await supabase.auth.getUser()
      if (!sessionUser) { router.push('/'); return }
      setUser(sessionUser)
      
      const profileData = await ClienteService.fetchClienteProfile(sessionUser.id)
      const whatsappSalvo = profileData?.whatsapp || ''
      const googleAvatar = sessionUser.user_metadata?.avatar_url || ''
      
      await ClienteService.ensureGoogleAvatarProfile(sessionUser.id, googleAvatar, profileData?.avatar_url)

      setPerfil({
        full_name: profileData?.full_name || sessionUser.user_metadata?.full_name || '',
        avatar_url: profileData?.avatar_url || sessionUser.user_metadata?.avatar_url || '',
        email: sessionUser.email || '',
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
    
    ClienteService.fetchEstados()
      .then((data) => { if (data) setListaEstados(data) })
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (perfil.uf) {
      ClienteService.fetchCidades(perfil.uf)
        .then((data) => { if (data) setListaCidades(data) })
        .catch(() => {})
    }
  }, [perfil.uf])

  const atualizar = async () => {
    const numLimpo = perfil.whatsapp.replace(/\D/g, '')
    if (perfil.whatsapp && (numLimpo.length < 10 || numLimpo.length > 11)) {
      setErrorModal({
        show: true,
        title: 'Telefone inválido',
        message: 'O WhatsApp precisa ter 10 ou 11 dígitos. Verifique o número e tente novamente.'
      })
      return
    }
    setLoading(true)
    try {
      await ClienteService.updateClienteProfile(user.id, {
        full_name: perfil.full_name, avatar_url: perfil.avatar_url,
        whatsapp: numLimpo, logradouro: perfil.logradouro, numero: perfil.numero,
        complemento: perfil.complemento, bairro: perfil.bairro,
        cidade: perfil.cidade, uf: perfil.uf
      })
      setIsDirty(false)
      setShowSuccess(true)
      setTimeout(() => setShowSuccess(false), 3000)
    } catch {
      setErrorModal({ show: true, title: 'Falha ao salvar', message: 'Ocorreu um problema ao registrar seus dados. Tente novamente.' })
    } finally { setLoading(false) }
  }

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'EXCLUIR' || !user) return
    setDeleting(true)
    try {
      await ClienteService.deleteClienteAccount(user.id, perfil.whatsapp)
      window.location.href = '/?conta=excluida'
    } catch {
      setErrorModal({ show: true, title: 'Erro ao excluir', message: 'Não foi possível excluir sua conta agora. Tente novamente ou entre em contato.' })
      setDeleting(false)
    }
  }

  const getStatusInfo = (servico: any) => {
    const s = servico?.status?.toLowerCase()
    const temFoto3 = servico?.portfolio_fotos?.some((f: any) => f.ordem === 3)
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

  const getRotaDestino = (s: any) => {
    const temFoto3 = s.portfolio_fotos?.some((f: any) => f.ordem === 3)
    if (s.status === 'pendente') return `/meus-servicos?token=${s.avaliacao_token}`
    if (s.status === 'em_execucao' && !temFoto3) return `/meus-servicos?token=${s.avaliacao_token}`
    return `/avaliar/${s.id}?token=${s.avaliacao_token}`
  }

  const servicosFiltrados = servicos.filter(s => {
    const st = s.status?.toLowerCase()
    const temFoto3 = s.portfolio_fotos?.some((f: any) => f.ordem === 3)
    if (filtroStatus === 'todos') return true
    if (filtroStatus === 'pendente') return st === 'pendente'
    if (filtroStatus === 'andamento') return st === 'em_execucao' && !temFoto3
    if (filtroStatus === 'avaliar') return st === 'em_execucao' && temFoto3
    if (filtroStatus === 'finalizados') return st === 'finalizado' || st === 'concluido'
    return true
  })

  const avaliarCount = servicos.filter(s =>
    s.status === 'em_execucao' && s.portfolio_fotos?.some((f: any) => f.ordem === 3)
  ).length
  const ativosCount = servicos.filter(s => s.status === 'pendente' || s.status === 'em_execucao').length

  const confirmarSaida = () => {
    if (confirmLeaveModal.destination) {
      router.push(confirmLeaveModal.destination)
    }
  }

  const cancelarSaida = () => setConfirmLeaveModal({ show: false, destination: '' })

  return {
    router,
    fileInputRef,
    aba, setAba,
    filtroStatus, setFiltroStatus,
    loading,
    uploading,
    loadingServicos,
    showSuccess,
    errorModal, setErrorModal,
    confirmLeaveModal, confirmarSaida, cancelarSaida,
    deleteModal, setDeleteModal,
    deleteConfirmText, setDeleteConfirmText,
    deleting,
    servicos,
    isDirty,
    listaEstados,
    listaCidades,
    perfil,
    aplicarMascara,
    handleNavigation,
    handleChangePerfil,
    handleUploadFoto,
    atualizar,
    handleDeleteAccount,
    getStatusInfo,
    getRotaDestino,
    servicosFiltrados,
    avaliarCount,
    ativosCount
  }
}