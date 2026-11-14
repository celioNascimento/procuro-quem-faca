// components/profile/ProjetoModal.test.tsx
//
// Modal do trabalho aberto a partir da capa do portfólio: abre na foto da capa, abas Antes/Durante/Depois,
// cliente só pelo primeiro nome (nunca "verificado") e o botão de WhatsApp no rodapé.

import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import type { ProjetoPerfil } from '@/types/perfil'

vi.mock('@/hooks/useComentariosFoto', () => ({ useComentariosFoto: () => [] }))

import ProjetoModal from '@/components/profile/ProjetoModal'

afterEach(cleanup)

function projeto(extra: Partial<ProjetoPerfil> = {}): ProjetoPerfil {
  return {
    id: 'p1',
    titulo: 'Reforma da cozinha',
    status: 'finalizado',
    created_at: '2026-10-01',
    portfolio_fotos: [
      { id: 'f3', url_foto: '/depois.png', ordem: 3 },
      { id: 'f1', url_foto: '/antes.png', ordem: 1, legenda: 'Azulejo quebrado e pia antiga' },
      { id: 'f2', url_foto: '/durante.png', ordem: 2 },
    ],
    avaliacoes: [],
    solicitacoes_garantia: [],
    ...extra,
  }
}

const contato = { nome: 'Antonio', whatsapp: '43999990000', onClique: vi.fn().mockResolvedValue(undefined) }

describe('ProjetoModal', () => {
  it('abre na foto da capa (a última, "Depois") e as abas levam às outras', () => {
    render(<ProjetoModal projeto={projeto()} onClose={() => {}} />)

    expect(screen.getByRole('tab', { name: 'Depois' }).getAttribute('aria-selected')).toBe('true')
    expect(screen.getByAltText('Depois').getAttribute('src')).toBe('/depois.png')
    expect(screen.getAllByRole('tab').map(t => t.textContent)).toEqual(['Antes', 'Durante', 'Depois'])

    fireEvent.click(screen.getByRole('tab', { name: 'Antes' }))
    expect(screen.getByRole('tab', { name: 'Antes' }).getAttribute('aria-selected')).toBe('true')
    expect(screen.getByAltText('Antes').getAttribute('src')).toBe('/antes.png')
    expect(screen.getByText('Azulejo quebrado e pia antiga')).toBeTruthy()
  })

  it('foto sem descrição mostra o texto padrão da fase', () => {
    render(<ProjetoModal projeto={projeto()} onClose={() => {}} />)

    expect(screen.getByText('Depois do serviço')).toBeTruthy()
  })

  it('com uma foto só, não mostra as abas', () => {
    render(<ProjetoModal projeto={projeto({ portfolio_fotos: [{ id: 'f1', url_foto: '/antes.png', ordem: 1 }] })} onClose={() => {}} />)

    expect(screen.queryByRole('tablist')).toBeNull()
  })

  it('mostra o cliente só pelo primeiro nome e nunca diz "verificado"', () => {
    render(
      <ProjetoModal
        projeto={projeto({ avaliacoes: [{ id: 'a1', indica: true, comentario: 'Ficou ótimo.', cliente_nome: 'Maria da Silva Souza' }] })}
        onClose={() => {}}
      />,
    )

    expect(screen.getByText('Maria')).toBeTruthy()
    expect(document.body.textContent).not.toMatch(/Silva|Souza/)
    expect(document.body.textContent).not.toMatch(/verificad/i)
    expect(screen.getByText('✦ Indico')).toBeTruthy()
  })

  it('avaliação sem nome (ou "Cliente") aparece como "Cliente deste serviço"', () => {
    render(
      <ProjetoModal
        projeto={projeto({ avaliacoes: [{ id: 'a1', indica: true, comentario: null, cliente_nome: 'Cliente' }] })}
        onClose={() => {}}
      />,
    )

    expect(screen.getByText('Cliente deste serviço')).toBeTruthy()
  })

  it('com contato válido, o rodapé tem "Chamar no WhatsApp" citando o trabalho, e o clique é registrado', () => {
    render(<ProjetoModal projeto={projeto()} onClose={() => {}} contato={contato} />)

    const link = screen.getByRole('link', { name: 'Chamar no WhatsApp' })
    expect(link.getAttribute('href')).toContain('wa.me/5543999990000')
    expect(decodeURIComponent(link.getAttribute('href') ?? '')).toContain('Reforma da cozinha')

    fireEvent.click(link)
    expect(contato.onClique).toHaveBeenCalledTimes(1)
    expect(screen.getByRole('button', { name: /compartilhar/i })).toBeTruthy()
  })

  it('sem contato ou sem WhatsApp válido, não há botão de WhatsApp (só compartilhar)', () => {
    const { rerender } = render(<ProjetoModal projeto={projeto()} onClose={() => {}} />)
    expect(screen.queryByRole('link', { name: 'Chamar no WhatsApp' })).toBeNull()

    rerender(<ProjetoModal projeto={projeto()} onClose={() => {}} contato={{ ...contato, whatsapp: '' }} />)
    expect(screen.queryByRole('link', { name: 'Chamar no WhatsApp' })).toBeNull()
    expect(screen.getByRole('button', { name: /compartilhar/i })).toBeTruthy()
  })

  it('não mostra o #id técnico nem "Fase 01"', () => {
    render(<ProjetoModal projeto={projeto()} onClose={() => {}} />)

    expect(document.body.textContent).not.toMatch(/#[a-z0-9]{4,}/i)
    expect(document.body.textContent).not.toMatch(/Fase 0\d/)
  })

  it('mostra o resultado de uma garantia, em palavras simples', () => {
    render(
      <ProjetoModal
        projeto={projeto({
          solicitacoes_garantia: [{
            id: 'g1', status: 'resolvida', origem: 'cliente', descricao_problema: 'Rejunte soltou.',
            resposta_prestador_garantia: null, resolucao_descricao: 'Refeito o rejunte.', nota_resultante: null, fotos: [],
          }],
        })}
        onClose={() => {}}
      />,
    )

    expect(screen.getByText('Garantia honrada')).toBeTruthy()
    expect(screen.getByText('Teve garantia')).toBeTruthy()
    expect(screen.getByText('Rejunte soltou.')).toBeTruthy()
  })

  it('sem fotos, explica e dá como fechar', () => {
    const onClose = vi.fn()
    render(<ProjetoModal projeto={projeto({ portfolio_fotos: [] })} onClose={onClose} />)

    expect(screen.getByText(/ainda não tem fotos/i)).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Fechar' }))
    expect(onClose).toHaveBeenCalled()
  })
})
