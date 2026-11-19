import { describe, expect, it } from 'vitest'
import {
  caminhoDoArquivo, dataLimiteDoPedido, diasAte, diasEmEspera, faseDoDocumento, mensagemAviso, podeEnviar, textoSeloPublico, textoVencimento,
  validarArquivo, validarSeguro,
} from './documentos'
import { apresentarNivel } from './nivel'

const HOJE = new Date(2026, 10, 18) // 18/11/2026

describe('faseDoDocumento', () => {
  it('sem registro: sem', () => expect(faseDoDocumento(null, HOJE)).toBe('sem'))
  it('pedido em análise tem prioridade', () =>
    expect(faseDoDocumento({ status: 'aprovada', valido_ate: '2027-05-01', dados: { pedido: {} } }, HOJE)).toBe('em_conferencia'))
  it('aprovado com folga', () =>
    expect(faseDoDocumento({ status: 'aprovada', valido_ate: '2027-05-01', dados: {} }, HOJE)).toBe('aprovado'))
  it('a vencer nos últimos 30 dias', () =>
    expect(faseDoDocumento({ status: 'aprovada', valido_ate: '2026-12-10', dados: {} }, HOJE)).toBe('a_vencer'))
  it('vencido vira expirado mesmo que o status ainda seja aprovada', () =>
    expect(faseDoDocumento({ status: 'aprovada', valido_ate: '2026-11-01', dados: {} }, HOJE)).toBe('expirado'))
  it('rejeitado e expirado', () => {
    expect(faseDoDocumento({ status: 'rejeitada', valido_ate: null, dados: {} }, HOJE)).toBe('rejeitado')
    expect(faseDoDocumento({ status: 'expirada', valido_ate: '2026-01-01', dados: {} }, HOJE)).toBe('expirado')
  })
})

describe('podeEnviar', () => {
  it('libera em sem, rejeitado, expirado e a_vencer; bloqueia em análise e aprovado', () => {
    expect(['sem', 'rejeitado', 'expirado', 'a_vencer'].every((f) => podeEnviar(f as never))).toBe(true)
    expect(podeEnviar('em_conferencia')).toBe(false)
    expect(podeEnviar('aprovado')).toBe(false)
  })
})

describe('validarArquivo', () => {
  it('aceita PDF e imagem até 5 MB', () => {
    expect(validarArquivo({ size: 1000, type: 'application/pdf' })).toBeNull()
    expect(validarArquivo({ size: 1000, type: 'image/jpeg' })).toBeNull()
  })
  it('recusa tipo, tamanho e vazio', () => {
    expect(validarArquivo({ size: 1000, type: 'text/html' })).toMatch(/PDF/)
    expect(validarArquivo({ size: 6 * 1024 * 1024, type: 'application/pdf' })).toMatch(/5 MB/)
    expect(validarArquivo({ size: 0, type: 'application/pdf' })).toMatch(/vazio/)
  })
})

describe('validarSeguro', () => {
  const ok = { seguradora: 'Porto', numeroApolice: '123', validade: '2027-01-01' }
  it('aceita dados completos', () => expect(validarSeguro(ok, HOJE)).toBeNull())
  it('exige cada campo e validade futura', () => {
    expect(validarSeguro({ ...ok, seguradora: ' ' }, HOJE)).toMatch(/seguradora/)
    expect(validarSeguro({ ...ok, numeroApolice: '' }, HOJE)).toMatch(/apólice/)
    expect(validarSeguro({ ...ok, validade: '' }, HOJE)).toMatch(/até quando/)
    expect(validarSeguro({ ...ok, validade: '2026-11-01' }, HOJE)).toMatch(/validade/)
  })
})

describe('textos e caminhos', () => {
  it('diasAte conta dias inteiros', () => expect(diasAte('2026-11-21', HOJE)).toBe(3))
  it('vencimento', () => {
    expect(textoVencimento('2026-11-19', HOJE)).toBe('Válido até 19/11/2026 (1 dia)')
    expect(textoVencimento('2026-11-18', HOJE)).toMatch(/Vence hoje/)
    expect(textoVencimento('2026-11-10', HOJE)).toMatch(/Venceu/)
  })
  it('caminho começa pelo user_id e sanitiza a extensão', () => {
    expect(caminhoDoArquivo('u1', 'cnd', 'Certidao.PDF', 5)).toBe('u1/cnd-5.pdf')
    expect(caminhoDoArquivo('u1', 'seguro', 'sem-extensao', 5)).toMatch(/^u1\/seguro-5\./)
  })
  it('texto público diz só o que foi conferido', () => {
    expect(textoSeloPublico('seguro')).toMatch(/conferida/)
    expect(textoSeloPublico('cnd')).toMatch(/CND/)
  })
  it('aviso fala em dias', () => expect(mensagemAviso('cnd', 3).titulo).toBe('Seu selo de CND vence em 3 dias'))
})

describe('níveis Ouro e Diamante', () => {
  it('Ouro e Diamante têm nome e cor próprios', () => {
    expect(apresentarNivel('ouro').nome).toBe('Ouro')
    expect(apresentarNivel('diamante').nome).toBe('Diamante')
    expect(apresentarNivel('diamante').proximo).toBeNull()
    expect(apresentarNivel('prata').proximo).toMatch(/Ouro/)
  })
})

describe('pedido parado (60 dias)', () => {
  it('pedido expirado: aparece como fase própria e libera novo envio', () => {
    const v = { status: 'expirada', valido_ate: null, dados: { pedido_expirado: '2026-11-01T00:00:00Z' } }
    expect(faseDoDocumento(v, HOJE)).toBe('pedido_expirado')
    expect(podeEnviar('pedido_expirado')).toBe(true)
  })
  it('renovação que expirou não derruba o selo vigente', () => {
    const v = { status: 'aprovada', valido_ate: '2027-05-01', dados: { pedido_expirado: '2026-11-01T00:00:00Z' } }
    expect(faseDoDocumento(v, HOJE)).toBe('aprovado')
  })
  it('data limite = envio + 60 dias; sem data válida, null', () => {
    expect(dataLimiteDoPedido('2026-11-18T12:00:00Z')).toBe('2027-01-17')
    expect(dataLimiteDoPedido(null)).toBeNull()
    expect(dataLimiteDoPedido('lixo')).toBeNull()
  })
  it('dias em espera', () => {
    expect(diasEmEspera('2026-11-08T00:00:00Z', new Date('2026-11-18T00:00:00Z'))).toBe(10)
    expect(diasEmEspera(undefined)).toBe(0)
  })
})
