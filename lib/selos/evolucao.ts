// lib/selos/evolucao.ts
// Barra de evolução: fala em conquistas, nunca em "perfil incompleto". Estados "em_breve" e "nao_aplica"
// aparecem na lista, mas não entram na conta. É só visual: não muda a ordem da busca.

import { META_EXPERIENCIA } from '@/config/selos'
import type { FaseSeloCnpj } from './cnpjEstado'
import { textoTempoCnpj, type FaixaTempoCnpj } from './tempoCnpj'

export type EstadoConquista =
  | 'conquistado'
  | 'em_andamento'   // CNPJ em conferência pela equipe
  | 'em_progresso'   // acumulando (ex.: 3 de 10 clientes)
  | 'disponivel'
  | 'depende_cnpj'   // só existe depois do CNPJ ativo
  | 'nao_aplica'     // não vale para este perfil (ex.: CNAE de outra atividade); não conta
  | 'em_breve'       // ainda não disponível; não conta

export interface Conquista {
  id: string
  titulo: string
  estado: EstadoConquista
  detalhe?: string
}

export interface ResumoEvolucao {
  conquistados: number
  total: number
  percentual: number
  texto: string
}

/** O que o banco informa sobre os selos calculados (null enquanto carrega ou se a consulta falhar). */
export interface ExtrasEvolucao {
  experiencia: { servicos: number; clientes: number; atingido: boolean }
  tempoCnpj: FaixaTempoCnpj | null
  atividadeCompativel: boolean
}

const NAO_CONTAM: EstadoConquista[] = ['em_breve', 'nao_aplica']

export function resumoEvolucao(conquistas: Conquista[]): ResumoEvolucao {
  const contam = conquistas.filter((c) => !NAO_CONTAM.includes(c.estado))
  const conquistados = contam.filter((c) => c.estado === 'conquistado').length
  const total = contam.length
  const percentual = total === 0 ? 0 : Math.round((conquistados / total) * 100)
  const texto = `${conquistados} de ${total} ${total === 1 ? 'selo conquistado' : 'selos conquistados'}`
  return { conquistados, total, percentual, texto }
}

export function montarConquistas(faseCnpj: FaseSeloCnpj, extras: ExtrasEvolucao | null = null): Conquista[] {
  const estadoCnpj: EstadoConquista =
    faseCnpj === 'aprovado' ? 'conquistado' : faseCnpj === 'em_conferencia' ? 'em_andamento' : 'disponivel'
  const cnpj: Conquista = { id: 'cnpj', titulo: 'CNPJ ativo', estado: estadoCnpj }

  if (!extras) {
    return [
      cnpj,
      { id: 'experiencia', titulo: 'Experiência no PQF', estado: 'em_breve' },
      { id: 'tempo_cnpj', titulo: 'Tempo de CNPJ', estado: 'em_breve' },
      { id: 'atividade', titulo: 'Atividade compatível', estado: 'em_breve' },
    ]
  }

  const cnpjAtivo = faseCnpj === 'aprovado'
  const { servicos, clientes, atingido } = extras.experiencia
  const experiencia: Conquista = {
    id: 'experiencia',
    titulo: 'Experiência no PQF',
    estado: atingido ? 'conquistado' : servicos > 0 ? 'em_progresso' : 'disponivel',
    detalhe: atingido
      ? undefined
      : `${Math.min(clientes, META_EXPERIENCIA.clientes)} de ${META_EXPERIENCIA.clientes} clientes diferentes avaliaram seus serviços`,
  }

  const tempo: Conquista = !cnpjAtivo
    ? { id: 'tempo_cnpj', titulo: 'Tempo de CNPJ', estado: 'depende_cnpj', detalhe: 'Aparece depois do CNPJ ativo.' }
    : extras.tempoCnpj
      ? { id: 'tempo_cnpj', titulo: 'Tempo de CNPJ', estado: 'conquistado', detalhe: textoTempoCnpj(extras.tempoCnpj) }
      : { id: 'tempo_cnpj', titulo: 'Tempo de CNPJ', estado: 'em_breve', detalhe: 'Aparece quando o CNPJ completar 1 ano.' }

  const atividade: Conquista = !cnpjAtivo
    ? { id: 'atividade', titulo: 'Atividade compatível', estado: 'depende_cnpj', detalhe: 'Aparece depois do CNPJ ativo.' }
    : extras.atividadeCompativel
      ? { id: 'atividade', titulo: 'Atividade compatível', estado: 'conquistado' }
      : {
          id: 'atividade',
          titulo: 'Atividade compatível',
          estado: 'nao_aplica',
          detalhe: 'A atividade principal do CNPJ não combina com a categoria do perfil.',
        }

  return [cnpj, experiencia, tempo, atividade]
}
