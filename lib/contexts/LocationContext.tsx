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

function lerCidadeDoCookie(): CidadeSelecionada | null {
  const cidadeCookie = document.cookie.split('; ').find((row) => row.startsWith('pqf_cidade='))
  if (!cidadeCookie) return null

  try {
    const valor = JSON.parse(decodeURIComponent(cidadeCookie.slice('pqf_cidade='.length))) as unknown
    if (
      typeof valor === 'object' &&
      valor !== null &&
      'id' in valor &&
      'nome' in valor &&
      typeof valor.id === 'string' &&
      typeof valor.nome === 'string'
    ) {
      return { id: valor.id, nome: valor.nome }
    }
  } catch {
    return null
  }

  return null
}

const LocationContext = createContext<LocationContextData>({} as LocationContextData)

export function LocationProvider({ children }: { children: ReactNode }) {
  const [cidadeAtual, setCidadeAtual] = useState<CidadeSelecionada | null>(() => lerCidadeDoCookie())
  const [isModalOpen, setIsModalOpen] = useState(() => lerCidadeDoCookie() === null)
  const [loading] = useState(false)

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
