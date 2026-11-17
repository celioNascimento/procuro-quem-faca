// lib/cnpj/verificar.test.ts
import { describe, expect, it, vi } from 'vitest'
import type { DadosCnpj } from './consulta'
import { verificarCnpj, type RepositorioCnpj } from './verificar'

const CNPJ = '11.222.333/0001-81'

const dados: DadosCnpj = {
  cnpj: '11222333000181', razaoSocial: 'JOAO DA SILVA', nomeFantasia: null, situacao: 'ATIVA',
  porte: null, naturezaJuridica: null, mei: true, cnaeCodigo: '4330404', cnaeDescricao: null,
  dataAbertura: '2015-03-10', socios: [], fonte: 'brasilapi',
}

function repo(emUso = false) {
  const gravar = vi.fn(async () => {})
  const r: RepositorioCnpj = { cnpjEmUsoPorOutro: vi.fn(async () => emUso), gravar }
  return { r, gravar }
}

const agora = () => new Date('2026-11-17T12:00:00Z')

describe('verificarCnpj', () => {
  it('aprova na hora quando o nome confere e grava com validade de 35 dias', async () => {
    const { r, gravar } = repo()
    const res = await verificarCnpj(
      { prestadorId: 7, nomePrestador: 'João da Silva', cnpjBruto: CNPJ },
      { repositorio: r, consultar: async () => ({ ok: true, dados }), agora },
    )
    expect(res.http).toBe(200)
    expect(res.http === 200 && res.corpo.status).toBe('aprovada')
    expect(gravar).toHaveBeenCalledWith(expect.objectContaining({ prestadorId: 7, status: 'aprovada', validoAte: '2026-12-22' }))
  })

  it('envia para a fila quando o nome não confere', async () => {
    const { r, gravar } = repo()
    const res = await verificarCnpj(
      { prestadorId: 7, nomePrestador: 'Pedro', cnpjBruto: CNPJ },
      { repositorio: r, consultar: async () => ({ ok: true, dados }), agora },
    )
    expect(res.http === 200 && res.corpo.status).toBe('pendente')
    expect(gravar).toHaveBeenCalledWith(expect.objectContaining({ status: 'pendente', motivo: 'nome_nao_confere' }))
  })

  it('recusa CNPJ inválido sem consultar nada', async () => {
    const { r, gravar } = repo()
    const consultar = vi.fn()
    const res = await verificarCnpj({ prestadorId: 7, nomePrestador: 'X', cnpjBruto: '11.222.333/0001-80' }, { repositorio: r, consultar })
    expect(res.http).toBe(400)
    expect(consultar).not.toHaveBeenCalled()
    expect(gravar).not.toHaveBeenCalled()
  })

  it('recusa entrada que não é texto', async () => {
    const { r } = repo()
    const res = await verificarCnpj({ prestadorId: 7, nomePrestador: 'X', cnpjBruto: 123 }, { repositorio: r })
    expect(res.http).toBe(400)
  })

  it('recusa CNPJ já ligado a outro perfil, sem revelar qual', async () => {
    const { r, gravar } = repo(true)
    const res = await verificarCnpj({ prestadorId: 7, nomePrestador: 'João da Silva', cnpjBruto: CNPJ }, { repositorio: r, consultar: async () => ({ ok: true, dados }) })
    expect(res.http).toBe(409)
    expect(gravar).not.toHaveBeenCalled()
  })

  it('responde 422 quando a Receita não tem o CNPJ', async () => {
    const { r, gravar } = repo()
    const res = await verificarCnpj({ prestadorId: 7, nomePrestador: 'X', cnpjBruto: CNPJ }, { repositorio: r, consultar: async () => ({ ok: false, motivo: 'nao_encontrado' }) })
    expect(res.http).toBe(422)
    expect(gravar).not.toHaveBeenCalled()
  })

  it('responde 503 quando as fontes estão indisponíveis, sem gravar nada', async () => {
    const { r, gravar } = repo()
    const res = await verificarCnpj({ prestadorId: 7, nomePrestador: 'X', cnpjBruto: CNPJ }, { repositorio: r, consultar: async () => ({ ok: false, motivo: 'indisponivel' }) })
    expect(res.http).toBe(503)
    expect(gravar).not.toHaveBeenCalled()
  })
})
