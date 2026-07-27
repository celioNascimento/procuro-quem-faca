'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { insertLog } from '@/hooks/useLog'
import { buscarPrestadorPorUserId } from '@/lib/services/cadastroPrestador.service'
import { removerFotoPrestador, deletarPrestadorPorUserId } from '@/lib/services/exclusaoConta.service'
import * as ClienteService from '@/lib/services/cliente.service'
import { supabase } from '@/lib/supabase'

export function useConfirmarExclusaoConta() {
  const router = useRouter()
  const { session, role, sessionChecked } = useAuth()

  const [confirmText, setConfirmText] = useState('')
  const [motivo, setMotivo] = useState('')
  const [deleting, setDeleting] = useState(false)
  const [erro, setErro] = useState('')

  useEffect(() => {
    if (sessionChecked && !session) {
      router.push('/login')
    }
  }, [sessionChecked, session, router])

  const confirmado = confirmText === 'EXCLUIR'

  const executarExclusao = async () => {
    if (!confirmado || !session?.user) return
    setDeleting(true)
    setErro('')

    const userId = session.user.id

    try {
      await insertLog({
        acao: 'EXCLUSAO_CONTA_VOLUNTARIA',
        entidadeTipo: role === 'prestador' ? 'perfil_prestador' : 'perfil_cliente',
        detalhes: {
          motivo: motivo || 'Não informado',
          agente: navigator.userAgent,
          plataforma: navigator.platform,
        },
      })

      if (role === 'prestador') {
        const prestador = await buscarPrestadorPorUserId(userId)
        if (prestador?.foto_perfil) {
          await removerFotoPrestador(prestador.foto_perfil)
        }
        await deletarPrestadorPorUserId(userId)
      } else {
        const perfilCliente = await ClienteService.fetchClienteProfile(userId)
        await ClienteService.deleteClienteAccount(userId, perfilCliente?.whatsapp || '')
      }

      await fetch('/api/delete-account', { method: 'POST' })
      await supabase.auth.signOut()
      window.location.href = '/login?status=conta-excluida'
    } catch (err) {
      console.error('Erro no processo de exclusão:', err)
      setErro('Erro ao processar exclusão. Tente novamente.')
      setDeleting(false)
    }
  }

  return {
    loading: !sessionChecked,
    confirmText, setConfirmText,
    confirmado,
    motivo, setMotivo,
    deleting,
    erro,
    executarExclusao,
  }
}