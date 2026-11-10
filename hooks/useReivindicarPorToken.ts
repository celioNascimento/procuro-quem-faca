//hooks/useReivindicarPorToken.ts

'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  consultarPerfilPorToken,
  excluirPerfilPorToken,
  tokenTemFormatoValido,
  type PerfilDoLink,
} from '@/lib/services/reivindicacao.service'

export type EstadoReivindicacao =
  | 'sem_link'
  | 'carregando'
  | 'link_invalido'
  | 'pronto'
  | 'confirmando_exclusao'
  | 'excluido'

export function useReivindicarPorToken(token: string | null) {
  const router = useRouter()
  const estadoInicial: EstadoReivindicacao = !token
    ? 'sem_link'
    : !tokenTemFormatoValido(token) ? 'link_invalido' : 'carregando'
  const [estado, setEstado] = useState<EstadoReivindicacao>(estadoInicial)
  const [perfil, setPerfil] = useState<PerfilDoLink | null>(null)
  const [processando, setProcessando] = useState(false)
  const [erro, setErro] = useState('')

  useEffect(() => {
    // Sem link ou com formato inválido, o estado já nasce resolvido: não há o que consultar
    if (!token || !tokenTemFormatoValido(token)) return

    let cancelado = false
    consultarPerfilPorToken(token)
      .then(resultado => {
        if (cancelado) return
        if (!resultado) { setEstado('link_invalido'); return }
        setPerfil(resultado)
        setEstado('pronto')
      })
      .catch(() => {
        if (!cancelado) setEstado('link_invalido')
      })

    return () => { cancelado = true }
  }, [token])

  const assumirPerfil = useCallback(() => {
    if (!perfil || !token) return
    if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate([30, 50, 30])
    setProcessando(true)
    router.push(`/cadastro?reivindicar=${perfil.id}&token=${token}`)
  }, [perfil, token, router])

  const pedirConfirmacaoExclusao = useCallback(() => {
    setErro('')
    setEstado('confirmando_exclusao')
  }, [])

  const cancelarExclusao = useCallback(() => {
    setErro('')
    setEstado('pronto')
  }, [])

  const confirmarExclusao = useCallback(async () => {
    if (!token) return
    setProcessando(true)
    setErro('')
    try {
      await excluirPerfilPorToken(token)
      setEstado('excluido')
    } catch (e) {
      const codigo = e instanceof Error ? e.message : ''
      if (codigo === 'LINK_INVALIDO' || codigo === 'PERFIL_JA_TEM_CONTA') {
        setEstado('link_invalido')
      } else {
        setErro('Não foi possível excluir agora. Tente novamente ou fale com a gente.')
      }
    } finally {
      setProcessando(false)
    }
  }, [token])

  return {
    estado, perfil, processando, erro,
    assumirPerfil, pedirConfirmacaoExclusao, cancelarExclusao, confirmarExclusao,
  }
}
