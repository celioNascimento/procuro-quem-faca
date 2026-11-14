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

    // Escolher uma cidade é o contrário de "ver outras cidades"
    if (chave === 'cidade') params.delete('ampliar')

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

    // replace: filtro refina a MESMA tela. Com push, cada filtro virava uma entrada no
    // histórico e o "voltar" (do navegador ou da seta) desfazia filtro em vez de sair da lista.
    router.replace(`/prestadores?${params.toString()}`, { scroll: false })
  }

  function limparFiltros() {
    const params = new URLSearchParams(window.location.search)
    params.delete('estado')
    params.delete('regiao')
    params.delete('cidade')
    params.delete('grupo')
    params.delete('categoria')
    router.replace(`/prestadores?${params.toString()}`, { scroll: false })
  }

  // Tira o recorte de cidade (a cidade salva do usuário deixa de valer) e mostra todas.
  function verOutrasCidades() {
    const params = new URLSearchParams(window.location.search)
    params.delete('cidade')
    params.set('ampliar', '1')
    router.replace(`/prestadores?${params.toString()}`, { scroll: false })
  }

  // Volta ao padrão: cidade salva do usuário.
  function voltarParaMinhaCidade() {
    const params = new URLSearchParams(window.location.search)
    params.delete('cidade')
    params.delete('ampliar')
    router.replace(`/prestadores?${params.toString()}`, { scroll: false })
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
    verOutrasCidades,
    voltarParaMinhaCidade,
  }
}
