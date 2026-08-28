'use client'
// hooks/useFiltrosPrestadores.ts
// Encapsula toda a lógica de escrita de filtros na URL.
// Lê os parâmetros via useFiltrosParams (fonte única).

import { useRouter } from 'next/navigation'
import { useFiltrosParams } from './useFiltrosParams'

export function useFiltrosPrestadores() {
  const router = useRouter()
  const {
    filtroEstado,
    filtroRegiao,
    filtroCidade,
    filtroGrupo,
    filtroCategoria,
  } = useFiltrosParams()

  const totalAtivos = [
    filtroEstado,
    filtroRegiao,
    filtroCidade,
    filtroGrupo,
    filtroCategoria,
  ].filter(Boolean).length

  function aplicar(chave: string, valor: string) {
    const params = new URLSearchParams(window.location.search)

    // Toggle: mesmo valor remove, valor diferente substitui
    if (params.get(chave) === valor) {
      params.delete(chave)
    } else {
      params.set(chave, valor)
    }

    // Cascata: limpa filhos quando o pai muda
    if (chave === 'estado') {
      params.delete('regiao')
      params.delete('cidade')
    }
    if (chave === 'regiao') {
      params.delete('cidade')
    }
    if (chave === 'grupo') {
      params.delete('categoria')
    }

    router.push(`/prestadores?${params.toString()}`, { scroll: false })
  }

  function limparFiltros() {
    const params = new URLSearchParams(window.location.search)
    params.delete('estado')
    params.delete('regiao')
    params.delete('cidade')
    params.delete('grupo')
    params.delete('categoria')
    router.push(`/prestadores?${params.toString()}`, { scroll: false })
  }

  return {
    filtroEstado,
    filtroRegiao,
    filtroCidade,
    filtroGrupo,
    filtroCategoria,
    totalAtivos,
    aplicar,
    limparFiltros,
  }
}
