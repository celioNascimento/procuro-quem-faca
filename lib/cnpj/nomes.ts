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
 * A Receita acrescenta um número à razão social do MEI, de dois jeitos:
 *  - no início, os 8 dígitos-base do CNPJ (confirmado em consulta real: "47.403.170 JORGE PAULO DE LIMA");
 *  - no fim, o CPF (ex.: "JOAO DA SILVA 12345678901"), às vezes mascarado ("***.123.456-**").
 * Remove os dois, para o nome ficar só com o nome da pessoa.
 */
export function removerCpfDoNomeMei(razaoSocial: string): string {
  return (razaoSocial ?? '')
    .replace(/^\s*\d{2}\.?\d{3}\.?\d{3}\s+/, '')
    .replace(/\s*(\d{11}|[*\d.\-]*\*[*\d.\-]*)\s*$/, '')
    .trim()
}
