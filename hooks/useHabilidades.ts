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

function getSaveError(err: unknown, entity: 'grupo' | 'categoria') {
  const code = typeof err === 'object' && err !== null && 'code' in err ? String(err.code) : ''
  if (code === '23505') return `Este ${entity} já existe. O slug precisa ser único.`
  if (code === '23503') return 'O grupo selecionado não existe mais. Atualize a página e tente novamente.'
  if (code === '42501') return 'Sem permissão para salvar. Verifique as políticas de acesso do Supabase.'
  return `Não foi possível salvar ${entity === 'grupo' ? 'o grupo' : 'a categoria'}. Veja o console para o detalhe técnico.`
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
    } catch (err) {
      console.error('[v0] Erro ao cadastrar grupo:', err)
      return { ok: false, error: getSaveError(err, 'grupo') }
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
    } catch (err) {
      console.error('[v0] Erro ao cadastrar categoria:', err)
      return { ok: false, error: getSaveError(err, 'categoria') }
    } finally { setSaving(false) }
  }, [carregarDados])

  return { grupos, categorias, loading, saving, error, adicionarGrupo, adicionarCategoria, recarregar: carregarDados }
}
