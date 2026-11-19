// hooks/useAdminTrafego.ts — resumo de tráfego (30 ou 7 dias). Falha vira mensagem, nunca quebra o painel.
'use client'

import { useCallback, useEffect, useState } from 'react'
import { fetchResumoTrafego } from '@/lib/services/adminTrafego.service'
import { lerTrafego, RESUMO_VAZIO, type LeituraTrafego, type ResumoTrafego } from '@/lib/admin/trafego'

export function useAdminTrafego() {
  const [dias, setDias] = useState<7 | 30>(30)
  const [resumo, setResumo] = useState<ResumoTrafego>(RESUMO_VAZIO)
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState<string | null>(null)

  const carregar = useCallback(async () => {
    setCarregando(true)
    try {
      setResumo(await fetchResumoTrafego(dias))
      setErro(null)
    } catch (e) {
      console.error('Erro ao carregar o resumo de tráfego:', e)
      setErro('Não foi possível carregar o resumo de tráfego agora.')
    } finally {
      setCarregando(false)
    }
  }, [dias])

  useEffect(() => { queueMicrotask(() => carregar()) }, [carregar])

  const leitura: LeituraTrafego = lerTrafego(resumo)
  return { dias, setDias, resumo, leitura, carregando, erro }
}
