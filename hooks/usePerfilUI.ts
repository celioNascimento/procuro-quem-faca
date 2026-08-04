//hooks/usePerfilUI.ts 

'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export function usePerfilUI(isDirty: boolean) {
  const router = useRouter()

  const [aba, setAba] = useState('servicos')
  const [confirmLeaveModal, setConfirmLeaveModal] = useState({ show: false, destination: '' })

  // Avisa o navegador antes de fechar/recarregar com alterações não salvas
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

  const confirmarSaida = () => {
    if (confirmLeaveModal.destination) router.push(confirmLeaveModal.destination)
    setConfirmLeaveModal({ show: false, destination: '' })
  }

  const cancelarSaida = () => setConfirmLeaveModal({ show: false, destination: '' })

  return {
    aba, setAba,
    confirmLeaveModal,
    handleNavigation,
    confirmarSaida,
    cancelarSaida,
  }
}