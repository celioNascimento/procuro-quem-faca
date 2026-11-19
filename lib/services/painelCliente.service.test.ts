import { VERSAO_AVISO_FEED } from '@/config/feed'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/supabase', () => ({ supabase: { rpc: vi.fn(), from: vi.fn() } }))

import { supabase } from '@/lib/supabase'
import { aceitarServico, recusarServico, retirarDoFeed, AcaoRecusadaError, mensagemDeErroDaAcao } from '@/lib/services/painelCliente.service'

const rpc = () => vi.mocked(supabase.rpc)

describe('autorizar e recusar serviço', () => {
  beforeEach(() => vi.resetAllMocks())

  it('autoriza pela função do banco', async () => {
    rpc().mockResolvedValue({ data: 'ok', error: null } as never)
    await expect(aceitarServico('p1', 'Ana')).resolves.toBeUndefined()
    expect(rpc()).toHaveBeenCalledWith('aceitar_projeto', { p_projeto_id: 'p1', p_nome: 'Ana', p_feed_versao: VERSAO_AVISO_FEED })
  })

  it('quando o banco recusa, o erro leva o código (ex.: conta que não é a dona)', async () => {
    rpc().mockResolvedValue({ data: 'nao_e_dono', error: null } as never)
    const erro = await aceitarServico('p1', 'Ana').catch(e => e)
    expect(erro).toBeInstanceOf(AcaoRecusadaError)
    expect(erro.codigo).toBe('nao_e_dono')
  })

  it('recusar também devolve o código', async () => {
    rpc().mockResolvedValue({ data: 'status_invalido', error: null } as never)
    await expect(recusarServico('p1')).rejects.toMatchObject({ codigo: 'status_invalido' })
  })
})

describe('retirar do feed', () => {
  beforeEach(() => vi.resetAllMocks())
  it('chama a função do banco com o id do trabalho', async () => {
    rpc().mockResolvedValue({ data: 'ok', error: null } as never)
    await expect(retirarDoFeed('p1')).resolves.toBeUndefined()
    expect(rpc()).toHaveBeenCalledWith('revogar_feed_projeto', { p_projeto_id: 'p1' })
  })
  it('conta que não é a dona recebe o código de volta', async () => {
    rpc().mockResolvedValue({ data: 'nao_e_dono', error: null } as never)
    await expect(retirarDoFeed('p1')).rejects.toMatchObject({ codigo: 'nao_e_dono' })
  })
  it('nunca_esteve_no_feed vira frase clara', () => {
    expect(mensagemDeErroDaAcao(new AcaoRecusadaError('nunca_esteve_no_feed'))).toMatch(/não está no feed/i)
  })
})

describe('mensagemDeErroDaAcao', () => {
  it.each([
    ['nao_e_dono', /outra conta/i],
    ['status_invalido', /não está mais aguardando/i],
    ['nao_autenticado', /sessão expirou/i],
    ['nao_encontrado', /novo link/i],
  ])('%s vira uma frase clara', (codigo, regex) => {
    expect(mensagemDeErroDaAcao(new AcaoRecusadaError(codigo))).toMatch(regex)
  })

  it('erro inesperado (rede) vira orientação simples', () => {
    expect(mensagemDeErroDaAcao(new Error('Failed to fetch'))).toMatch(/tente de novo/i)
  })
})
