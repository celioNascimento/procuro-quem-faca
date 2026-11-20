'use client'
// hooks/useAoTrocarCidadeSalva.ts
//
// A busca da home grava `?cidade=<id>` na URL com a cidade salva. Quando a pessoa atualiza a localização
// e a cidade salva muda, esse id antigo na URL continuaria valendo e a lista ficaria presa na cidade velha.
// Este hook avisa quando a cidade salva TROCA (de uma cidade para outra; a primeira escolha não conta).

import { useEffect, useRef } from 'react'

export function useAoTrocarCidadeSalva(cidadeSalvaId: string | undefined, aoTrocar: () => void) {
  const anterior = useRef(cidadeSalvaId)

  useEffect(() => {
    if (anterior.current && cidadeSalvaId && anterior.current !== cidadeSalvaId) aoTrocar()
    anterior.current = cidadeSalvaId
  }, [cidadeSalvaId, aoTrocar])
}
