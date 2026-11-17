// hooks/useSelosPublicos.ts
// Selos de CNPJ dos cards visíveis na busca (só consulta os ids ainda não vistos) e do perfil público.
'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { buscarNivelDoPrestador, buscarSelosPublicos } from '@/lib/services/selosPublicos.service'
import { selosCnpjPorPrestador, type SeloCnpjPublico } from '@/lib/selos/publico'

export function useSelosPublicos(ids: number[]): Map<number, SeloCnpjPublico> {
  const [selos, setSelos] = useState<Map<number, SeloCnpjPublico>>(() => new Map())
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
    buscarSelosPublicos(novos)
      .then((linhas) => {
        const achados = selosCnpjPorPrestador(linhas)
        if (montado.current && achados.size > 0) setSelos((antes) => new Map([...antes, ...achados]))
      })
      .catch(() => {
        // O selo é um extra: se falhar, o card aparece sem ele e tentamos de novo na próxima vez.
        novos.forEach((id) => consultados.current.delete(id))
      })
  }, [lista])

  return selos
}

export interface SeloDoPerfil {
  selo: SeloCnpjPublico | null
  nivel: string | null
}

export function useSeloDoPerfil(prestadorId: number | null | undefined): SeloDoPerfil {
  const [estado, setEstado] = useState<SeloDoPerfil>({ selo: null, nivel: null })

  useEffect(() => {
    if (!prestadorId) return
    let ativo = true
    Promise.all([buscarSelosPublicos([prestadorId]), buscarNivelDoPrestador(prestadorId)])
      .then(([linhas, nivel]) => {
        if (ativo) setEstado({ selo: selosCnpjPorPrestador(linhas).get(Number(prestadorId)) ?? null, nivel })
      })
      .catch(() => { /* sem selo: o perfil aparece normalmente */ })
    return () => { ativo = false }
  }, [prestadorId])

  return estado
}
