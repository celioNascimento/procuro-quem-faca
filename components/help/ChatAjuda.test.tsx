// components/help/ChatAjuda.test.tsx
import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ChatAjuda } from '@/components/help/ChatAjuda'

function escrever(texto: string) {
  fireEvent.change(screen.getByLabelText('Escreva sua dúvida'), { target: { value: texto } })
  fireEvent.click(screen.getByRole('button', { name: 'Enviar dúvida' }))
}

describe('ChatAjuda', () => {
  it('abre com uma saudação e opções para escolher', () => {
    render(<ChatAjuda audience="cliente" />)
    expect(screen.getByText(/Eu ajudo você a usar/i)).toBeTruthy()
    expect(screen.getAllByRole('button').filter((b) => b.textContent && !/enviar/i.test(b.getAttribute('aria-label') ?? '')).length).toBeGreaterThan(1)
  })

  it('ao escolher uma opção mostra os passos e o link do artigo completo', () => {
    render(<ChatAjuda audience="cliente" />)
    const primeira = screen.getAllByRole('button').find((b) => /como/i.test(b.textContent ?? ''))!
    fireEvent.click(primeira)
    expect(screen.getByRole('link', { name: /ver o artigo completo/i }).getAttribute('href')).toMatch(/^\/ajuda\?artigo=/)
    expect(screen.getByText(/resolveu a sua dúvida/i)).toBeTruthy()
  })

  it('responde a uma pergunta escrita', () => {
    render(<ChatAjuda audience="cliente" />)
    escrever('como eu avalio o prestador?')
    expect(screen.getByText(/Encontrei isto para você/i)).toBeTruthy()
    expect(screen.getByRole('link', { name: /ver o artigo completo/i }).getAttribute('href')).toBe('/ajuda?artigo=avaliar-servico')
  })

  it('quando não acha, oferece o WhatsApp do PQF com a dúvida', () => {
    render(<ChatAjuda audience="cliente" />)
    escrever('xyzabc qwerty')
    const links = screen.getAllByRole('link', { name: /whatsapp/i })
    expect(links.some((l) => l.getAttribute('href')?.startsWith('https://wa.me/5543999739597'))).toBe(true)
    expect(decodeURIComponent(links[0].getAttribute('href')!)).toContain('xyzabc qwerty')
  })

  it('"Não, preciso de mais ajuda" leva à equipe pelo WhatsApp', () => {
    render(<ChatAjuda audience="cliente" />)
    escrever('como eu avalio o prestador?')
    fireEvent.click(screen.getByRole('button', { name: 'Não, preciso de mais ajuda' }))
    expect(screen.getByText(/falar com a nossa equipe/i)).toBeTruthy()
  })

  it('"Sim, resolveu" encerra com gentileza e deixa recomeçar', () => {
    render(<ChatAjuda audience="cliente" />)
    escrever('como eu avalio o prestador?')
    fireEvent.click(screen.getByRole('button', { name: 'Sim, resolveu' }))
    expect(screen.getByText(/Que bom/i)).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Tenho outra dúvida' }))
    expect(screen.getAllByText(/Eu ajudo você a usar/i).length).toBe(2)
  })

  it('só as opções da última resposta ficam clicáveis', () => {
    render(<ChatAjuda audience="cliente" />)
    const saudacao = screen.getAllByRole('button').filter((b) => /como/i.test(b.textContent ?? ''))
    fireEvent.click(saudacao[0])
    const antigos = screen.getAllByRole('button').filter((b) => (b as HTMLButtonElement).disabled && /como/i.test(b.textContent ?? ''))
    expect(antigos.length).toBeGreaterThan(0)
  })

  it('não envia texto vazio', () => {
    render(<ChatAjuda audience="cliente" />)
    expect((screen.getByRole('button', { name: 'Enviar dúvida' }) as HTMLButtonElement).disabled).toBe(true)
  })
})

describe('ChatAjuda com vários artigos parecidos', () => {
  it('mantém "Sim/Não" clicáveis e oferece os outros artigos na mesma pergunta', () => {
    render(<ChatAjuda audience="cliente" />)
    escrever('trabalho cliente prestador serviço')
    expect((screen.getByRole('button', { name: 'Sim, resolveu' }) as HTMLButtonElement).disabled).toBe(false)
    expect(screen.getAllByRole('button').some((b) => /^Ver: /.test(b.textContent ?? ''))).toBe(true)
  })
})
