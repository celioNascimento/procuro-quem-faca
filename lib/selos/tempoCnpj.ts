// lib/selos/tempoCnpj.ts
// Selo "Tempo de CNPJ": a data de abertura vem da Receita; a tela mostra a maior faixa atingida.

import { FAIXAS_TEMPO_CNPJ } from '@/config/selos'

export type FaixaTempoCnpj = (typeof FAIXAS_TEMPO_CNPJ)[number]

/** Anos completos entre a abertura (AAAA-MM-DD) e hoje; null se a data não existir, for inválida ou futura. */
export function anosDeAbertura(dataAbertura: string | null | undefined, agora: Date = new Date()): number | null {
  if (!dataAbertura) return null
  const m = dataAbertura.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (!m) return null
  const [ano, mes, dia] = [Number(m[1]), Number(m[2]), Number(m[3])]
  if (mes < 1 || mes > 12 || dia < 1 || dia > 31) return null
  let anos = agora.getFullYear() - ano
  if (agora.getMonth() + 1 < mes || (agora.getMonth() + 1 === mes && agora.getDate() < dia)) anos -= 1
  return anos < 0 ? null : anos
}

/** Maior faixa atingida (5, 3 ou 1 ano) ou null se tem menos de 1 ano. */
export function faixaTempoCnpj(dataAbertura: string | null | undefined, agora: Date = new Date()): FaixaTempoCnpj | null {
  const anos = anosDeAbertura(dataAbertura, agora)
  if (anos === null) return null
  return FAIXAS_TEMPO_CNPJ.find((faixa) => anos >= faixa) ?? null
}

export function textoTempoCnpj(faixa: FaixaTempoCnpj): string {
  return `CNPJ aberto há mais de ${faixa} ${faixa === 1 ? 'ano' : 'anos'}`
}
