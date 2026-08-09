'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import type { User } from '@supabase/supabase-js'

import { usePrestadorForm } from '@/hooks/usePrestadorForm'
import { useCategorias } from '@/hooks/useCategorias'
import { useLocalizacao } from '@/hooks/useLocalizacao'
import { useSlugCheck } from '@/hooks/useSlugCheck'
import { fazerUploadFoto } from '@/lib/uploadFoto'
import { logoutCliente } from '@/lib/services/auth.service'

import {
  getSessaoAtual,
  buscarPrestadorPorUserId,
  buscarPrestadorPorId,
  deletarPrestador,
  deletarOutrosPrestadoresDoUsuario,
  upsertPrestador,
  criarContaEmail,
  loginEmail,
  atualizarSenha,
} from '@/lib/services/cadastroPrestador.service'

import type { PrestadorFormData } from '@/types/prestador'

interface ErrorModalState {
  show: boolean
  title: string
  message: string
  actionText: string
  actionUrl: string
}

export function useCadastroPrestador(reivindicarId: string | null) {
  const router = useRouter()

  const form = usePrestadorForm()
  const categorias = useCategorias()
  const loc = useLocalizacao()
  const slugCheck = useSlugCheck({ slug: form.formData.slug || '', idAtual: form.formData.id })
  const inicializadoRef = useRef(false)

  const [mounted, setMounted] = useState(false)
  // loading: controla exclusivamente o carregamento inicial da página (dispara o CadastroSkeleton)
  const [loading, setLoading] = useState(true)
  // enviando: controla exclusivamente o estado do submit (botão), nunca deve re-disparar o skeleton
  const [enviando, setEnviando] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [isRedirecting, setIsRedirecting] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [status, setStatus] = useState('')
  const [tentouEnviar, setTentouEnviar] = useState(false)
  const [modoEdicao, setModoEdicao] = useState(false)

  const [userLogado, setUserLogado] = useState<User | null>(null)
  const [email, setEmail] = useState(() => {
    if (typeof window === 'undefined') return ''
    try {
      const prefill = sessionStorage.getItem('pqf_prefill')
      if (prefill) return JSON.parse(prefill).email || ''
    } catch {}
    return ''
  })

  const [senha, setSenha] = useState(() => {
    if (typeof window === 'undefined') return ''
    try {
      const prefill = sessionStorage.getItem('pqf_prefill')
      if (prefill) return JSON.parse(prefill).password || ''
    } catch {}
    return ''
  })
  const [confirmarSenha, setConfirmarSenha] = useState('')
  const [aceitouTermos, setAceitouTermos] = useState(false)
  const [aceitouPrivacidade, setAceitouPrivacidade] = useState(false)

  const [errorModal, setErrorModal] = useState<ErrorModalState>({
    show: false, title: '', message: '', actionText: 'Entendido', actionUrl: '',
  })

  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    sessionStorage.removeItem('pqf_prefill')
  }, [])

  useEffect(() => {
    if (inicializadoRef.current) return
    inicializadoRef.current = true

    const carregarTudo = async () => {
      try {
        setLoading(true)
        const session = await getSessaoAtual()
        const user = session?.user || null
        setUserLogado(user)

        let perfilExistente: PrestadorFormData | null = null
        if (user) {
          perfilExistente = await buscarPrestadorPorUserId(user.id)
        }

        if (
          user && !reivindicarId && perfilExistente &&
          perfilExistente.origem_tipo !== 'curadoria_publica' &&
          perfilExistente.status !== 'pendente'
        ) {
          setIsRedirecting(true)
          router.replace('/dashboard')
          return
        }

        await Promise.all([
          categorias.carregarGrupos(),
          categorias.carregarHabilidades(),
          loc.carregarEstados(),
        ])

        let perfilParaCarregar: PrestadorFormData | null = null

        

        if (reivindicarId) {
          const perfilReivindicar = await buscarPrestadorPorId(reivindicarId)
          if (!perfilReivindicar) {
            setErrorModal({
              show: true, title: 'Perfil não encontrado',
              message: 'Este perfil pode ter sido removido.',
              actionText: 'Voltar', actionUrl: '/',
            })
            setIsRedirecting(true)
            return
          }
          if (perfilReivindicar.user_id) {
            if (user && user.id === perfilReivindicar.user_id) {
              setIsRedirecting(true)
              router.push('/dashboard')
              return
            }
            setErrorModal({
              show: true, title: 'Perfil Indisponível',
              message: 'Este perfil já foi reivindicado por outro profissional. Caso seja você, faça login.',
              actionText: 'Fazer Login', actionUrl: '/login',
            })
            setIsRedirecting(true)
            return
          }
          perfilParaCarregar = perfilReivindicar
          setAceitouTermos(true)
          setAceitouPrivacidade(true)
          setModoEdicao(false)
        } else if (perfilExistente) {
          perfilParaCarregar = perfilExistente
          setModoEdicao(true)
        }

        if (perfilParaCarregar) {
          if (perfilParaCarregar.grupo_id) await categorias.carregarCategorias(perfilParaCarregar.grupo_id)
          if (perfilParaCarregar.estado_sigla) await loc.carregarRegioes(perfilParaCarregar.estado_sigla)
          await loc.carregarCidades(perfilParaCarregar.regiao_id, perfilParaCarregar.estado_sigla)
          form.carregarPerfil(perfilParaCarregar)
        } else {
          const nomeSocial = user?.user_metadata?.full_name || ''
          form.set({ nome: nomeSocial, slug: form.handleNomeChange(nomeSocial) as any })
          await loc.carregarRegioes('PR')
          await loc.carregarCidades(null, 'PR')
        }
      } catch (error) {
        console.error('Erro inicialização:', error)
      } finally {
        setLoading(false)
      }
    }

    carregarTudo()
  }, [reivindicarId])

  const handleUploadFotoProcess = async (file: File) => {
    setUploading(true)
    setStatus('Subindo foto...')
    const res = await fazerUploadFoto(file, userLogado?.id || 'temp', form.formData.foto_perfil || undefined)

    if (res.ok) {
      form.set({ foto_perfil: res.url })
      setStatus('✅ Foto atualizada!')
    } else if (res.error === 'TOO_LARGE') {
      setErrorModal(prev => ({
        ...prev, show: true, title: 'Arquivo muito pesado',
        message: `Sua imagem possui ${res.sizeMB.toFixed(1)}MB. O limite é de 10MB.`,
      }))
      setStatus('Erro no upload')
    } else {
      setErrorModal(prev => ({
        ...prev, show: true, title: 'Erro no Upload',
        message: 'Não conseguimos processar sua imagem. Tente novamente.',
      }))
      setStatus('Erro no upload')
    }

    setUploading(false)
    setTimeout(() => setStatus(''), 2000)
  }

  const handleExcluirPerfil = async () => {
    setStatus('Excluindo...')
    try {
      const targetId = reivindicarId || form.formData.id
      if (!targetId) return
      await deletarPrestador(targetId)
      router.push('/')
    } catch (err) {
      setStatus('Erro ao excluir')
    }
  }

  const calcularProgresso = () => {
    const senhaNovoOk = !userLogado ? (email.includes('@') && senha.length >= 6 && senha === confirmarSenha) : true
    const f = form.formData
    const campos = [
      f.nome?.trim().length > 3,
      f.whatsapp?.replace(/\D/g, '').length >= 10,
      f.grupo_id, f.categoria_id, f.cidade_id,
      f.foto_perfil && f.foto_perfil.length > 10,
      aceitouTermos, aceitouPrivacidade,
      slugCheck.disponivel,
      senhaNovoOk,
    ]
    return Math.round((campos.filter(Boolean).length / campos.length) * 100)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setTentouEnviar(true)

    const f = form.formData
    if (!f.foto_perfil) { setStatus('❌ A foto de perfil é obrigatória.'); return }
    if (!slugCheck.disponivel) { setStatus('❌ Escolha uma URL diferente.'); return }
    if (!userLogado && (senha.length < 6 || senha !== confirmarSenha)) { setStatus('❌ Verifique as senhas.'); return }
    if (userLogado && (senha.length > 0 || confirmarSenha.length > 0) && (senha.length < 6 || senha !== confirmarSenha)) { setStatus('❌ Verifique a nova senha.'); return }
    if (enviando || uploading || calcularProgresso() < 100) return

    setEnviando(true)
    setStatus('Sincronizando...')

    try {
      let userId = userLogado?.id

      if (!userId) {
        const { data: auth, error: aErr } = await criarContaEmail(email, senha, f.nome)
        if (aErr) {
          if (aErr.message.toLowerCase().includes('already registered')) {
            const { data: loginData, error: lErr } = await loginEmail(email, senha)
            if (lErr) throw new Error('ALREADY_REGISTERED')
            userId = loginData.user?.id
          } else {
            throw aErr
          }
        } else {
          userId = auth.user?.id
        }
        if (!userId) throw new Error('Erro de conexão ao criar/autenticar usuário')
      }

      if (userLogado && senha.length >= 6) {
        setStatus('Atualizando credenciais de acesso...')
        await atualizarSenha(senha)
      }

      const cidadeSedeNome = loc.listaCidades.find(c => String(c.id) === String(f.cidade_id))?.nome
      const cidadesAtendidasLimpo = [...new Set(f.cidades_atendidas || [])].filter(nome => nome !== cidadeSedeNome && nome !== '')

      if (reivindicarId && userId) {
        await deletarOutrosPrestadoresDoUsuario(userId, reivindicarId)
      }

      const payload = {
        ...f,
        cidades_atendidas: cidadesAtendidasLimpo,
        id: f.id ? Number(f.id) : undefined,
        user_id: userId,
        status: 'ativo',
        origem_tipo: reivindicarId ? 'reivindicado' : 'registro_direto',
        verificado: false,
      }

      try {
        await upsertPrestador(payload)
      } catch (dbError: any) {
        if (dbError.code === '23505') throw new Error('DB_UNIQUE_CONSTRAINT')
        throw dbError
      }

      if (!userLogado) await loginEmail(email, senha)
      window.location.href = '/dashboard'

    } catch (err: any) {
      if (err.message === 'ALREADY_REGISTERED') {
        setErrorModal({
          show: true, title: 'E-mail já cadastrado',
          message: 'Parece que você já tem uma conta. Use a senha correta para assumir este perfil aqui mesmo ou faça login.',
          actionText: 'Ir para o Login', actionUrl: '/login',
        })
      } else if (err.message === 'DB_UNIQUE_CONSTRAINT') {
        setErrorModal({
          show: true, title: 'Conflito de Perfil',
          message: 'Ocorreu um erro ao vincular a conta a este perfil.',
          actionText: 'Ir para Dashboard', actionUrl: '/dashboard',
        })
      } else {
        setStatus('❌ Não foi possível concluir. Verifique os dados.')
      }
      setStatus('')
      setEnviando(false)
    }
  }

  const handleLogout = async () => {
    await logoutCliente()
    router.push('/login')
  }

  return {
    form, categorias, loc, slugCheck,
    mounted, loading, enviando, uploading, isRedirecting, isModalOpen, setIsModalOpen,
    status, tentouEnviar, modoEdicao,
    userLogado, email, setEmail, senha, setSenha, confirmarSenha, setConfirmarSenha,
    aceitouTermos, setAceitouTermos, aceitouPrivacidade, setAceitouPrivacidade,
    errorModal, setErrorModal,
    handleUploadFotoProcess, handleExcluirPerfil, calcularProgresso, handleSubmit, handleLogout,
  }
}
