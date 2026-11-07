import { describe, expect, it } from 'vitest'
import { gerarMatrizQr } from '@/lib/qr/qrcode'

const tamanho = (m: boolean[][]) => m.length

describe('gerarMatrizQr', () => {
  it('escolhe a versão pelo tamanho do texto (21 módulos na v1, +4 por versão)', () => {
    expect(tamanho(gerarMatrizQr('HELLO'))).toBe(21)
    expect(tamanho(gerarMatrizQr('x'.repeat(20)))).toBe(25)
    expect(tamanho(gerarMatrizQr('https://procuroquemfaca.com.br/eletrica-silva-londrina'))).toBe(33)
  })

  it('é quadrada e determinística', () => {
    const a = gerarMatrizQr('https://procuroquemfaca.com.br/a')
    const b = gerarMatrizQr('https://procuroquemfaca.com.br/a')
    expect(a.every(l => l.length === a.length)).toBe(true)
    expect(a).toEqual(b)
  })

  it('tem os três localizadores e o módulo escuro fixo', () => {
    const m = gerarMatrizQr('https://procuroquemfaca.com.br/a')
    const n = m.length
    const localizador = (cx: number, cy: number) => {
      for (let dy = 0; dy < 7; dy++) for (let dx = 0; dx < 7; dx++) {
        const borda = dx === 0 || dx === 6 || dy === 0 || dy === 6
        const centro = dx >= 2 && dx <= 4 && dy >= 2 && dy <= 4
        if (m[cy + dy][cx + dx] !== (borda || centro)) return false
      }
      return true
    }
    expect(localizador(0, 0)).toBe(true)
    expect(localizador(n - 7, 0)).toBe(true)
    expect(localizador(0, n - 7)).toBe(true)
    expect(m[n - 8][8]).toBe(true)
  })

  it('tem a temporização alternada na linha 6', () => {
    const m = gerarMatrizQr('https://procuroquemfaca.com.br/a')
    for (let i = 8; i < m.length - 8; i++) expect(m[6][i]).toBe(i % 2 === 0)
  })

  it('aceita acentos (UTF-8) e recusa texto acima da capacidade', () => {
    expect(() => gerarMatrizQr('Eletricista çãõ é')).not.toThrow()
    expect(() => gerarMatrizQr('y'.repeat(213))).not.toThrow()
    expect(() => gerarMatrizQr('y'.repeat(214))).toThrow(/longo demais/)
  })
})
