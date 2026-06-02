import { useCallback } from 'react'
import { insertLog } from '@/lib/db/logs'

export function useLog() {
  const registrarLog = useCallback(async (
    acao: string,
    detalhes: Record<string, unknown> = {},
    entidade: string | null = null
  ) => {
    try {
      await insertLog(acao, detalhes, entidade)
    } catch { /* silencioso */ }
  }, [])

  return { registrarLog }
}