//hooks/useNovaSenha.ts

'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useLogout } from '@/hooks/useLogout'
import {
  getSessaoAtual,
  atualizarSenhaUsuario,
  registrarAcessoNovaSenha,
  onAuthStateChangeRecuperacao,
} from '@/lib/services/recuperacaoSenha.service'

type StatusTipo = '' | 'erro' | 'aviso' | 'sucesso' | 'info'

export function useNovaSenha() {
  const [senha, setSenha] = useState('')
  const [confirmarSenha, setConfirmarSenha] = useState('')
  const [showSenha, setShowSenha] = useState(false)
  const [showConfirmar, setShowConfirmar] = useState(false)

  const [status, setStatus] = useState<{ tipo: StatusTipo; texto: string }>({ tipo: '', texto: '' })
  const [loading, setLoading] = useState(false)
  const [isReady, setIsReady] = useState(false)
  const [linkValido, setLinkValido] = useState(true)
  const [mounted, setMounted] = useState(false)

  const router = useRouter()
  const { logout } = useLogout()
  const fluxoProcessado = useRef(false)

  const senhasPreenchidas = senha.length > 0 && confirmarSenha.length > 0
  const senhasIguais = senhasPreenchidas && senha === confirmarSenha
  const senhaCurta = senha.length > 0 && senha.length < 6
  const podeSubmeter = senha.length >= 6 && senhasIguais && !loading

  useEffect(() => {
    setMounted(true)
    let isSubscribed = true

    const inicializarValidacao = async () => {
      const hash = window.location.hash
      const url = window.location.href
      const temToken = hash.includes('access_token') || hash.includes('type=recovery')

      if (url.includes('error=access_denied')) {
        setLinkValido(false)
        setStatus({ tipo: 'erro', texto: 'Este link já foi usado ou expirou.' })
        setIsReady(true)
        return
      }

      if (temToken) setIsReady(true)

      const session = await getSessaoAtual()
      if (session && isSubscribed) {
        setIsReady(true)
        if (!fluxoProcessado.current) {
          registrarAcessoNovaSenha(session.user.email)
          fluxoProcessado.current = true
        }
      }

      setTimeout(() => {
        if (isSubscribed && !fluxoProcessado.current && !temToken && !session) {
          setLinkValido(false)
          setStatus({ tipo: 'erro', texto: 'Este link não é mais válido.' })
        }
        setIsReady(true)
      }, 2000)
    }

    inicializarValidacao()


    const subscription = onAuthStateChangeRecuperacao((event, session) => {
      if ((event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN') && session && isSubscribed) {
        setIsReady(true)
        fluxoProcessado.current = true
      }
    })

    return () => {
      isSubscribed = false
      subscription.unsubscribe()
    }
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (senha.length < 6) {
      setStatus({ tipo: 'aviso', texto: 'Sua senha precisa ter pelo menos 6 caracteres.' })
      return
    }
    if (senha !== confirmarSenha) {
      setStatus({ tipo: 'aviso', texto: 'As senhas não coincidem. Tente novamente.' })
      return
    }

    setLoading(true)
    setStatus({ tipo: 'info', texto: 'Salvando sua nova senha...' })

    try {
      await atualizarSenhaUsuario(senha)
      setStatus({ tipo: 'sucesso', texto: 'Senha atualizada! Redirecionando...' })
      window.sessionStorage.removeItem('recuperacao_em_curso')
      window.sessionStorage.removeItem('bloquearRedirecionamento')
      window.history.replaceState({}, document.title, window.location.pathname)
      setTimeout(() => {
        logout({ origem: 'recuperacao_senha', redirectTo: '/login?msg=senha_alterada' })
      }, 1500)
    } catch {
      setStatus({ tipo: 'erro', texto: 'Não foi possível atualizar. Tente novamente.' })
      setLoading(false)
    }
  }

  return {
    senha, setSenha, confirmarSenha, setConfirmarSenha,
    showSenha, setShowSenha, showConfirmar, setShowConfirmar,
    status, loading, isReady, linkValido, mounted,
    senhasPreenchidas, senhasIguais, senhaCurta, podeSubmeter,
    handleSubmit,
  }
}