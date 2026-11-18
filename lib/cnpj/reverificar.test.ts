import { describe, expect, it, vi } from 'vitest'
import { reverificarCnpjs, type RepositorioReverificacao } from './reverificar'
import type { DadosCnpj, ResultadoConsulta } from './consulta'

const dados = (situacao: string): DadosCnpj => ({
  cnpj: '47403170000180', razaoSocial: 'X', nomeFantasia: null, situacao, porte: null,
  naturezaJuridica: null, mei: true, cnaeCodigo: null, cnaeDescricao: null, dataAbertura: null,
  socios: [], fonte: 'brasilapi',
})
const ok = (situacao: string): ResultadoConsulta => ({ ok: true, dados: dados(situacao) })

function montar(pendentes: { prestadorId: number; cnpj: string }[], registrar = vi.fn().mockResolvedValue('renovada')) {
  const repositorio: RepositorioReverificacao = { listarPendentes: vi.fn().mockResolvedValue(pendentes), registrar }
  return { repositorio, registrar }
}

describe('reverificarCnpjs', () => {
  it('sem pendentes, não consulta nada', async () => {
    const { repositorio } = montar([])
    const consultar = vi.fn()
    const r = await reverificarCnpjs({ repositorio, consultar })
    expect(consultar).not.toHaveBeenCalled()
    expect(r.analisados).toBe(0)
  })

  it('repassa situação e fonte ao banco e conta renovados e enviados para a fila', async () => {
    const registrar = vi.fn().mockResolvedValueOnce('renovada').mockResolvedValueOnce('selo_pausado')
    const { repositorio } = montar([{ prestadorId: 1, cnpj: 'A' }, { prestadorId: 2, cnpj: 'B' }], registrar)
    const consultar = vi.fn().mockResolvedValueOnce(ok('ATIVA')).mockResolvedValueOnce(ok('SUSPENSA'))
    const r = await reverificarCnpjs({ repositorio, consultar })
    expect(registrar).toHaveBeenNthCalledWith(1, 1, 'ATIVA', 'brasilapi')
    expect(registrar).toHaveBeenNthCalledWith(2, 2, 'SUSPENSA', 'brasilapi')
    expect(r).toMatchObject({ analisados: 2, renovados: 1, selosPausados: 1, semResposta: 0, erros: 0 })
  })

  it('fontes fora do ar: não grava nada (o selo é mantido) e segue para o próximo', async () => {
    const { repositorio, registrar } = montar([{ prestadorId: 1, cnpj: 'A' }, { prestadorId: 2, cnpj: 'B' }])
    const consultar = vi.fn()
      .mockResolvedValueOnce({ ok: false, motivo: 'indisponivel' })
      .mockResolvedValueOnce({ ok: false, motivo: 'nao_encontrado' })
    const r = await reverificarCnpjs({ repositorio, consultar })
    expect(registrar).not.toHaveBeenCalled()
    expect(r.semResposta).toBe(2)
  })

  it('erro em um CNPJ não para os demais', async () => {
    const { repositorio, registrar } = montar([{ prestadorId: 1, cnpj: 'A' }, { prestadorId: 2, cnpj: 'B' }])
    const consultar = vi.fn().mockRejectedValueOnce(new Error('rede')).mockResolvedValueOnce(ok('ATIVA'))
    const r = await reverificarCnpjs({ repositorio, consultar })
    expect(registrar).toHaveBeenCalledTimes(1)
    expect(r).toMatchObject({ analisados: 2, erros: 1, renovados: 1 })
  })

  it('selo já revogado pelo admin no meio do caminho conta como ignorado', async () => {
    const { repositorio } = montar([{ prestadorId: 1, cnpj: 'A' }], vi.fn().mockResolvedValue('ignorada'))
    const r = await reverificarCnpjs({ repositorio, consultar: vi.fn().mockResolvedValue(ok('ATIVA')) })
    expect(r.ignorados).toBe(1)
  })

  it('respeita o limite pedido ao repositório', async () => {
    const { repositorio } = montar([])
    await reverificarCnpjs({ repositorio, consultar: vi.fn(), limite: 5 })
    expect(repositorio.listarPendentes).toHaveBeenCalledWith(5)
  })

  it('bateu o limite das fontes: para na hora, não insiste e não marca o que sobrou como falha', async () => {
    const { repositorio, registrar } = montar([{ prestadorId: 1, cnpj: 'A' }, { prestadorId: 2, cnpj: 'B' }, { prestadorId: 3, cnpj: 'C' }])
    const consultar = vi.fn().mockResolvedValueOnce(ok('ATIVA')).mockResolvedValueOnce({ ok: false, motivo: 'limite' })
    const r = await reverificarCnpjs({ repositorio, consultar })
    expect(consultar).toHaveBeenCalledTimes(2) // o terceiro nem é consultado
    expect(registrar).toHaveBeenCalledTimes(1)
    expect(r).toMatchObject({ analisados: 1, renovados: 1, semResposta: 0, erros: 0, parouPor: 'limite' })
  })

  it('termina o lote normalmente sem parar por nada', async () => {
    const { repositorio } = montar([{ prestadorId: 1, cnpj: 'A' }])
    const r = await reverificarCnpjs({ repositorio, consultar: vi.fn().mockResolvedValue(ok('ATIVA')) })
    expect(r.parouPor).toBeNull()
  })

  it('passou do prazo da função: não começa outra consulta', async () => {
    const { repositorio } = montar([{ prestadorId: 1, cnpj: 'A' }, { prestadorId: 2, cnpj: 'B' }])
    let t = 0
    const consultar = vi.fn(async () => { t += 45_000; return ok('ATIVA') })
    const r = await reverificarCnpjs({ repositorio, consultar, agora: () => t, prazoMs: 40_000 })
    expect(consultar).toHaveBeenCalledTimes(1)
    expect(r.parouPor).toBe('tempo')
  })

  it('o lote padrão é de 3 por chamada', async () => {
    const { repositorio } = montar([])
    await reverificarCnpjs({ repositorio, consultar: vi.fn() })
    expect(repositorio.listarPendentes).toHaveBeenCalledWith(3)
  })
})
