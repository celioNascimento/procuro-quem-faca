//hooks/useHeaderCliente.ts

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { logoutCliente } from '@/lib/services/auth.service'

export function useHeaderCliente() {
  const router = useRouter()
  const [saindo, setSaindo] = useState(false)

  const handleLogout = async () => {
    setSaindo(true)
    try {
      await logoutCliente()
    } catch (err) {
      console.error('Erro ao sair:', err)
      // Fallback de segurança: redireciona mesmo em caso de erro
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