//hooks/useHabilidades.ts

'use client'

import { useState, useEffect, useCallback } from 'react'
import { fetchHabilidades, criarHabilidade, type Habilidade } from '@/lib/services/habilidades.service'

export function useHabilidades() {
  const [habilidades, setHabilidades] = useState<Habilidade[]>([])
  const [loading, setLoading] = useState(true)

  const carregarDados = useCallback(async () => {
    setLoading(true)
    try {
      const data = await fetchHabilidades()
      setHabilidades(data)
    } catch (err) {
      console.error('Erro ao carregar habilidades:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { carregarDados() }, [carregarDados])

  const adicionarHabilidade = useCallback(async (nome: string, categoria: string) => {
    if (!nome) return { ok: false, error: 'Nome obrigatório' }
    try {
      await criarHabilidade(nome, categoria)
      await carregarDados()
      return { ok: true, error: null }
    } catch {
      return { ok: false, error: 'Habilidade já cadastrada.' }
    }
  }, [carregarDados])

  return { habilidades, loading, adicionarHabilidade }
}