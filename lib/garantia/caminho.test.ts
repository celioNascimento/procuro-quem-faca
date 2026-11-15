import { describe, it, expect } from 'vitest'
import { caminhoPertenceAoCaso } from './caminho'

const CASO = '11111111-1111-1111-1111-111111111111'
const OUTRO = '22222222-2222-2222-2222-222222222222'

describe('caminhoPertenceAoCaso', () => {
  it('aceita arquivo dentro da pasta do caso', () => {
    expect(caminhoPertenceAoCaso(`${CASO}/0.123.jpg`, CASO)).toBe(true)
  })
  it('recusa arquivo de outro caso', () => {
    expect(caminhoPertenceAoCaso(`${OUTRO}/0.123.jpg`, CASO)).toBe(false)
  })
  it('recusa tentativa de subir de pasta ou usar caminhos estranhos', () => {
    expect(caminhoPertenceAoCaso(`${CASO}/../${OUTRO}/a.jpg`, CASO)).toBe(false)
    expect(caminhoPertenceAoCaso(`${CASO}//a.jpg`, CASO)).toBe(false)
    expect(caminhoPertenceAoCaso(`${CASO}/..\\a.jpg`, CASO)).toBe(false)
  })
  it('recusa o que não é texto, é uma URL ou está fora da pasta', () => {
    expect(caminhoPertenceAoCaso(null, CASO)).toBe(false)
    expect(caminhoPertenceAoCaso(`https://x.supabase.co/${CASO}/a.jpg`, CASO)).toBe(false)
    expect(caminhoPertenceAoCaso(`${CASO}`, CASO)).toBe(false)
    expect(caminhoPertenceAoCaso(`${CASO}/${'a'.repeat(400)}`, CASO)).toBe(false)
  })
})
