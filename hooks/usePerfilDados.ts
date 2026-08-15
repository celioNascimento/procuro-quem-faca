//hooks/usePerfilDados.ts

'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import * as ClienteService from '@/lib/services/cliente.service'

const aplicarMascara = (valor: string) => {
  if (!valor) return ''
  const num = valor.replace(/\D/g, '').substring(0, 11)
  let formatado = num
  if (num.length > 2) formatado = `(${num.substring(0, 2)}) ${num.substring(2)}`
  if (num.length > 7) formatado = `(${num.substring(0, 2)}) ${num.substring(2, 7)}-${num.substring(7)}`
  return formatado
}

export { aplicarMascara }

export function usePerfilDados() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [isDirty, setIsDirty] = useState(false)
  const [listaEstados, setListaEstados] = useState<any[]>([])
  const [listaCidades, setListaCidades] = useState<any[]>([])
  const [errorModal, setErrorModal] = useState({ show: false, title: '', message: '' })

  // Indica se já sabemos, com certeza, os dados do perfil (whatsapp incluso).
  // Enquanto for `false`, qualquer hook dependente (ex: useServicosCliente)
  // deve continuar em estado de loading, e não assumir "sem dado" por engano.
  const [perfilCarregado, setPerfilCarregado] = useState(false)

  const [perfil, setPerfil] = useState({
    full_name: '', email: '', whatsapp: '', logradouro: '',
    numero: '', complemento: '', bairro: '', cidade: '', uf: '', avatar_url: '',
  })

  useEffect(() => {
    let cancelado = false
    let jaCarregou = false

    async function processarUsuario(sessionUser: any) {
      if (cancelado || jaCarregou) return
      jaCarregou = true
      clearTimeout(timeoutSemSessao)

      setUser(sessionUser)

      try {
        const profileData = await ClienteService.fetchClienteProfile(sessionUser.id)
        if (cancelado) return

        const googleAvatar = sessionUser.user_metadata?.picture
          || sessionUser.user_metadata?.avatar_url
          || ''
        const avatarFinal = profileData?.avatar_url || googleAvatar

        setPerfil({
          full_name: profileData?.full_name || sessionUser.user_metadata?.full_name || '',
          avatar_url: avatarFinal,
          email: sessionUser.email || '',
          whatsapp: aplicarMascara(profileData?.whatsapp || ''),
          logradouro: profileData?.logradouro || '',
          numero: profileData?.numero || '',
          complemento: profileData?.complemento || '',
          bairro: profileData?.bairro || '',
          cidade: profileData?.cidade || '',
          uf: profileData?.uf || '',
        })

        // Salva foto do Google no banco se ainda não tiver avatar próprio.
        // Efeito colateral que não deve bloquear a liberação de perfilCarregado.
        if (!profileData?.avatar_url && googleAvatar) {
          ClienteService.updateClienteProfile(sessionUser.id, { avatar_url: googleAvatar }).catch(() => { })
        }
      } catch {
        // Falha ao buscar o perfil (ex: erro de rede). Não travamos o usuário:
        // seguimos com os dados básicos da sessão e liberamos perfilCarregado
        // no finally, para que a UI dependente (ex: anúncio) não fique presa
        // em loading para sempre.
        if (!cancelado) {
          setPerfil(prev => ({
            ...prev,
            email: sessionUser.email || '',
            full_name: prev.full_name || sessionUser.user_metadata?.full_name || '',
          }))
        }
      } finally {
        if (!cancelado) setPerfilCarregado(true)
      }
    }

    // 1) Verifica se já existe uma sessão pronta (caso comum: já estava logado)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!cancelado && session?.user) processarUsuario(session.user)
    })

    // 2) Escuta o momento em que o login termina de ser processado
    //    (caso do redirecionamento vindo do Google, que demora um instante)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!cancelado && session?.user) processarUsuario(session.user)
    })

    // 3) Rede de segurança: se depois de 2s ainda não achou nenhuma sessão,
    //    aí sim consideramos que o usuário não está logado de verdade
    const timeoutSemSessao = setTimeout(() => {
      if (!cancelado && !jaCarregou) {
        setPerfilCarregado(true)
        router.push('/')
      }
    }, 2000)

    ClienteService.fetchEstados()
      .then(data => { if (data) setListaEstados(data) })
      .catch(() => { })

    return () => {
      cancelado = true
      clearTimeout(timeoutSemSessao)
      subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    if (perfil.uf) {
      ClienteService.fetchCidades(perfil.uf)
        .then(data => { if (data) setListaCidades(data) })
        .catch(() => { })
    }
  }, [perfil.uf])

  const handleChangePerfil = (field: string, value: string) => {
    setPerfil(prev => ({ ...prev, [field]: value }))
    setIsDirty(true)
  }

  const handleUploadFoto = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const file = event.target.files?.[0]
      if (!file) return
      const sizeMB = file.size / (1024 * 1024)
      if (sizeMB > 10) {
        setErrorModal({ show: true, title: 'Imagem muito pesada', message: `A imagem tem ${sizeMB.toFixed(1)}MB. O limite é de 10MB.` })
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
    } finally {
      setUploading(false)
    }
  }

  const atualizar = async () => {
    const numLimpo = perfil.whatsapp.replace(/\D/g, '')
    if (perfil.whatsapp && (numLimpo.length < 10 || numLimpo.length > 11)) {
      setErrorModal({ show: true, title: 'Telefone inválido', message: 'O WhatsApp precisa ter 10 ou 11 dígitos.' })
      return
    }
    setLoading(true)
    try {
      await ClienteService.updateClienteProfile(user.id, {
        full_name: perfil.full_name, avatar_url: perfil.avatar_url,
        whatsapp: numLimpo, logradouro: perfil.logradouro, numero: perfil.numero,
        complemento: perfil.complemento, bairro: perfil.bairro,
        cidade: perfil.cidade, uf: perfil.uf,
      })
      setIsDirty(false)
      setShowSuccess(true)
      setTimeout(() => setShowSuccess(false), 3000)
    } catch {
      setErrorModal({ show: true, title: 'Falha ao salvar', message: 'Ocorreu um problema ao registrar seus dados. Tente novamente.' })
    } finally {
      setLoading(false)
    }
  }

  return {
    fileInputRef,
    user,
    perfil,
    isDirty,
    loading,
    uploading,
    showSuccess,
    listaEstados,
    listaCidades,
    errorModal, setErrorModal,
    perfilCarregado,
    aplicarMascara,
    handleChangePerfil,
    handleUploadFoto,
    atualizar,
  }
}
