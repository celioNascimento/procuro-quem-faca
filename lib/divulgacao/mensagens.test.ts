import { describe, expect, it } from 'vitest'
import { gerarMensagens } from '@/lib/divulgacao/mensagens'
import { formatarTelefone, urlCanonicaPerfil, urlCurta } from '@/lib/divulgacao/links'
import type { DadosDivulgacao } from '@/lib/divulgacao/tipos'

const base: DadosDivulgacao = {
  id: 7, nome: 'Elétrica Silva', slug: 'eletrica-silva', categoria: 'Eletricista', cidade: 'Londrina',
  verificado: true, whatsapp: '43999998888', fotoPerfilUrl: null,
  totalIndicacoes: 87, totalConcluidos: 12, garantiaDias: 90, fotosPortfolio: [],
}

describe('gerarMensagens', () => {
  it('inclui o link em todas as mensagens', () => {
    const msgs = gerarMensagens(base, 'https://x.com/eletrica-silva')
    expect(msgs.length).toBeGreaterThanOrEqual(3)
    for (const m of msgs) expect(m.texto).toContain('https://x.com/eletrica-silva')
  })

  it('cita indicações, serviços e garantia quando existem', () => {
    const t = gerarMensagens(base, 'L')[0].texto
    expect(t).toContain('87 clientes indicaram meu trabalho')
    expect(t).toContain('12 serviços concluídos')
    expect(t).toContain('90 dias de garantia')
    expect(t).toContain('em Londrina')
  })

  it('usa o singular e nunca escreve "0"', () => {
    const t = gerarMensagens({ ...base, totalIndicacoes: 1, totalConcluidos: 0, garantiaDias: 0 }, 'L')[0].texto
    expect(t).toContain('1 cliente indicou meu trabalho')
    expect(t).not.toMatch(/\b0 /)
    expect(t).not.toContain('serviço concluído')
  })

  it('funciona sem cidade nem categoria', () => {
    const t = gerarMensagens({ ...base, cidade: null, categoria: null, totalIndicacoes: 0, totalConcluidos: 0, garantiaDias: 0 }, 'L')
    expect(t[0].texto).toBe('Olá! Aqui está o meu perfil profissional na região:\nL')
  })
})

describe('links', () => {
  it('usa sempre o domínio canônico', () => {
    expect(urlCanonicaPerfil('eletrica-silva', 7)).toBe('https://procuroquemfaca.com.br/eletrica-silva')
    expect(urlCanonicaPerfil(null, 7)).toBe('https://procuroquemfaca.com.br/7')
    expect(urlCanonicaPerfil('  ', 7)).toBe('https://procuroquemfaca.com.br/7')
  })
  it('urlCurta remove o protocolo', () => {
    expect(urlCurta('https://procuroquemfaca.com.br/a')).toBe('procuroquemfaca.com.br/a')
  })
  it('formata telefone brasileiro', () => {
    expect(formatarTelefone('43999998888')).toBe('(43) 99999-8888')
    expect(formatarTelefone('5543999998888')).toBe('(43) 99999-8888')
    expect(formatarTelefone('4333334444')).toBe('(43) 3333-4444')
    expect(formatarTelefone(null)).toBe('')
  })
})

describe('gerarMensagens — prestador ainda sem portfólio', () => {
  const vazio: DadosDivulgacao = { ...base, totalIndicacoes: 0, totalConcluidos: 0, garantiaDias: 0, fotosPortfolio: [] }

  it('nenhuma mensagem fala em portfólio ou fotos que ainda não existem', () => {
    for (const m of gerarMensagens(vazio, 'L')) {
      expect(m.texto).not.toMatch(/portf[óo]lio|fotos|indica/i)
      expect(m.texto).toContain('L')
    }
  })

  it('o título da primeira mensagem não promete portfólio', () => {
    expect(gerarMensagens(vazio, 'L')[0].titulo).toBe('Meu perfil completo')
    expect(gerarMensagens(base, 'L')[0].titulo).toBe('Portfólio completo')
  })

  it('só com indicações, cita as indicações e não as fotos', () => {
    const t = gerarMensagens({ ...vazio, totalIndicacoes: 3 }, 'L').map(m => m.texto).join('\n')
    expect(t).toMatch(/indicações de clientes/)
    expect(t).not.toMatch(/portf[óo]lio|fotos/i)
  })

  it('só com trabalhos, cita as fotos e não as indicações', () => {
    const t = gerarMensagens({ ...vazio, totalConcluidos: 2, fotosPortfolio: ['a'] }, 'L').map(m => m.texto).join('\n')
    expect(t).toMatch(/fotos/)
    expect(t).not.toMatch(/indicações de clientes|clientes dizem/)
  })
})
