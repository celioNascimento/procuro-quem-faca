'use client'

import { useCallback, useEffect, useState } from 'react'
import type { AdminPrestador, AdminPrestadoresFilters, AdminPrestadoresResponse, PrestadorTab } from '@/types/adminPrestadores'

const initialFilters: AdminPrestadoresFilters = { busca: '', origem: '', cidade: '', categoria: '', grupoCategoria: '' }

export function useAdminPrestadores() {
  const [tab, setTab] = useState<PrestadorTab>('todos')
  const [filters, setFilters] = useState(initialFilters)
  const [data, setData] = useState<AdminPrestadoresResponse>({ prestadores: [], totais: { todos: 0, publico: 0, cadastro: 0, reivindicado: 0, direto: 0, ativo: 0, acompanhar: 0 } })
  const [selected, setSelected] = useState<AdminPrestador | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const params = new URLSearchParams({ tab, busca: filters.busca, origem: filters.origem, cidade: filters.cidade, categoria: filters.categoria, grupoCategoria: filters.grupoCategoria })
      const response = await fetch(`/api/admin/prestadores?${params}`)
      if (!response.ok) throw new Error('Falha ao carregar prestadores')
      setData(await response.json())
    } catch { setError('Não foi possível carregar os prestadores.') } finally { setLoading(false) }
  }, [tab, filters])

  useEffect(() => {
    queueMicrotask(() => void load())
  }, [load])

  // Depois de bloquear ou desbloquear, a lista e o painel aberto mostram o novo estado sem recarregar tudo.
  const marcarBloqueio = useCallback((prestadorId: number, bloqueado: boolean) => {
    setData((atual) => ({ ...atual, prestadores: atual.prestadores.map((p) => (p.id === prestadorId ? { ...p, bloqueado } : p)) }))
    setSelected((atual) => (atual && atual.id === prestadorId ? { ...atual, bloqueado } : atual))
  }, [])

  return { tab, setTab, filters, setFilters, data, selected, setSelected, loading, error, reload: load, marcarBloqueio }
}
