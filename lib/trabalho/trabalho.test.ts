import { describe, expect, it } from 'vitest'
import { descricaoOuPadrao, dicaDaDescricao, FRASE_NEUTRA, LIMITE_DESCRICAO, limparDescricao } from '@/lib/trabalho/descricaoFotos'
import { seloDoTrabalho } from '@/lib/trabalho/statusTrabalho'
import { enderecoDoWhatsapp, mensagemDeAceite, mensagemDeConclusao } from '@/lib/trabalho/mensagens'
import { passosDoTrabalho, proximaAcao, type SituacaoDoTrabalho } from '@/lib/trabalho/passos'

describe('dicaDaDescricao', () => {
  it('Antes e Durante usam convites neutros, que servem para qualquer ofício', () => {
    expect(dicaDaDescricao(1, 'Troca de fiação')).toBe('Como estava antes de começar?')
    expect(dicaDaDescricao(2, 'Troca de fiação')).toBe('O que está sendo feito?')
  })

  it('Depois usa o exemplo da categoria do prestador', () => {
    expect(dicaDaDescricao(3, 'Bolo de dois andares para 40 pessoas.')).toBe('Ex.: Bolo de dois andares para 40 pessoas.')
  })

  it('categoria sem exemplo cai na frase neutra, sem inventar um ofício', () => {
    expect(dicaDaDescricao(3, null)).toBe(FRASE_NEUTRA)
    expect(dicaDaDescricao(3, undefined)).toBe(FRASE_NEUTRA)
    expect(dicaDaDescricao(3, '   ')).toBe(FRASE_NEUTRA)
  })
})

describe('descricaoOuPadrao', () => {
  it('mostra a descrição escrita', () => {
    expect(descricaoOuPadrao(3, ' Pintei a sala ')).toBe('Pintei a sala')
  })

  it('sem descrição, usa o nome da etapa (nada de "nota técnica")', () => {
    expect(descricaoOuPadrao(1, null)).toBe('Antes do serviço')
    expect(descricaoOuPadrao(2, '')).toBe('Durante o serviço')
    expect(descricaoOuPadrao(3, undefined)).toBe('Depois do serviço')
    expect(descricaoOuPadrao(9, null)).toBe('Foto do serviço')
  })
})

describe('limparDescricao', () => {
  it('tira espaços e respeita o limite', () => {
    expect(limparDescricao('  oi  ')).toBe('oi')
    expect(limparDescricao('x'.repeat(LIMITE_DESCRICAO + 50))).toHaveLength(LIMITE_DESCRICAO)
  })
})

describe('seloDoTrabalho', () => {
  it('traduz o status do banco para palavras simples', () => {
    expect(seloDoTrabalho({ status: 'em_registro' }).texto).toBe('Rascunho: ainda não enviado ao cliente')
    expect(seloDoTrabalho({ status: 'pendente' }).texto).toBe('Aguardando o cliente aceitar')
    expect(seloDoTrabalho({ status: 'em_execucao' }).texto).toBe('Em andamento')
    expect(seloDoTrabalho({ status: 'em_execucao', aguardandoAvaliacao: true }).texto).toBe('Aguardando a avaliação do cliente')
    expect(seloDoTrabalho({ status: 'finalizado' })).toEqual({ texto: 'Concluído e avaliado', tom: 'sucesso' })
    expect(seloDoTrabalho({ status: 'em_disputa' }).tom).toBe('aviso')
  })

  it('garantia e reclamação têm prioridade sobre "concluído"', () => {
    expect(seloDoTrabalho({ status: 'finalizado', caso: 'garantia' }).texto).toBe('Garantia acionada')
    expect(seloDoTrabalho({ status: 'finalizado', caso: 'reclamacao' }).texto).toBe('Reclamação recebida')
  })

  it('status desconhecido ou ausente não quebra nem mostra palavra técnica', () => {
    expect(seloDoTrabalho({ status: undefined }).texto).toBe('Novo trabalho')
    expect(seloDoTrabalho({ status: 'qualquer_coisa' }).texto).toBe('Novo trabalho')
  })
})

describe('mensagens para o cliente', () => {
  it('aceite: cita o nome, o serviço e o link', () => {
    const m = mensagemDeAceite({ clienteNome: 'Maria', titulo: 'Pintura da sala', link: 'https://x.com/a' })
    expect(m).toContain('Olá, Maria!')
    expect(m).toContain('*Pintura da sala*')
    expect(m).toContain('https://x.com/a')
  })

  it('sem nome do cliente, a saudação continua correta', () => {
    expect(mensagemDeAceite({ clienteNome: '', titulo: 'T', link: 'l' })).toContain('Olá! ')
    expect(mensagemDeConclusao({ clienteNome: null, titulo: 'T', link: 'l' })).toContain('Olá! ')
  })

  it('conclusão pede a avaliação pelo link', () => {
    const m = mensagemDeConclusao({ clienteNome: 'Ana', titulo: 'Bolo', link: 'https://x.com/avaliar/1' })
    expect(m).toContain('avaliação')
    expect(m).toContain('https://x.com/avaliar/1')
  })

  it('endereço do WhatsApp usa o DDI do Brasil e codifica o texto', () => {
    expect(enderecoDoWhatsapp('(43) 99999-0000', 'oi tudo bem')).toBe('https://wa.me/5543999990000?text=oi%20tudo%20bem')
  })

  it('telefone curto não gera endereço', () => {
    expect(enderecoDoWhatsapp('9999', 'oi')).toBeNull()
  })
})

const base: SituacaoDoTrabalho = {
  semFotos: false, dadosValidos: false, projetoCriado: false, fotos: [false, false, false],
  aceiteEnviado: false, status: 'pendente', marcadoConcluido: false, aguardandoAvaliacao: false, concluido: false,
}
const estados = (s: SituacaoDoTrabalho) => passosDoTrabalho(s).map((p) => p.estado)

describe('passos do trabalho com fotos', () => {
  it('começo: o primeiro passo é o atual e o resto espera', () => {
    expect(estados(base)).toEqual(['atual', 'pendente', 'pendente', 'pendente', 'pendente'])
    expect(proximaAcao(base)).toMatch(/WhatsApp do cliente/)
  })

  it('dados válidos: falta a foto do antes', () => {
    const s = { ...base, dadosValidos: true }
    expect(estados(s)).toEqual(['feito', 'atual', 'pendente', 'pendente', 'pendente'])
    expect(proximaAcao(s)).toBe('Adicione a foto do antes.')
  })

  it('foto do antes enviada: falta mandar o aceite', () => {
    const s = { ...base, dadosValidos: true, projetoCriado: true, fotos: [true, false, false] as [boolean, boolean, boolean] }
    expect(estados(s)).toEqual(['feito', 'feito', 'atual', 'pendente', 'pendente'])
    expect(proximaAcao(s)).toBe('Envie o aceite ao cliente.')
  })

  it('aceite enviado: faltam as fotos do durante e do depois, uma por vez', () => {
    const s = { ...base, dadosValidos: true, projetoCriado: true, aceiteEnviado: true, fotos: [true, false, false] as [boolean, boolean, boolean] }
    expect(estados(s)).toEqual(['feito', 'feito', 'feito', 'atual', 'pendente'])
    expect(proximaAcao(s)).toBe('Adicione a foto do durante.')
    expect(proximaAcao({ ...s, fotos: [true, true, false] })).toBe('Adicione a foto do depois.')
  })

  it('três fotos: falta pedir a avaliação', () => {
    const s = { ...base, dadosValidos: true, projetoCriado: true, aceiteEnviado: true, fotos: [true, true, true] as [boolean, boolean, boolean] }
    expect(estados(s)).toEqual(['feito', 'feito', 'feito', 'feito', 'atual'])
    expect(proximaAcao(s)).toBe('Peça a avaliação ao cliente.')
  })

  it('concluído: todos os passos feitos', () => {
    const s = { ...base, dadosValidos: true, projetoCriado: true, aceiteEnviado: true, fotos: [true, true, true] as [boolean, boolean, boolean], concluido: true, status: 'finalizado' }
    expect(estados(s).every((e) => e === 'feito')).toBe(true)
    expect(proximaAcao(s)).toMatch(/concluído e avaliado/i)
  })
})

describe('passos do trabalho sem fotos', () => {
  const sem = { ...base, semFotos: true }

  it('antes de iniciar, o primeiro passo é o atual', () => {
    expect(estados(sem)).toEqual(['atual', 'pendente', 'pendente', 'pendente'])
    expect(proximaAcao(sem)).toMatch(/WhatsApp do cliente/)
    expect(proximaAcao({ ...sem, dadosValidos: true })).toBe('Toque em "Iniciar serviço".')
  })

  it('iniciado e pendente: falta o cliente aceitar', () => {
    const s = { ...sem, dadosValidos: true, projetoCriado: true, status: 'pendente' }
    expect(estados(s)).toEqual(['feito', 'atual', 'pendente', 'pendente'])
    expect(proximaAcao(s)).toBe('Envie o aceite ao cliente.')
  })

  it('cliente aceitou: falta concluir, depois pedir a avaliação', () => {
    const s = { ...sem, dadosValidos: true, projetoCriado: true, status: 'em_execucao' }
    expect(estados(s)).toEqual(['feito', 'feito', 'atual', 'pendente'])
    expect(proximaAcao(s)).toMatch(/marque como concluído/)
    const marcado = { ...s, marcadoConcluido: true }
    expect(estados(marcado)).toEqual(['feito', 'feito', 'feito', 'atual'])
    expect(proximaAcao(marcado)).toBe('Peça a avaliação ao cliente.')
  })
})
