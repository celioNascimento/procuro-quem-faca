// hooks/useFiltrosPrestadores.ts
'use client'

import { useRouter } from 'next/navigation'
import { useSearchParams } from 'next/navigation'

export function useFiltrosPrestadores() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const filtroEstado  = searchParams.get('estado')  || ''
  const filtroRegiao  = searchParams.get('regiao')  || ''
  const filtroCidade  = searchParams.get('cidade')  || ''
  const filtroGrupo   = searchParams.get('grupo')   || ''
  const filtroCategoria = searchParams.get('categoria') || ''

  const totalAtivos = [filtroEstado, filtroRegiao, filtroCidade, filtroGrupo, filtroCategoria]
    .filter(Boolean).length

  function aplicar(chave: string, valor: string) {
    const params = new URLSearchParams(window.location.search)

    if (params.get(chave) === valor) {
      // mesmo valor → toggle (remove)
      params.delete(chave)
    } else {
      params.set(chave, valor)
    }

    // Cascata: limpa os filhos quando o pai muda
    if (chave === 'estado') { params.delete('regiao'); params.delete('cidade') }
    if (chave === 'regiao') { params.delete('cidade') }
    if (chave === 'grupo')  { params.delete('categoria') }

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
    filtroCategoria,
    filtroGrupo,
    totalAtivos,
    aplicar,
    limparFiltros,
  }
}
