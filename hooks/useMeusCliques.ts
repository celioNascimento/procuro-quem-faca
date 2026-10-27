// hooks/useMeusCliques.ts
//
// Cliques no WhatsApp do perfil do prestador logado (rota /api/prestadores/meus-cliques).

'use client'

import { useCallback, useEffect, useState } from 'react'

export type MeusCliques =
  | { rastreando: false }
  | { rastreando: true; ultimos7: number; ultimos30: number; total: number }

export function useMeusCliques() {
  const [dados, setDados] = useState<MeusCliques | null>(null)
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState(false)

  const carregar = useCallback(async () => {
    try {
      const resposta = await fetch('/api/prestadores/meus-cliques', { cache: 'no-store' })
      if (!resposta.ok) throw new Error(`Falha ${resposta.status} ao carregar cliques`)
      setDados((await resposta.json()) as MeusCliques)
      setErro(false)
    } catch (error) {
      console.error('[useMeusCliques] Erro ao carregar cliques:', error)
      setErro(true)
    } finally {
      setCarregando(false)
    }
  }, [])

  useEffect(() => {
    queueMicrotask(() => carregar())
  }, [carregar])

  return { dados, carregando, erro, recarregar: carregar }
}
