// lib/selos/nivel.ts
// Nível do prestador (Bronze, Prata...) com cor própria, igual no painel e no perfil público.
// Quem calcula o nível é o banco (nivel_do_prestador); aqui só decidimos como mostrar.

export type ApresentacaoNivel = {
  chave: string | null
  nome: string
  /** Classes do selo (fundo, texto e borda). Bronze cobre, Prata cinza-azulado. */
  classes: string
  /** O que falta para o próximo nível, em linguagem simples. null quando não há próximo. */
  proximo: string | null
}

const POR_NIVEL: Record<string, Omit<ApresentacaoNivel, 'chave'>> = {
  bronze: {
    nome: 'Bronze',
    classes: 'bg-amber-100 text-amber-900 border-amber-300',
    proximo: 'Para chegar ao Prata: concluir 10 serviços avaliados por 10 clientes diferentes.',
  },
  prata: {
    nome: 'Prata',
    classes: 'bg-slate-200 text-slate-800 border-slate-400',
    proximo: null,
  },
}

const SEM_NIVEL: ApresentacaoNivel = {
  chave: null,
  nome: 'Sem nível ainda',
  classes: 'bg-slate-100 text-slate-600 border-slate-200',
  proximo: 'Para chegar ao Bronze: confirme o seu CNPJ ativo.',
}

export function apresentarNivel(nivel: string | null | undefined): ApresentacaoNivel {
  const dados = nivel ? POR_NIVEL[nivel] : undefined
  return dados ? { chave: nivel as string, ...dados } : SEM_NIVEL
}
