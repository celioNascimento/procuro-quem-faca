// hooks/useMinhasVisitas.ts
//
// Visitas ao perfil público do prestador logado (7 e 30 dias, com o período
// anterior para a variação, e o total).

'use client'

import { useCallback, useEffect, useState } from 'react'
import { buscarResumoVisitas, type ResumoVisitas } from '@/lib/db/resumoVisitas'

export function useMinhasVisitas() {
  const [dados, setDados] = useState<ResumoVisitas | null>(null)
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState(false)

  const carregar = useCallback(async () => {
    try {
      setDados(await buscarResumoVisitas())
      setErro(false)
    } catch (error) {
      console.error('[useMinhasVisitas] Erro ao carregar visitas:', error)
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