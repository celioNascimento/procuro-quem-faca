// config/selos.ts
// Regras dos selos calculados pelo sistema. Os mesmos números existem no banco
// (funções experiencia_no_pqf e selos_publicos); se mudar aqui, mude lá na mesma migração.

/** Experiência no PQF: serviços avaliados por clientes diferentes (contas diferentes, nota efetiva >= 3). */
export const META_EXPERIENCIA = { servicos: 10, clientes: 10 } as const

/** Faixas do selo "Tempo de CNPJ", em anos completos desde a abertura. Abaixo de 1 ano não há selo. */
export const FAIXAS_TEMPO_CNPJ = [5, 3, 1] as const
