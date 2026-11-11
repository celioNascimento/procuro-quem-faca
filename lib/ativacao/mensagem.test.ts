import { describe, expect, it } from 'vitest'
import {
  linkPessoal,
  montarMensagemAtivacao,
  rotuloAcaoAtivacao,
  tipoMensagemAtivacao,
} from '@/lib/ativacao/mensagem'

const TOKEN = '3f2b8c1e-9d4a-4b6e-8f1a-2c7d5e9a0b13'
const base = { nome: 'Maria Souza', slug: 'maria-souza-eletricista', token: TOKEN }

describe('tipoMensagemAtivacao', () => {
  it('nunca contatado recebe o primeiro contato', () => {
    expect(tipoMensagemAtivacao({ ativacao_status: 'nao_enviado', ativacao_enviado_em: null })).toBe('primeiro_contato')
  })

  it.each(['enviado', 'respondeu_positivo', 'perfil_completo', 'avaliacao_recebida'])(
    'quem já foi contatado (%s) recebe a corretiva',
    (status) => expect(tipoMensagemAtivacao({ ativacao_status: status })).toBe('corretiva'),
  )

  it('data de envio registrada também conta como já contatado', () => {
    expect(tipoMensagemAtivacao({ ativacao_status: 'nao_enviado', ativacao_enviado_em: '2026-11-01T10:00:00Z' })).toBe('corretiva')
  })

  it('quem recusou recebe só o link de exclusão', () => {
    expect(tipoMensagemAtivacao({ ativacao_status: 'respondeu_negativo', ativacao_enviado_em: '2026-11-01T10:00:00Z' })).toBe('exclusao')
  })
})

describe('montarMensagemAtivacao', () => {
  it.each(['primeiro_contato', 'corretiva', 'exclusao', 'resposta_pedido'] as const)('%s: traz o link pessoal e a política de privacidade', (tipo) => {
    const msg = montarMensagemAtivacao({ tipo, ...base })
    expect(msg).toContain(linkPessoal(TOKEN))
    expect(msg).toContain('https://procuroquemfaca.com.br/privacidade')
  })

  it.each(['primeiro_contato', 'corretiva', 'exclusao', 'resposta_pedido'] as const)('%s: não promete que a plataforma apaga nem pede resposta para sair', (tipo) => {
    const msg = montarMensagemAtivacao({ tipo, ...base }).toLowerCase()
    expect(msg).not.toContain('eu apago')
    expect(msg).not.toContain('responda sair')
    expect(msg).not.toContain('apagamos')
  })

  it.each(['primeiro_contato', 'corretiva'] as const)('%s: explica a origem pública dos dados e quais dados são', (tipo) => {
    const msg = montarMensagemAtivacao({ tipo, ...base })
    expect(msg).toContain('divulga publicamente em anúncios online')
    expect(msg).toContain('nome, WhatsApp, serviço e cidade')
  })

  it('primeiro contato mantém o parâmetro de origem no link do perfil', () => {
    expect(montarMensagemAtivacao({ tipo: 'primeiro_contato', ...base })).toContain('/maria-souza-eletricista?src=ativacao')
  })

  it('usa sempre o domínio oficial', () => {
    expect(linkPessoal(TOKEN)).toBe(`https://procuroquemfaca.com.br/reivindicar?token=${TOKEN}`)
  })
})

describe('rotuloAcaoAtivacao', () => {
  it('mostra o rótulo certo para cada situação', () => {
    expect(rotuloAcaoAtivacao('primeiro_contato', 'nao_enviado')).toBe('Enviar WA')
    expect(rotuloAcaoAtivacao('primeiro_contato', 'sem_whatsapp')).toBe('Abrir WA')
    expect(rotuloAcaoAtivacao('corretiva', 'enviado')).toBe('Enviar aviso corretivo')
    expect(rotuloAcaoAtivacao('exclusao', 'respondeu_negativo')).toBe('Enviar link de exclusão')
    expect(rotuloAcaoAtivacao('resposta_pedido', 'recebida')).toBe('Enviar link ao WhatsApp do perfil')
  })
})
