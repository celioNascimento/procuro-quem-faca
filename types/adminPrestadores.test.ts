import { describe, expect, it } from 'vitest'
import { formatOrigem, getEtapaLabel, getMensagem, getPrestadorStage } from '@/types/adminPrestadores'

const CONTA = 'user-1'

describe('getPrestadorStage', () => {
  it('perfil da curadoria sem conta é "publico"', () => {
    expect(getPrestadorStage({ user_id: null, origem_tipo: 'curadoria_publica', status: 'ativo', ativacao_status: 'nao_enviado' })).toBe('publico')
  })

  it('quem assumiu um perfil da curadoria é "reivindicado"', () => {
    expect(getPrestadorStage({ user_id: CONTA, origem_tipo: 'reivindicado', status: 'ativo', ativacao_status: 'enviado' })).toBe('reivindicado')
  })

  it('formato antigo: curadoria com conta também é "reivindicado"', () => {
    expect(getPrestadorStage({ user_id: CONTA, origem_tipo: 'curadoria_publica', status: 'ativo', ativacao_status: 'enviado' })).toBe('reivindicado')
  })

  it('quem criou o próprio perfil NÃO aparece como reivindicado', () => {
    expect(getPrestadorStage({ user_id: CONTA, origem_tipo: 'registro_direto', status: 'ativo', ativacao_status: 'nao_enviado' })).toBe('direto')
  })

  it('conta com cadastro não concluído é "cadastro", seja qual for a origem', () => {
    expect(getPrestadorStage({ user_id: CONTA, origem_tipo: 'registro_direto', status: 'pendente', ativacao_status: 'nao_enviado' })).toBe('cadastro')
    expect(getPrestadorStage({ user_id: CONTA, origem_tipo: 'reivindicado', status: 'pendente', ativacao_status: 'enviado' })).toBe('cadastro')
  })

  it('perfil com conta e ativação completa é "ativo", seja qual for a origem', () => {
    expect(getPrestadorStage({ user_id: CONTA, origem_tipo: 'registro_direto', status: 'ativo', ativacao_status: 'perfil_completo' })).toBe('ativo')
    expect(getPrestadorStage({ user_id: CONTA, origem_tipo: 'reivindicado', status: 'ativo', ativacao_status: 'avaliacao_recebida' })).toBe('ativo')
  })

  it('perfil sem conta que começou o cadastro é "cadastro"', () => {
    expect(getPrestadorStage({ user_id: null, origem_tipo: 'registro_direto', status: 'pendente' })).toBe('cadastro')
    expect(getPrestadorStage({ user_id: null, origem_tipo: 'curadoria_publica', status: 'pendente' })).toBe('cadastro')
  })

  it('conta sem origem registrada cai em "direto" e não quebra', () => {
    expect(getPrestadorStage({ user_id: CONTA, origem_tipo: null, status: 'ativo', ativacao_status: null })).toBe('direto')
  })
})

describe('textos das etapas', () => {
  it('cada origem tem um nome próprio', () => {
    expect(formatOrigem('registro_direto')).toBe('Cadastro direto')
    expect(formatOrigem('reivindicado')).toBe('Perfil assumido')
    expect(formatOrigem('curadoria_publica')).toBe('Curadoria pública')
    expect(formatOrigem(null)).toBe('Curadoria pública')
  })

  it('quem se cadastrou direto não recebe a mensagem de "perfil reivindicado"', () => {
    expect(getMensagem('direto', 'Ana')).not.toMatch(/reivindicad/i)
    expect(getMensagem('reivindicado', 'Ana')).toMatch(/reivindicad/i)
    expect(getEtapaLabel('direto')).toBe('Cadastro direto')
  })
})
