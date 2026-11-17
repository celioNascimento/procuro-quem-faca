// lib/selos/evolucao.ts
// Barra de evolução: fala em conquistas, nunca em "perfil incompleto". Etapas futuras
// ("em_breve") aparecem na lista, mas não entram na conta. É só visual: não muda a ordem da busca.

import type { FaseSeloCnpj } from './cnpjEstado'

export type EstadoConquista = 'conquistado' | 'em_andamento' | 'disponivel' | 'em_breve'

export interface Conquista {
  id: string
  titulo: string
  estado: EstadoConquista
}

export interface ResumoEvolucao {
  conquistados: number
  total: number
  percentual: number
  texto: string
}

export function resumoEvolucao(conquistas: Conquista[]): ResumoEvolucao {
  const contam = conquistas.filter((c) => c.estado !== 'em_breve')
  const conquistados = contam.filter((c) => c.estado === 'conquistado').length
  const total = contam.length
  const percentual = total === 0 ? 0 : Math.round((conquistados / total) * 100)
  const texto = `${conquistados} de ${total} ${total === 1 ? 'selo conquistado' : 'selos conquistados'}`
  return { conquistados, total, percentual, texto }
}

export function montarConquistas(faseCnpj: FaseSeloCnpj): Conquista[] {
  const estadoCnpj: EstadoConquista =
    faseCnpj === 'aprovado' ? 'conquistado' : faseCnpj === 'em_conferencia' ? 'em_andamento' : 'disponivel'
  return [
    { id: 'cnpj', titulo: 'CNPJ ativo', estado: estadoCnpj },
    { id: 'experiencia', titulo: 'Experiência no PQF', estado: 'em_breve' },
    { id: 'tempo_cnpj', titulo: 'Tempo de CNPJ', estado: 'em_breve' },
    { id: 'atividade', titulo: 'Atividade compatível', estado: 'em_breve' },
  ]
}
