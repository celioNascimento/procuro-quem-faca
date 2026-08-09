//hooks/useLocalizacao.ts

import { useState, useCallback } from 'react'
import { fetchEstados, fetchRegioesPorEstado, fetchCidadesPorRegiaoOuEstado } from '@/lib/services/localizacao.service'
import type { Estado, Regiao, Cidade } from '@/types/localizacao'

export function useLocalizacao() {
  const [listaEstados, setListaEstados] = useState<Estado[]>([])
  const [listaRegioes, setListaRegioes] = useState<Regiao[]>([])
  const [listaCidades, setListaCidades] = useState<Cidade[]>([])
  const [cidadesRegiao, setCidadesRegiao] = useState<Cidade[]>([])

  const carregarEstados = useCallback(async () => {
    const data = await fetchEstados()
    setListaEstados(data)
  }, [])

  const carregarRegioes = useCallback(async (siglaEstado: string) => {
    const data = await fetchRegioesPorEstado(siglaEstado)
    setListaRegioes(data)
  }, [])

  const carregarCidades = useCallback(async (regiaoId: string | number | null, estadoSigla: string) => {
    const data = await fetchCidadesPorRegiaoOuEstado(regiaoId, estadoSigla)
    setListaCidades(data)
    setCidadesRegiao(data)
  }, [])

  return {
    listaEstados,
    listaRegioes,
    listaCidades,
    cidadesRegiao,
    carregarEstados,
    carregarRegioes,
    carregarCidades,
  }
}