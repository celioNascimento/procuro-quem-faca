'use client'

import { useCallback, useEffect, useState } from 'react'
import {
  criarCategoria,
  criarGrupo,
  fetchCategorias,
  fetchGrupos,
} from '@/lib/services/categorias.service'
import type { Categoria, Grupo } from '@/types/categorias'

function toSlug(value: string) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

export function useHabilidades() {
  const [grupos, setGrupos] = useState<Grupo[]>([])
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const carregarDados = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [gruposData, categoriasData] = await Promise.all([fetchGrupos(), fetchCategorias()])
      setGrupos(gruposData)
      setCategorias(categoriasData)
    } catch (err) {
      console.error('Erro ao carregar categorias:', err)
      setError('Não foi possível carregar o catálogo.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { carregarDados() }, [carregarDados])

  const adicionarGrupo = useCallback(async (nome: string, icone: string, ordem: number) => {
    if (!nome.trim()) return { ok: false, error: 'Informe o nome do grupo.' }
    setSaving(true)
    try {
      await criarGrupo({ nome: nome.trim(), slug: toSlug(nome), icone: icone.trim() || undefined, ordem })
      await carregarDados()
      return { ok: true, error: null }
    } catch {
      return { ok: false, error: 'Este grupo já existe ou não pôde ser salvo.' }
    } finally { setSaving(false) }
  }, [carregarDados])

  const adicionarCategoria = useCallback(async (nome: string, grupoId: string, destaque: boolean) => {
    if (!nome.trim()) return { ok: false, error: 'Informe o nome da categoria.' }
    if (!grupoId) return { ok: false, error: 'Selecione um grupo.' }
    setSaving(true)
    try {
      await criarCategoria({ nome: nome.trim(), slug: toSlug(nome), grupo_id: grupoId, destaque })
      await carregarDados()
      return { ok: true, error: null }
    } catch {
      return { ok: false, error: 'Esta categoria já existe ou não pôde ser salva.' }
    } finally { setSaving(false) }
  }, [carregarDados])

  return { grupos, categorias, loading, saving, error, adicionarGrupo, adicionarCategoria, recarregar: carregarDados }
}
