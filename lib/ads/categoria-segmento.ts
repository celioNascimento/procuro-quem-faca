export type SegmentoAd =
  | 'construcao'
  | 'pintura'
  | 'eletrica'
  | 'hidraulica'
  | 'limpeza'
  | 'jardinagem'
  | 'informatica'
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
}

export function resolverSegmento(categoria?: string): SegmentoAd {
  if (!categoria) return 'geral'
  const key = categoria.toLowerCase().trim()
  return MAPA[key] ?? 'geral'
}