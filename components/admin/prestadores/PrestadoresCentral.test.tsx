import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import type { AdminPrestador } from '@/types/adminPrestadores'

const estado = vi.hoisted(() => ({ selecionado: null as unknown }))

vi.mock('@/hooks/admin/useAdminPrestadores', () => ({
  useAdminPrestadores: () => ({
    tab: 'todos', setTab: vi.fn(), filters: { busca: '', origem: '', cidade: '', categoria: '', grupoCategoria: '' }, setFilters: vi.fn(),
    data: { prestadores: [], totais: { todos: 0, publico: 0, cadastro: 0, reivindicado: 0, direto: 0, ativo: 0, acompanhar: 0 } },
    selected: estado.selecionado, setSelected: vi.fn(), loading: false, error: null, marcarBloqueio: vi.fn(),
  }),
}))

vi.mock('@/lib/services/denuncia.service', () => ({ bloquearPrestadorDenunciado: vi.fn(), desbloquearPrestador: vi.fn() }))

import { PrestadoresCentral } from '@/components/admin/prestadores/PrestadoresCentral'

function prestador(extra: Partial<AdminPrestador> = {}): AdminPrestador {
  return {
    id: 1, nome: 'Ana Pintora', slug: 'ana-pintora', whatsapp: '43999990000', email: 'ana@exemplo.com', cidade: 'Londrina', estado_sigla: 'PR',
    categoria: 'Pintor', categoria_id: 'c1', grupoCategoria: 'Reformas', grupo_id: 'g1', origem_tipo: 'curadoria_publica', user_id: null,
    status: 'ativo', bloqueado: false, ativacao_status: 'nao_enviado', created_at: null, updated_at: null, completude: 70, etapa: 'publico',
    etapaLabel: 'Perfil público', contatoStatus: 'pendente', proximaAcao: 'Convidar a reivindicar', ...extra,
  }
}

describe('Prestadores (diretório)', () => {
  afterEach(() => {
    cleanup()
    estado.selecionado = null
  })

  it('tem o botão "Adicionar prestador", que leva à tela de cadastro por curadoria', () => {
    render(<PrestadoresCentral />)
    expect(screen.getByRole('link', { name: /Adicionar prestador/ }).getAttribute('href')).toBe('/admin/povoar')
  })

  it('o painel do prestador não tem contato paralelo: sem link de WhatsApp, sem e-mail e sem texto pronto', () => {
    estado.selecionado = prestador()
    render(<PrestadoresCentral />)
    expect(document.querySelector('a[href*="wa.me"], a[href*="whatsapp"], a[href^="mailto:"]')).toBeNull()
    expect(screen.queryByText(/Próximo melhor contato/)).toBeNull()
    expect(screen.queryByText(/Encontramos seu perfil/)).toBeNull()
  })

  it('perfil público sem conta aponta para Convites, a única porta de contato', () => {
    estado.selecionado = prestador()
    render(<PrestadoresCentral />)
    expect(screen.getByRole('link', { name: /Convidar em Convites/ }).getAttribute('href')).toBe('/admin/ativacao')
    expect(screen.getByRole('link', { name: /Abrir perfil público/ }).getAttribute('href')).toBe('/ana-pintora')
  })

  it('quem já tem conta não recebe o atalho de convite', () => {
    estado.selecionado = prestador({ etapa: 'reivindicado', etapaLabel: 'Reivindicado', user_id: 'u1', proximaAcao: 'Orientar ativação' })
    render(<PrestadoresCentral />)
    expect(screen.queryByRole('link', { name: /Convidar em Convites/ })).toBeNull()
    expect(screen.getByRole('link', { name: /Abrir perfil público/ })).toBeTruthy()
  })

  it('perfil que ainda não está no ar não mostra link para a página pública', () => {
    estado.selecionado = prestador({ status: 'pendente', etapa: 'cadastro', etapaLabel: 'Cadastro iniciado', user_id: 'u1' })
    render(<PrestadoresCentral />)
    expect(screen.queryByRole('link', { name: /Abrir perfil público/ })).toBeNull()
  })
})

describe('Prestadores (bloqueio)', () => {
  afterEach(() => { cleanup(); estado.selecionado = null })

  it('o painel do prestador tem a seção de bloqueio, sem depender de denúncia', () => {
    estado.selecionado = prestador()
    render(<PrestadoresCentral />)
    expect(screen.getByTestId('bloqueio-prestador')).toBeTruthy()
    expect(screen.getByRole('button', { name: /Bloquear perfil/ })).toBeTruthy()
  })
})
