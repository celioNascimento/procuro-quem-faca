// lib/cidadesCatalogo.ts
//
// Lista das cidades ativas, lida uma vez por aba. A busca precisa dela para reconhecer
// o nome de uma cidade escrito na busca, com ou sem "em" ("pedreiro Londrina").

import { getCidadesAtivas } from '@/lib/db/prestadores'

export interface CidadeCatalogo {
  id: string
  nome: string
  estado_sigla: string | null
}

let cache: Promise<CidadeCatalogo[]> | null = null

/**
 * Devolve o catálogo. Qualquer falha (inclusive uma exceção síncrona) vira lista vazia e
 * não fica guardada: a próxima busca tenta de novo. A busca continua funcionando sem o catálogo;
 * só deixa de reconhecer cidade escrita sem "em".
 */
export function carregarCatalogoCidades(): Promise<CidadeCatalogo[]> {
  if (!cache) {
    cache = (async (): Promise<CidadeCatalogo[]> => {
      try {
        const { data, error } = await getCidadesAtivas()
        if (error) throw error
        return (data ?? []) as CidadeCatalogo[]
      } catch {
        cache = null
        return []
      }
    })()
  }
  return cache
}
