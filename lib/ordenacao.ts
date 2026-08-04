//lib/ordenacao.ts

type Prestador = {
  origem_tipo: string
  verificado: boolean
  media_nota: number
}

export function pesoOrdenacao(p: Prestador): number {
  const nota = p.media_nota || 0
  if (p.origem_tipo === 'vitrine') return -1
  const isAtivo = ['proprio', 'reivindicado'].includes(p.origem_tipo)
  if (isAtivo && p.verificado)  return 0 + (1 - nota / 5) * 0.99
  if (isAtivo && !p.verificado) return 1 + (1 - nota / 5) * 0.99
  if (p.origem_tipo === 'curadoria_publica') return 10
  return 2 + (1 - nota / 5) * 0.99
}