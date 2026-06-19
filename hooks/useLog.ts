import { useCallback } from 'react'
import { insertLog, type LogPayload } from '@/lib/db/logs'

export function useLog() {
  const registrarLog = useCallback(async (
    acao: string,
    detalhes: Record<string, unknown> = {},
    entidadeTipo: string | null = null,
    entidadeId: string | null = null,
  ) => {
    try {
      await insertLog({ acao, detalhes, entidadeTipo, entidadeId })
    } catch { /* silencioso — log nunca deve quebrar a feature */ }
  }, [])

  return { registrarLog }
}