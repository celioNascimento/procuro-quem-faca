// lib/avaliacaoUtils.ts
export type AvaliacaoResumo = { nota: number }

export function deveExibirAvaliacao(avaliacoes: AvaliacaoResumo[]): boolean {
  return avaliacoes.length >= 10
}

export function calcularMedia(avaliacoes: AvaliacaoResumo[]): string {
  if (avaliacoes.length === 0) return '0'
  const soma = avaliacoes.reduce((acc, a) => acc + a.nota, 0)
  return (soma / avaliacoes.length).toFixed(1)
}