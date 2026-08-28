'use client'
// hooks/useFiltrosParams.ts
// Fonte única de verdade para todos os parâmetros de busca e filtro.
// Consumido por usePrestadores e useFiltrosPrestadores — nenhum deles
// lê useSearchParams diretamente.

import { useSearchParams } from 'next/navigation'

export function useFiltrosParams() {
  const searchParams = useSearchParams()
  return {
    queryBusca:      (searchParams.get('q')          || '').trim(),
    filtroHab:       (searchParams.get('habilidade') || '').trim(),
    filtroCidade:     searchParams.get('cidade')     || '',
    filtroEstado:     searchParams.get('estado')     || '',
    filtroRegiao:     searchParams.get('regiao')     || '',
    filtroGrupo:      searchParams.get('grupo')      || '',
    filtroCategoria:  searchParams.get('categoria')  || '',
  }
}
