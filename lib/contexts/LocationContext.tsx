//lib/contexts/LocationContext.tsx
//
// Cidade atual do usuário (cookie `pqf_cidade`, 30 dias).
// A localização do aparelho NUNCA é pedida sozinha: só quando a pessoa toca em
// "Usar minha localização" (ver ConviteLocalizacao). Assim a lista de resultados
// não fica esperando uma pergunta do navegador e o pedido vem com explicação.

'use client'

import { createContext, useCallback, useContext, useEffect, useRef, useState, ReactNode } from 'react'
import { descobrirCidade, type CidadeSelecionada } from '@/lib/localizacao'

export type EstadoLocalizacao =
  | 'parado'
  | 'pedindo'        // esperando o navegador / procurando a cidade
  | 'negado'         // a pessoa não permitiu
  | 'sem_cidade'     // permitiu, mas não há cidade atendida por perto
  | 'indisponivel'   // aparelho sem localização
  | 'erro'           // não conseguiu agora (sem sinal, tempo esgotado)

interface LocationContextData {
  cidadeAtual: CidadeSelecionada | null
  estadoLocalizacao: EstadoLocalizacao
  solicitarLocalizacao: () => void
  salvarLocalizacao: (cidade: CidadeSelecionada) => void
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

const LocationContext = createContext<LocationContextData>({
  cidadeAtual: null,
  estadoLocalizacao: 'parado',
  solicitarLocalizacao: () => {},
  salvarLocalizacao: () => {},
})

export function LocationProvider({ children }: { children: ReactNode }) {
  const [cidadeAtual, setCidadeAtual] = useState<CidadeSelecionada | null>(() => lerCidadeDoCookie())
  const [estadoLocalizacao, setEstadoLocalizacao] = useState<EstadoLocalizacao>('parado')
  const montado = useRef(true)

  useEffect(() => {
    montado.current = true
    return () => { montado.current = false }
  }, [])

  const salvarLocalizacao = useCallback((cidade: CidadeSelecionada) => {
    // Salva por 30 dias (Cookie Essencial). Sem recarregar a página: quem usa a cidade reage ao estado.
    const expires = new Date()
    expires.setDate(expires.getDate() + 30)
    document.cookie = `pqf_cidade=${encodeURIComponent(JSON.stringify(cidade))}; expires=${expires.toUTCString()}; path=/; SameSite=Lax`
    setCidadeAtual(cidade)
  }, [])

  const solicitarLocalizacao = useCallback(() => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setEstadoLocalizacao('indisponivel')
      return
    }

    setEstadoLocalizacao('pedindo')
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        try {
          const cidade = await descobrirCidade(coords.latitude, coords.longitude)
          if (!montado.current) return
          if (cidade) {
            salvarLocalizacao(cidade)
            setEstadoLocalizacao('parado')
          } else {
            setEstadoLocalizacao('sem_cidade')
          }
        } catch {
          if (montado.current) setEstadoLocalizacao('erro')
        }
      },
      (falha) => {
        if (!montado.current) return
        setEstadoLocalizacao(falha.code === 1 ? 'negado' : 'erro')
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 },
    )
  }, [salvarLocalizacao])

  return (
    <LocationContext.Provider value={{ cidadeAtual, estadoLocalizacao, solicitarLocalizacao, salvarLocalizacao }}>
      {children}
    </LocationContext.Provider>
  )
}

export const useLocation = () => useContext(LocationContext)
