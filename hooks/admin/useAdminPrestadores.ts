'use client'

import { useCallback, useEffect, useState } from 'react'
import type { AdminPrestador, AdminPrestadoresFilters, AdminPrestadoresResponse, PrestadorTab } from '@/types/adminPrestadores'

const initialFilters: AdminPrestadoresFilters = { busca: '', origem: '', cidade: '' }

export function useAdminPrestadores() {
  const [tab, setTab] = useState<PrestadorTab>('todos')
  const [filters, setFilters] = useState(initialFilters)
  const [data, setData] = useState<AdminPrestadoresResponse>({ prestadores: [], totais: { todos: 0, publico: 0, cadastro: 0, reivindicado: 0, ativo: 0, acompanhar: 0 } })
  const [selected, setSelected] = useState<AdminPrestador | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const params = new URLSearchParams({ tab, busca: filters.busca, origem: filters.origem, cidade: filters.cidade })
      const response = await fetch(`/api/admin/prestadores?${params}`)
      if (!response.ok) throw new Error('Falha ao carregar prestadores')
      setData(await response.json())
    } catch { setError('Não foi possível carregar os prestadores.') } finally { setLoading(false) }
  }, [tab, filters])

  useEffect(() => { void load() }, [load])
  return { tab, setTab, filters, setFilters, data, selected, setSelected, loading, error, reload: load }
}
