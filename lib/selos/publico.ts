// lib/selos/publico.ts
// Selos que o cliente vê (card da busca e perfil público). Só lógica pura: o que mostrar e como escrever.
// O texto diz apenas o que foi conferido, nunca mais que isso.

import { META_EXPERIENCIA } from '@/config/selos'
import { faixaTempoCnpj, type FaixaTempoCnpj } from './tempoCnpj'

/** Uma linha de selos_publicos(): selo aprovado e dentro da validade. */
export interface LinhaSeloPublico {
  prestador_id: number
  tipo: string
  verificado_em: string | null
  valido_ate: string | null
  consultado_em: string | null
  data_abertura: string | null
}

export interface SeloCnpjPublico {
  consultadoEm: string | null
  /** 'bronze', 'prata'... Só preenchido nos cards da busca. */
  nivel?: string | null
}

export const ROTULO_SELO_CARD = 'CNPJ ativo'

/** Agrupa por prestador só os selos de CNPJ (os outros tipos chegam nas etapas seguintes). */
export function selosCnpjPorPrestador(linhas: LinhaSeloPublico[]): Map<number, SeloCnpjPublico> {
  const mapa = new Map<number, SeloCnpjPublico>()
  for (const l of linhas) {
    if (l.tipo === 'cnpj') mapa.set(Number(l.prestador_id), { consultadoEm: l.consultado_em })
  }
  return mapa
}

/** "17/11" no horário de Brasília, ou null se a data não existir ou for inválida. */
export function diaMes(iso: string | null | undefined): string | null {
  if (!iso) return null
  const data = new Date(iso)
  if (Number.isNaN(data.getTime())) return null
  return data.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', timeZone: 'America/Sao_Paulo' })
}

/** "CNPJ ativo, consultado em 17/11". Sem data confiável, só "CNPJ ativo". */
export function textoSeloCnpj(selo: SeloCnpjPublico): string {
  const dia = diaMes(selo.consultadoEm)
  return dia ? `CNPJ ativo, consultado em ${dia}` : 'CNPJ ativo'
}

const NOMES_NIVEL: Record<string, string> = {
  bronze: 'Bronze',
  prata: 'Prata',
  ouro: 'Ouro',
  diamante: 'Diamante',
}

/** Nome do nível devolvido por nivel_do_prestador(); null se não há nível. */
export function rotuloNivel(nivel: string | null | undefined): string | null {
  if (!nivel) return null
  return NOMES_NIVEL[nivel] ?? null
}

/** Selos calculados pelo sistema (Parte B). Só aparecem no perfil público; o card mostra apenas o CNPJ ativo. */
export interface SelosComplementares {
  experiencia: boolean
  tempoCnpj: FaixaTempoCnpj | null
  atividadeCompativel: boolean
  seguro: boolean
  cnd: boolean
}

export const TEXTO_EXPERIENCIA = `Experiência no PQF: ${META_EXPERIENCIA.servicos} serviços avaliados por ${META_EXPERIENCIA.clientes} clientes diferentes`
export const TEXTO_ATIVIDADE = 'Atividade registrada no CNPJ compatível com a categoria do perfil'

/** Agrupa por prestador os selos de experiência, tempo de CNPJ e atividade compatível. */
export function selosComplementaresPorPrestador(linhas: LinhaSeloPublico[], agora: Date = new Date()): Map<number, SelosComplementares> {
  const mapa = new Map<number, SelosComplementares>()
  const de = (id: number) => {
    const atual = mapa.get(id) ?? { experiencia: false, tempoCnpj: null, atividadeCompativel: false, seguro: false, cnd: false }
    mapa.set(id, atual)
    return atual
  }
  for (const l of linhas) {
    const id = Number(l.prestador_id)
    if (l.tipo === 'experiencia') de(id).experiencia = true
    else if (l.tipo === 'atividade_compativel') de(id).atividadeCompativel = true
    else if (l.tipo === 'seguro') de(id).seguro = true
    else if (l.tipo === 'cnd') de(id).cnd = true
    else if (l.tipo === 'tempo_cnpj') {
      const faixa = faixaTempoCnpj(l.data_abertura, agora)
      if (faixa) de(id).tempoCnpj = faixa
    }
  }
  return mapa
}
