// lib/cnpj/nomes.ts
// Comparação de nomes: sem acento, sem maiúsculas, sem pontuação e com espaços colapsados.

export function normalizarNome(valor: string): string {
  return (valor ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toUpperCase()
    .replace(/[^A-Z0-9 ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * A Receita acrescenta o CPF ao nome do MEI (ex.: "JOAO DA SILVA 12345678901"),
 * às vezes mascarado ("***.123.456-**"). Remove esse trecho do fim do nome.
 */
export function removerCpfDoNomeMei(razaoSocial: string): string {
  return (razaoSocial ?? '')
    .replace(/\s*(\d{11}|[*\d.\-]*\*[*\d.\-]*)\s*$/, '')
    .trim()
}
