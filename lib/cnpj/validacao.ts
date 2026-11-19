// lib/cnpj/validacao.ts
// CNPJ com 14 caracteres: 12 base (dígitos ou letras A-Z) + 2 dígitos verificadores.
// Regra da Receita (formato alfanumérico, desde 31/07/2026): o valor de cada
// caractere é o código ASCII menos 48, então '0'-'9' valem 0-9 e 'A'-'Z' valem 17-42.
// Os dígitos verificadores usam módulo 11. CNPJs antigos (só dígitos) seguem a mesma conta.

const PESOS_DV1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
const PESOS_DV2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]

/** Remove máscara e espaços, passa para maiúsculas. */
export function normalizarCnpj(valor: string): string {
  return (valor ?? '').toUpperCase().replace(/[^0-9A-Z]/g, '')
}

/** Aplica a máscara XX.XXX.XXX/XXXX-XX. Aceita entrada parcial. */
export function mascararCnpj(valor: string): string {
  const v = normalizarCnpj(valor).slice(0, 14)
  return v
    .replace(/^(.{2})(.)/, '$1.$2')
    .replace(/^(.{2})\.(.{3})(.)/, '$1.$2.$3')
    .replace(/^(.{2})\.(.{3})\.(.{3})(.)/, '$1.$2.$3/$4')
    .replace(/^(.{2})\.(.{3})\.(.{3})\/(.{4})(.)/, '$1.$2.$3/$4-$5')
}

function valorDoCaractere(c: string): number {
  return c.charCodeAt(0) - 48
}

function digitoVerificador(base: string, pesos: number[]): number {
  const soma = pesos.reduce((acc, peso, i) => acc + valorDoCaractere(base[i]) * peso, 0)
  const resto = soma % 11
  const dv = 11 - resto
  return dv >= 10 ? 0 : dv
}

/**
 * Confere formato e dígitos verificadores.
 * Não consulta a Receita: isso é papel da etapa de consulta.
 */
export function cnpjValido(valor: string): boolean {
  const cnpj = normalizarCnpj(valor)
  if (!/^[0-9A-Z]{14}$/.test(cnpj)) return false
  // Sequências repetidas (00000000000000 etc.) passam na conta, mas não são CNPJ.
  if (/^(.)\1{13}$/.test(cnpj)) return false
  const base = cnpj.slice(0, 12)
  const dv1 = digitoVerificador(base, PESOS_DV1)
  const dv2 = digitoVerificador(base + dv1, PESOS_DV2)
  return cnpj.slice(12) === `${dv1}${dv2}`
}
