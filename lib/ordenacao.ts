//lib/ordenacao.ts
//
// Ordem dos resultados da busca (menor peso aparece primeiro):
//   vitrine → perfis reais (cadastro direto ou assumido) → curadoria pública.
// Dentro de cada faixa, quem tem nota melhor vem antes. Perfis verificados sobem uma faixa.

type Prestador = {
  origem_tipo: string | null
  verificado: boolean | null
  media_nota?: number | null
}

// Perfis de gente que se cadastrou ou assumiu o próprio perfil.
// 'proprio' é o nome antigo de 'registro_direto' e fica por compatibilidade.
const ORIGENS_REAIS = ['registro_direto', 'reivindicado', 'proprio']

export function pesoOrdenacao(p: Prestador): number {
  const nota = p.media_nota || 0
  const ajusteNota = (1 - nota / 5) * 0.99
  if (p.origem_tipo === 'vitrine') return -1
  if (p.origem_tipo === 'curadoria_publica') return 10
  const real = ORIGENS_REAIS.includes(p.origem_tipo ?? '')
  if (real && p.verificado) return 0 + ajusteNota
  if (real) return 1 + ajusteNota
  return 2 + ajusteNota
}
