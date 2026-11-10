import { beforeEach, describe, expect, it, vi } from 'vitest'

const insert = vi.fn()
const consulta = { select: vi.fn(), eq: vi.fn(), in: vi.fn() }

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({ select: consulta.select, insert })),
  },
}))

import { buscarTiposAceitos, faltaAceitar, registrarConsentimentos } from '@/lib/services/consentimento.service'

function prepararConsulta(resultado: { data: unknown; error: unknown }) {
  consulta.select.mockReturnValue(consulta)
  consulta.eq.mockReturnValue(consulta)
  consulta.in.mockResolvedValue(resultado)
}

describe('faltaAceitar', () => {
  it('falta quando nenhum tipo foi aceito', () => {
    expect(faltaAceitar([])).toBe(true)
  })
  it('falta quando só um dos dois foi aceito', () => {
    expect(faltaAceitar(['termos_uso'])).toBe(true)
    expect(faltaAceitar(['politica_privacidade'])).toBe(true)
  })
  it('não falta quando os dois foram aceitos', () => {
    expect(faltaAceitar(['termos_uso', 'politica_privacidade'])).toBe(false)
  })
})

describe('buscarTiposAceitos', () => {
  beforeEach(() => vi.clearAllMocks())

  it('filtra por usuário, versão atual e aceite concedido', async () => {
    prepararConsulta({ data: [{ tipo: 'termos_uso' }], error: null })

    await expect(buscarTiposAceitos('u1', '2026-11')).resolves.toEqual(['termos_uso'])
    expect(consulta.eq).toHaveBeenCalledWith('user_id', 'u1')
    expect(consulta.eq).toHaveBeenCalledWith('versao_documento', '2026-11')
    expect(consulta.eq).toHaveBeenCalledWith('concedido', true)
  })

  it('não repete o tipo quando há mais de um registro', async () => {
    prepararConsulta({ data: [{ tipo: 'termos_uso' }, { tipo: 'termos_uso' }, { tipo: 'politica_privacidade' }], error: null })

    await expect(buscarTiposAceitos('u1', '2026-11')).resolves.toEqual(['termos_uso', 'politica_privacidade'])
  })

  it('propaga o erro do banco', async () => {
    prepararConsulta({ data: null, error: new Error('falhou') })

    await expect(buscarTiposAceitos('u1', '2026-11')).rejects.toThrow('falhou')
  })
})

describe('registrarConsentimentos', () => {
  beforeEach(() => vi.clearAllMocks())

  it('grava um registro por tipo com versão, origem e usuário', async () => {
    insert.mockResolvedValue({ error: null })

    await registrarConsentimentos({ userId: 'u1', origem: 'login', versao: '2026-11' })

    expect(insert).toHaveBeenCalledWith([
      { user_id: 'u1', prestador_id: null, tipo: 'termos_uso', versao_documento: '2026-11', concedido: true, origem: 'login' },
      { user_id: 'u1', prestador_id: null, tipo: 'politica_privacidade', versao_documento: '2026-11', concedido: true, origem: 'login' },
    ])
  })

  it('propaga o erro do banco', async () => {
    insert.mockResolvedValue({ error: new Error('sem permissão') })

    await expect(registrarConsentimentos({ userId: 'u1', origem: 'login' })).rejects.toThrow('sem permissão')
  })
})
