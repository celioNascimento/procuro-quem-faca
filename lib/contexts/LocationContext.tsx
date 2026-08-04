//lib/contexts/LocationContext.tsx

'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'

interface CidadeSelecionada {
  id: string
  nome: string
}

interface LocationContextData {
  cidadeAtual: CidadeSelecionada | null
  isModalOpen: boolean
  abrirModal: () => void
  fecharModal: () => void
  salvarLocalizacao: (cidade: CidadeSelecionada) => void
  loading: boolean
}

const LocationContext = createContext<LocationContextData>({} as LocationContextData)

export function LocationProvider({ children }: { children: ReactNode }) {
  const [cidadeAtual, setCidadeAtual] = useState<CidadeSelecionada | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // 1. Ao carregar o app, busca o cookie funcional
    const cookies = document.cookie.split('; ')
    const cidadeCookie = cookies.find(row => row.startsWith('pqf_cidade='))

    if (cidadeCookie) {
      try {
        const decoded = decodeURIComponent(cidadeCookie.split('=')[1])
        const cidadeSalva = JSON.parse(decoded)
        setCidadeAtual(cidadeSalva)
      } catch (e) {
        setIsModalOpen(true) // Se der erro ao ler, força a escolha
      }
    } else {
      // 2. Se não tem cookie, obriga o usuário a escolher
      setIsModalOpen(true)
    }
    setLoading(false)
  }, [])

  const salvarLocalizacao = (cidade: CidadeSelecionada) => {
    // Salva por 30 dias (Cookie Essencial)
    const expires = new Date()
    expires.setDate(expires.getDate() + 30)
    
    document.cookie = `pqf_cidade=${encodeURIComponent(JSON.stringify(cidade))}; expires=${expires.toUTCString()}; path=/; SameSite=Lax`
    
    setCidadeAtual(cidade)
    setIsModalOpen(false)
    
    // Opcional: Recarregar a página para o Next.js (Servidor) ler o novo cookie
    window.location.reload()
  }

  return (
    <LocationContext.Provider 
      value={{ 
        cidadeAtual, 
        isModalOpen, 
        abrirModal: () => setIsModalOpen(true), 
        fecharModal: () => setIsModalOpen(false), 
        salvarLocalizacao,
        loading
      }}
    >
      {children}
    </LocationContext.Provider>
  )
}

export const useLocation = () => useContext(LocationContext)