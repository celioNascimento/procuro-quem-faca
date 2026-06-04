import { useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type { Estado, Regiao, Cidade } from '@/types/localizacao'

export function useLocalizacao() {
  const [listaEstados, setListaEstados] = useState<Estado[]>([])
  const [listaRegioes, setListaRegioes] = useState<Regiao[]>([])
  const [listaCidades, setListaCidades] = useState<Cidade[]>([])
  const [cidadesRegiao, setCidadesRegiao] = useState<Cidade[]>([])

  const carregarEstados = useCallback(async () => {
    const { data } = await supabase.from('estados').select('*').order('nome')
    setListaEstados(data || [])
  }, [])

  const carregarRegioes = useCallback(async (siglaEstado: string) => {
    if (!siglaEstado) { setListaRegioes([]); return }
    const { data } = await supabase
      .from('regioes')
      .select('*')
      .eq('estado_sigla', siglaEstado)
      .order('nome')
    setListaRegioes(data || [])
  }, [])

  const carregarCidades = useCallback(async (regiaoId: string | number | null, estadoSigla: string) => {
    let query = supabase.from('cidades').select('*').eq('ativa', true).order('nome')
    if (regiaoId) {
      query = query.eq('regiao_id', regiaoId)
    } else if (estadoSigla) {
      query = query.eq('estado_sigla', estadoSigla)
    } else {
      setListaCidades([])
      setCidadesRegiao([])
      return
    }
    const { data } = await query
    setListaCidades(data || [])
    setCidadesRegiao(data || [])
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