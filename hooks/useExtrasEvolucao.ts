// hooks/useExtrasEvolucao.ts
// Selos calculados pelo sistema, para a barra de evolução do prestador (experiência, tempo de CNPJ, atividade).
// Reconsulta quando a fase do CNPJ muda (ex.: acabou de ser aprovado). Se falhar, devolve null e a barra
// mostra esses selos como "em breve", sem quebrar nada.
'use client'

import { useEffect, useState } from 'react'
import { buscarCategoriaSemMapeamento, buscarNivelDoPrestador, buscarProgressoExperiencia, buscarSelosPublicos } from '@/lib/services/selosPublicos.service'
import { selosComplementaresPorPrestador } from '@/lib/selos/publico'
import type { ExtrasEvolucao } from '@/lib/selos/evolucao'
import type { FaseSeloCnpj } from '@/lib/selos/cnpjEstado'

export function useExtrasEvolucao(prestadorId: number | null, faseCnpj: FaseSeloCnpj): ExtrasEvolucao | null {
  const [extras, setExtras] = useState<ExtrasEvolucao | null>(null)

  useEffect(() => {
    if (prestadorId === null) return
    let ativo = true
    Promise.all([
      buscarSelosPublicos([prestadorId]),
      buscarProgressoExperiencia(prestadorId),
      buscarCategoriaSemMapeamento(prestadorId).catch(() => false), // sem a resposta, não afirmamos nada
      buscarNivelDoPrestador(prestadorId).catch(() => null),
    ])
      .then(([linhas, experiencia, categoriaSemMapeamento, nivel]) => {
        if (!ativo) return
        const c = selosComplementaresPorPrestador(linhas).get(Number(prestadorId))
        setExtras({
          experiencia,
          tempoCnpj: c?.tempoCnpj ?? null,
          atividadeCompativel: c?.atividadeCompativel ?? false,
          categoriaSemMapeamento,
          nivel,
        })
      })
      .catch(() => { /* sem os extras: a barra mostra "em breve" */ })
    return () => { ativo = false }
  }, [prestadorId, faseCnpj])

  return extras
}
