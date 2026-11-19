// lib/selos/nivel.ts
// Nível do prestador (Bronze, Prata...) com cor própria, igual no painel e no perfil público.
// Quem calcula o nível é o banco (nivel_do_prestador); aqui só decidimos como mostrar.

export type ApresentacaoNivel = {
  chave: string | null
  nome: string
  /** Classes do selo (fundo, texto e borda). Bronze cobre, Prata cinza-azulado. */
  classes: string
  /** Cor da borda da caixa/foto. Vazia quando não há nível: fica a borda neutra de sempre. */
  borda: string
  /** Mesma cor, com prioridade sobre outras bordas da peça (foto do card, que já traz cor própria). */
  bordaForte: string
  /** O que falta para o próximo nível, em linguagem simples. null quando não há próximo. */
  proximo: string | null
}

const POR_NIVEL: Record<string, Omit<ApresentacaoNivel, 'chave'>> = {
  bronze: {
    nome: 'Bronze',
    classes: 'bg-amber-100 text-amber-900 border-amber-300',
    borda: 'border-amber-500',
    bordaForte: 'border-amber-500!',
    proximo: 'Para chegar ao Prata: concluir 10 serviços avaliados por 10 clientes diferentes.',
  },
  prata: {
    nome: 'Prata',
    classes: 'bg-slate-200 text-slate-800 border-slate-400',
    borda: 'border-slate-400',
    bordaForte: 'border-slate-400!',
    proximo: 'Para chegar ao Ouro: envie a apólice do seu seguro de responsabilidade civil, na aba Seguro.',
  },
  ouro: {
    nome: 'Ouro',
    classes: 'bg-yellow-100 text-yellow-900 border-yellow-400',
    borda: 'border-yellow-500',
    bordaForte: 'border-yellow-500!',
    proximo: 'Para chegar ao Diamante: envie a certidão negativa de débitos federais (CND), na aba CND.',
  },
  diamante: {
    nome: 'Diamante',
    classes: 'bg-sky-100 text-sky-900 border-sky-400',
    borda: 'border-sky-500',
    bordaForte: 'border-sky-500!',
    proximo: null,
  },
}

const SEM_NIVEL: ApresentacaoNivel = {
  chave: null,
  nome: 'Sem nível ainda',
  classes: 'bg-slate-100 text-slate-600 border-slate-200',
  borda: '',
  bordaForte: '',
  proximo: 'Para chegar ao Bronze: confirme o seu CNPJ ativo.',
}

export function apresentarNivel(nivel: string | null | undefined): ApresentacaoNivel {
  const dados = nivel ? POR_NIVEL[nivel] : undefined
  return dados ? { chave: nivel as string, ...dados } : SEM_NIVEL
}
