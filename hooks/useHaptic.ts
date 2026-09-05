// hooks/useHaptic.ts
import { useCallback } from 'react'

export function useHaptic() {
  return useCallback((pattern: number | number[] = 10) => {
    if (typeof window !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(pattern)
    }
  }, [])
}
