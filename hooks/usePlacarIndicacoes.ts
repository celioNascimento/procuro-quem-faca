// hooks/usePlacarIndicacoes.ts
// Placar de indicações dos cards visíveis na busca (só consulta os ids ainda não vistos).
// É um extra: se falhar, o card aparece sem a tag e tenta de novo na próxima vez.
'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { buscarPlacarDosPrestadores, type PlacarDoPrestador } from '@/lib/services/placarIndicacoes.service'

export function usePlacarIndicacoes(ids: number[]): Map<number, PlacarDoPrestador> {
  const [placar, setPlacar] = useState<Map<number, PlacarDoPrestador>>(() => new Map())
  const consultados = useRef(new Set<number>())
  const montado = useRef(true)
  const chave = ids.join(',')
  const lista = useMemo(() => (chave ? chave.split(',').map(Number) : []), [chave])

  useEffect(() => {
    montado.current = true
    return () => { montado.current = false }
  }, [])

  useEffect(() => {
    const novos = lista.filter((id) => Number.isFinite(id) && !consultados.current.has(id))
    if (novos.length === 0) return
    novos.forEach((id) => consultados.current.add(id))
    buscarPlacarDosPrestadores(novos)
      .then((achados) => {
        if (montado.current && achados.size > 0) setPlacar((antes) => new Map([...antes, ...achados]))
      })
      .catch(() => {
        novos.forEach((id) => consultados.current.delete(id))
      })
  }, [lista])

  return placar
}
