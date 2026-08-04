//hooks/useHeaderCliente.ts

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useLogout } from '@/hooks/useLogout'

export function useHeaderCliente() {
  const router = useRouter()
  const { logout } = useLogout()
  const [saindo, setSaindo] = useState(false)

  const handleLogout = async () => {
    setSaindo(true)
    try {
      // Unificado: Limpa sessão, limpa cache, registra log e roteia para a home
      await logout({ origem: 'painel_cliente', redirectTo: '/' })
    } catch (err) {
      console.error('Erro ao sair:', err)
      // Fallback de segurança: redireciona mesmo em caso de falha
      window.location.href = '/'
    }
  }

  const handleBack = () => {
    router.back()
  }

  return {
    saindo,
    handleLogout,
    handleBack
  }
}