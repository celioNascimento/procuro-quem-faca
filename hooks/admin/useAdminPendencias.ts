//hooks/admin/useAdminPendencias.ts
//
// Contador de pendências do menu admin: atualiza a cada minuto e quando a aba volta ao foco.

'use client'

import { useState, useEffect } from 'react'
import { buscarPendencias } from '@/lib/services/pendencias.service'
import type { Pendencias } from '@/lib/notificacoes/mensagens'

export function useAdminPendencias(intervaloMs = 60_000) {
  const [pendencias, setPendencias] = useState<Pendencias | null>(null)

  useEffect(() => {
    let cancelado = false

    const carregar = async () => {
      try {
        const dados = await buscarPendencias()
        if (!cancelado) setPendencias(dados)
      } catch {
        // Mantém o último valor: o contador é um aviso, não pode atrapalhar o painel
      }
    }

    carregar()
    const timer = setInterval(carregar, intervaloMs)
    const aoVoltarAoFoco = () => { if (document.visibilityState === 'visible') carregar() }
    document.addEventListener('visibilitychange', aoVoltarAoFoco)

    return () => {
      cancelado = true
      clearInterval(timer)
      document.removeEventListener('visibilitychange', aoVoltarAoFoco)
    }
  }, [intervaloMs])

  return pendencias
}
