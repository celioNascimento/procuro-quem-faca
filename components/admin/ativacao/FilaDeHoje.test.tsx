import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { FilaDeHoje } from './FilaDeHoje'
import type { PerfilDaFila } from '@/lib/ativacao/fila'

function perfil(extra: Partial<PerfilDaFila> = {}): PerfilDaFila {
  return { id: 1, nome: 'Ana', slug: 'ana', whatsapp: '43999990000', user_id: null, cidade: 'Londrina', ativacao_status: 'nao_enviado', ativacao_enviado_em: null, ativacao_respondeu_em: null, ...extra }
}

describe('FilaDeHoje', () => {
  beforeEach(() => { vi.useFakeTimers({ toFake: ['Date'] }); vi.setSystemTime(new Date('2026-11-20T15:00:00Z')) })
  afterEach(() => { vi.useRealTimers(); cleanup() })

  it('mostra o contador do dia e a fila com botão de enviar', async () => {
    const onEnviar = vi.fn().mockResolvedValue(undefined)
    const todos = [perfil({ id: 1 }), perfil({ id: 2, nome: 'Bia', ativacao_status: 'enviado', ativacao_enviado_em: '2026-11-20T13:00:00Z' })]
    render(<FilaDeHoje todos={todos} recorte={todos} onEnviar={onEnviar} onRespondeu={vi.fn()} />)
    expect(screen.getByText('1 de 5 enviados hoje')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: /Enviar convite/ }))
    await waitFor(() => expect(onEnviar).toHaveBeenCalledWith(todos[0]))
  })

  it('meta cumprida: não oferece mais convites', () => {
    const enviados = [1, 2, 3, 4, 5].map((id) => perfil({ id, ativacao_status: 'enviado', ativacao_enviado_em: '2026-11-20T13:00:00Z' }))
    render(<FilaDeHoje todos={[...enviados, perfil({ id: 9 })]} recorte={[perfil({ id: 9 })]} onEnviar={vi.fn()} onRespondeu={vi.fn()} />)
    expect(screen.getByTestId('fila-meta-cumprida')).toBeTruthy()
    expect(screen.queryByRole('button', { name: /Enviar convite/ })).toBeNull()
  })

  it('o filtro de local restringe a fila, mas a contagem do dia segue sobre todos', () => {
    const cwb = perfil({ id: 3, nome: 'Zé', cidade: 'Curitiba' })
    const todos = [perfil({ id: 1 }), cwb]
    render(<FilaDeHoje todos={todos} recorte={[cwb]} onEnviar={vi.fn()} onRespondeu={vi.fn()} />)
    expect(screen.getByText('Zé')).toBeTruthy()
    expect(screen.queryByText('Ana')).toBeNull()
  })

  it('lista quem não respondeu há 3 dias ou mais e deixa marcar como respondeu', async () => {
    const onRespondeu = vi.fn().mockResolvedValue(undefined)
    const antigo = perfil({ id: 5, nome: 'Caio', ativacao_status: 'enviado', ativacao_enviado_em: '2026-11-15T12:00:00Z' })
    render(<FilaDeHoje todos={[antigo]} recorte={[antigo]} onEnviar={vi.fn()} onRespondeu={onRespondeu} />)
    expect(screen.getByText('Contatado há 5 dias')).toBeTruthy()
    expect(screen.getByRole('link', { name: 'Abrir conversa' }).getAttribute('href')).toBe('https://wa.me/5543999990000')
    fireEvent.click(screen.getByRole('button', { name: 'Respondeu' }))
    await waitFor(() => expect(onRespondeu).toHaveBeenCalledWith(antigo))
  })

  it('sem ninguém esperando retorno, avisa', () => {
    render(<FilaDeHoje todos={[perfil()]} recorte={[perfil()]} onEnviar={vi.fn()} onRespondeu={vi.fn()} />)
    expect(screen.getByTestId('fila-sem-lembretes')).toBeTruthy()
  })
})
