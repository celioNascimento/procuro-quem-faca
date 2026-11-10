//hooks/useAceiteDocumentos.ts

'use client'

import { useState, useEffect, useCallback } from 'react'
import { usePathname } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { rotaExigeAceite } from '@/config/documentos'
import {
  buscarTiposAceitos,
  faltaAceitar,
  registrarConsentimentos,
} from '@/lib/services/consentimento.service'
import { useLogout } from '@/hooks/useLogout'

// Resultado da checagem de um usuário: guardamos junto o id para nunca reaproveitar
// o resultado de uma conta anterior depois de um logout/login.
interface Checagem {
  userId: string
  pendente: boolean
}

export function useAceiteDocumentos() {
  const pathname = usePathname()
  const { logout } = useLogout()

  const [userId, setUserId] = useState<string | null>(null)
  const [checagem, setChecagem] = useState<Checagem | null>(null)
  const [aceitouTermos, setAceitouTermos] = useState(false)
  const [aceitouPrivacidade, setAceitouPrivacidade] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState('')

  const rotaVerificavel = rotaExigeAceite(pathname)

  // Acompanha a sessão
  useEffect(() => {
    let cancelado = false

    supabase.auth.getSession().then(({ data }) => {
      if (!cancelado) setUserId(data.session?.user?.id ?? null)
    })

    const { data: assinatura } = supabase.auth.onAuthStateChange((_evento, sessao) => {
      setUserId(sessao?.user?.id ?? null)
    })

    return () => {
      cancelado = true
      assinatura.subscription.unsubscribe()
    }
  }, [])

  // Confere no banco se a versão atual já foi aceita (uma vez por usuário)
  useEffect(() => {
    if (!userId || !rotaVerificavel) return
    if (checagem?.userId === userId) return

    let cancelado = false
    buscarTiposAceitos(userId)
      .then(aceitos => {
        if (!cancelado) setChecagem({ userId, pendente: faltaAceitar(aceitos) })
      })
      .catch(e => {
        // Se a consulta falhar, não travamos o uso do site; tentamos de novo na próxima navegação
        console.error('Não foi possível conferir o aceite dos documentos:', e)
      })

    return () => { cancelado = true }
  }, [userId, rotaVerificavel, checagem?.userId])

  const precisaAceitar =
    Boolean(userId) && rotaVerificavel && checagem?.userId === userId && checagem.pendente

  const aceitar = useCallback(async () => {
    if (!userId || !aceitouTermos || !aceitouPrivacidade || enviando) return
    setEnviando(true)
    setErro('')
    try {
      await registrarConsentimentos({ userId, origem: 'login' })
      setChecagem({ userId, pendente: false })
    } catch (e) {
      console.error('Erro ao registrar o aceite dos documentos:', e)
      setErro('Não foi possível registrar o aceite agora. Tente novamente.')
    } finally {
      setEnviando(false)
    }
  }, [userId, aceitouTermos, aceitouPrivacidade, enviando])

  const sair = useCallback(() => logout({ origem: 'aceite_documentos' }), [logout])

  return {
    precisaAceitar,
    aceitouTermos, setAceitouTermos,
    aceitouPrivacidade, setAceitouPrivacidade,
    enviando, erro,
    aceitar, sair,
  }
}
