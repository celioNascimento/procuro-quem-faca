//lib/ads/categoria-segmento.ts

export type SegmentoAd =
  | 'construcao'
  | 'pintura'
  | 'eletrica'
  | 'hidraulica'
  | 'limpeza'
  | 'jardinagem'
  | 'informatica'
  | 'automotivo'
  | 'geral'

const MAPA: Record<string, SegmentoAd> = {
  pedreiro: 'construcao',
  alvenaria: 'construcao',
  reforma: 'construcao',
  pintor: 'pintura',
  pintura: 'pintura',
  eletricista: 'eletrica',
  encanador: 'hidraulica',
  hidraulica: 'hidraulica',
  limpeza: 'limpeza',
  diarista: 'limpeza',
  faxina: 'limpeza',
  jardineiro: 'jardinagem',
  jardinagem: 'jardinagem',
  informatica: 'informatica',
  'mecânica geral': 'automotivo',
  'funilaria e pintura automotiva': 'automotivo',
  'auto elétrica': 'automotivo',
  borracharia: 'automotivo',
  'lavagem e polimento': 'automotivo',
  'insulfilm e envelopamento': 'automotivo',
  'som e alarme automotivo': 'automotivo',
  'ar condicionado automotivo': 'automotivo',
  'vidraceiro automotivo': 'automotivo',
  'alinhamento e balanceamento': 'automotivo',
  'guincho e reboque': 'automotivo',
}

export function resolverSegmento(categoria?: string): SegmentoAd {
  if (!categoria) return 'geral'
  const key = categoria.toLowerCase().trim()
  return MAPA[key] ?? 'geral'
}
