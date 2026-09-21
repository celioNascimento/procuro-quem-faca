//lib/contexts/LocationContext.tsx

'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { supabase } from '@/lib/supabase'

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
  if (typeof document === 'undefined') return null

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
  const [loading, setLoading] = useState(() =>
    lerCidadeDoCookie() === null && typeof navigator !== 'undefined' && Boolean(navigator.geolocation)
  )

  const salvarLocalizacao = (cidade: CidadeSelecionada) => {
    // Salva por 30 dias (Cookie Essencial)
    const expires = new Date()
    expires.setDate(expires.getDate() + 30)

    document.cookie = `pqf_cidade=${encodeURIComponent(JSON.stringify(cidade))}; expires=${expires.toUTCString()}; path=/; SameSite=Lax`

    setCidadeAtual(cidade)
    setIsModalOpen(false)
    window.location.reload()
  }

  useEffect(() => {
    if (cidadeAtual || typeof navigator === 'undefined' || !navigator.geolocation) {
      setLoading(false)
      return
    }

    let ativo = true
    setLoading(true)

    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        try {
          const params = new URLSearchParams({
            format: 'json',
            lat: String(coords.latitude),
            lon: String(coords.longitude),
            zoom: '10',
          })
          const resposta = await fetch(`https://nominatim.openstreetmap.org/reverse?${params}`)
          const local = await resposta.json()
          const nome = local.address?.city || local.address?.town || local.address?.municipality
          const estado = local.address?.state_code?.replace('BR-', '') || local.address?.['ISO3166-2-lvl4']?.replace('BR-', '')

          if (!ativo || !nome) return

          let consulta = supabase
            .from('cidades')
            .select('id, nome, estado_sigla')
            .eq('ativa', true)
            .ilike('nome', nome)
            .limit(5)

          if (estado) consulta = consulta.eq('estado_sigla', estado)
          const { data } = await consulta
          const cidade = data?.[0]

          if (cidade && ativo) {
            salvarLocalizacao({ id: String(cidade.id), nome: cidade.nome })
          }
        } catch {
          // A busca continua disponível mesmo sem permissão ou geocodificação.
        } finally {
          if (ativo) setLoading(false)
        }
      },
      () => setLoading(false),
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 300000 }
    )

    return () => {
      ativo = false
    }
  }, [cidadeAtual])

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
