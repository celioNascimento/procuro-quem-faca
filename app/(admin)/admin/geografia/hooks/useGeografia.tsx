'use client'
import { useState, useEffect, useCallback } from 'react'
import type { Estado, Regiao, Cidade } from '../types/geografia'
import {
  getEstados,
  getRegioes,
  getCidades,
  insertEstado,
  insertRegiao,
  insertCidade,
  updateRegiaoCidade,
} from '@/lib/db/geografia'

export function useGeografia() {
  const [estados, setEstados] = useState<Estado[]>([])
  const [regioes, setRegioes] = useState<Regiao[]>([])
  const [cidades, setCidades] = useState<Cidade[]>([])
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState<string | null>(null)

  const carregarDados = useCallback(async () => {
    setLoading(true)
    setError(null)

    const [est, reg, cid] = await Promise.all([
      getEstados(),
      getRegioes(),
      getCidades(),
    ])

    if (est.error || reg.error || cid.error) {
      setError(est.error?.message ?? reg.error?.message ?? cid.error?.message ?? 'Erro desconhecido')
      setLoading(false)
      return
    }

    setEstados(est.data ?? [])
    setRegioes(reg.data ?? [])
    setCidades(cid.data ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { carregarDados() }, [carregarDados])

  async function addEstado(sigla: string, nome: string): Promise<string | null> {
    const { error } = await insertEstado(sigla, nome)
    if (error) return error.message
    await carregarDados()
    return null
  }

  async function addRegiao(nome: string, estadoSigla: string): Promise<string | null> {
    const { error } = await insertRegiao(nome, estadoSigla)
    if (error) return error.message
    await carregarDados()
    return null
  }

  async function addCidade(nome: string, estadoSigla: string, regiaoId: string | null): Promise<string | null> {
    const { error } = await insertCidade(nome, estadoSigla, regiaoId)
    if (error) return error.message
    await carregarDados()
    return null
  }

  async function atualizarRegiaoCidade(cidadeId: string, regiaoId: string | null): Promise<string | null> {
    const { error } = await updateRegiaoCidade(cidadeId, regiaoId)
    if (error) return error.message
    await carregarDados()
    return null
  }

  return { estados, regioes, cidades, loading, error, carregarDados, addEstado, addRegiao, addCidade, atualizarRegiaoCidade }
}