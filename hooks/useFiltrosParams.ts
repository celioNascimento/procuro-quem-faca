'use client'
// hooks/useFiltrosParams.ts
// Fonte única de verdade para todos os parâmetros de busca e filtro.
// Consumido por usePrestadores e useFiltrosPrestadores — nenhum deles
// lê useSearchParams diretamente.

import { useSearchParams } from 'next/navigation'

export function useFiltrosParams() {
  const searchParams = useSearchParams()
  const queryBusca = (
    searchParams.get('q') ||
    searchParams.get('profissao') ||
    ''
  ).trim()

  return {
    // "profissao" mantém compatibilidade com links antigos e campanhas indexadas.
    queryBusca,
    filtroHab:       (searchParams.get('habilidade') || '').trim(),
    filtroCidade:     searchParams.get('cidade')     || '',
    filtroEstado:     searchParams.get('estado')     || '',
    filtroRegiao:     searchParams.get('regiao')     || '',
    filtroGrupo:      searchParams.get('grupo')      || '',
    filtroCategoria:  searchParams.get('categoria')  || '',
  }
}
