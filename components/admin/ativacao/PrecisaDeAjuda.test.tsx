import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { PrecisaDeAjuda } from './PrecisaDeAjuda'
import type { ItemDeAjuda } from '@/lib/ativacao/ajuda'

afterEach(cleanup)

const item = (extra: Partial<ItemDeAjuda> = {}): ItemDeAjuda => ({
  chave: 'a', motivo: 'sem_trabalho', prestadorId: 1, nome: 'Ana Souza', whatsapp: '43999990000', cidade: 'Londrina',
  titulo: null, desde: '2026-11-15T12:00:00Z', dias: 5, parado: true, ...extra,
})

describe('PrecisaDeAjuda', () => {
  it('sem ninguém travado, explica quando algo aparece aqui', () => {
    render(<PrecisaDeAjuda itens={[]} />)
    expect(screen.getByText('Ninguém travado agora')).toBeTruthy()
  })

  it('mostra o resumo por situação, o motivo, o tempo parado e o link do WhatsApp com a mensagem pronta', () => {
    render(<PrecisaDeAjuda itens={[
      item(),
      item({ chave: 'b', motivo: 'aguardando_cliente', nome: 'Beto', titulo: 'Pintura da sala', dias: 1, parado: false }),
    ]} />)
    const resumo = screen.getByTestId('ajuda-resumo').textContent ?? ''
    expect(resumo).toContain('1 · Conta criada, nenhum trabalho publicado')
    expect(resumo).toContain('1 · Trabalho esperando o cliente aceitar')

    const [primeiro, segundo] = screen.getAllByTestId('ajuda-item')
    expect(within(primeiro).getByText('há 5 dias')).toBeTruthy()
    const link = within(primeiro).getByRole('link', { name: /Chamar no WhatsApp/ }).getAttribute('href') ?? ''
    expect(link).toContain('wa.me/5543999990000')
    expect(decodeURIComponent(link)).toContain('Oi, Ana!')
    expect(within(segundo).getByText('há 1 dia')).toBeTruthy()
    expect(within(segundo).getByText(/Pintura da sala/)).toBeTruthy()
  })

  it('sem WhatsApp, não mostra o botão de chamar', () => {
    render(<PrecisaDeAjuda itens={[item({ whatsapp: null })]} />)
    expect(screen.queryByRole('link', { name: /Chamar no WhatsApp/ })).toBeNull()
  })

  it('sem perfil de exemplo, não mostra a dica', () => {
    render(<PrecisaDeAjuda itens={[item()]} />)
    expect(screen.queryByTestId('dica-exemplo')).toBeNull()
  })

  it('com perfil de exemplo, mostra a dica do print e copia o link', async () => {
    const escrever = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'clipboard', { value: { writeText: escrever }, configurable: true })
    render(<PrecisaDeAjuda itens={[item()]} linkExemplo="https://procuroquemfaca.com.br/procuroquemfaca" />)
    expect(screen.getByTestId('dica-exemplo').textContent).toContain('Não mande no primeiro contato')
    fireEvent.click(screen.getByRole('button', { name: /Copiar link do exemplo/ }))
    await waitFor(() => expect(screen.getByRole('status').textContent).toBe('Link copiado'))
    expect(escrever).toHaveBeenCalledWith('https://procuroquemfaca.com.br/procuroquemfaca')
  })

  it('se não conseguir copiar, mostra o link para abrir à mão', async () => {
    Object.defineProperty(navigator, 'clipboard', { value: { writeText: vi.fn().mockRejectedValue(new Error('negado')) }, configurable: true })
    render(<PrecisaDeAjuda itens={[]} linkExemplo="https://procuroquemfaca.com.br/x" />)
    fireEvent.click(screen.getByRole('button', { name: /Copiar link do exemplo/ }))
    await waitFor(() => expect(screen.getByRole('alert').textContent).toContain('https://procuroquemfaca.com.br/x'))
  })
})
