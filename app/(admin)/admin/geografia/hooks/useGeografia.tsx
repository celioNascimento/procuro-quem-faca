'use client'
import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

import type { Estado, Regiao, Cidade } from '../types/geografia'

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useGeografia() {
  const [estados,  setEstados]  = useState<Estado[]>([])
  const [regioes,  setRegioes]  = useState<Regiao[]>([])
  const [cidades,  setCidades]  = useState<Cidade[]>([])
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState<string | null>(null)

  const carregarDados = useCallback(async () => {
    setLoading(true)
    setError(null)

    const [est, reg, cid] = await Promise.all([
      supabase.from('estados').select('*').order('sigla'),
      supabase.from('regioes').select('*').order('nome'),
      supabase.from('cidades')
        .select('id, nome, estado_sigla, regiao_id, ativa, regioes(nome)')
        .order('nome'),
    ])

    if (est.error || reg.error || cid.error) {
      setError(est.error?.message ?? reg.error?.message ?? cid.error?.message ?? 'Erro desconhecido')
      setLoading(false)
      return
    }

    setEstados(est.data ?? [])
    setRegioes(reg.data ?? [])

    const cidadesData: Cidade[] = (cid.data ?? []).map(c => ({
      id:           c.id,
      nome:         c.nome,
      estado_sigla: c.estado_sigla,
      regiao_id:    c.regiao_id ?? null,
      ativa:        c.ativa,
      regioes:      Array.isArray(c.regioes) ? (c.regioes[0] ?? null) : (c.regioes ?? null),
    }))
    setCidades(cidadesData)

    setLoading(false)
  }, [])

  useEffect(() => { carregarDados() }, [carregarDados])

  // ─── Mutations ───────────────────────────────────────────────────────────────

  async function addEstado(sigla: string, nome: string): Promise<string | null> {
    const { error } = await supabase.from('estados').insert([{ sigla: sigla.toUpperCase(), nome }])
    if (error) return error.message
    await carregarDados()
    return null
  }

  async function addRegiao(nome: string, estadoSigla: string): Promise<string | null> {
    const { error } = await supabase.from('regioes').insert([{ nome, estado_sigla: estadoSigla }])
    if (error) return error.message
    await carregarDados()
    return null
  }

  async function addCidade(nome: string, estadoSigla: string, regiaoId: string | null): Promise<string | null> {
    const { error } = await supabase.from('cidades').insert([{
      nome,
      estado_sigla: estadoSigla,
      regiao_id:    regiaoId ?? null,
      ativa:        true,
    }])
    if (error) return error.message
    await carregarDados()
    return null
  }

  async function atualizarRegiaoCidade(cidadeId: string, regiaoId: string | null): Promise<string | null> {
    const { error } = await supabase.from('cidades')
      .update({ regiao_id: regiaoId ?? null })
      .eq('id', cidadeId)
    if (error) return error.message
    await carregarDados()
    return null
  }

  return { estados, regioes, cidades, loading, error, carregarDados, addEstado, addRegiao, addCidade, atualizarRegiaoCidade }
}