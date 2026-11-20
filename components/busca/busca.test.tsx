// components/busca/busca.test.tsx
//
// Peças novas da página de resultados: cidade da busca, convite de localização e "Ver mais".

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import type { ComponentProps } from 'react'
import type { Prestador } from '@/types/prestador'
import { CHAVE_DICA_LISTA, DicaDaLista } from '@/components/busca/DicaDaLista'

vi.mock('next/link', () => ({
  default: ({ href, children, ...resto }: ComponentProps<'a'> & { href: string }) => <a href={href} {...resto}>{children}</a>,
}))

vi.mock('@/lib/supabase', () => ({ supabase: {} }))

let estadoLocalizacao = 'parado'
const solicitarLocalizacao = vi.fn()
vi.mock('@/lib/contexts/LocationContext', () => ({
  useLocation: () => ({ cidadeAtual: null, estadoLocalizacao, solicitarLocalizacao, salvarLocalizacao: vi.fn() }),
}))

vi.mock('@/components/ads/AdCard', () => ({
  AdCard: ({ page }: { page: string }) => <div data-testid="anuncio">{page}</div>,
}))
vi.mock('@/components/cards/PrestadorCard', () => ({
  default: ({ prestador, seloCnpj, nivel, placar }: { prestador: Prestador; seloCnpj?: boolean; nivel?: string | null; placar?: { naoIndicam: number } | null }) => (
    <article data-testid="card">{prestador.nome}{seloCnpj ? ' [selo]' : ''}{nivel ? ` [${nivel}]` : ''}{placar ? ` [nao:${placar.naoIndicam}]` : ''}</article>
  ),
}))
const buscarSelosPublicos = vi.fn().mockResolvedValue([])
const buscarNiveisDosPrestadores = vi.fn().mockResolvedValue(new Map())
vi.mock('@/lib/services/selosPublicos.service', () => ({
  buscarSelosPublicos: (ids: number[]) => buscarSelosPublicos(ids),
  buscarNivelDoPrestador: vi.fn().mockResolvedValue(null),
  buscarNiveisDosPrestadores: (ids: number[]) => buscarNiveisDosPrestadores(ids),
}))
const buscarPlacarDosPrestadores = vi.fn().mockResolvedValue(new Map())
vi.mock('@/lib/services/placarIndicacoes.service', () => ({
  buscarPlacarDosPrestadores: (ids: number[]) => buscarPlacarDosPrestadores(ids),
}))
vi.mock('@/lib/services/anunciosPublicos.service', () => ({
  listarAnunciosAtivosPorPraca: vi.fn().mockResolvedValue([]),
  verificarInventarioSegmento: vi.fn().mockResolvedValue({ ocupados: 0, vagasTotais: 0 }),
}))

import { CidadeDaBusca } from '@/components/busca/CidadeDaBusca'
import { ConviteLocalizacao } from '@/components/busca/ConviteLocalizacao'
import { ResultadosPaginados } from '@/components/busca/ResultadosPaginados'

beforeEach(() => {
  estadoLocalizacao = 'parado'
  solicitarLocalizacao.mockReset()
  localStorage.clear()
  sessionStorage.clear()
})
afterEach(cleanup)

describe('CidadeDaBusca', () => {
  const base = {
    ampliar: false, cidadeSalvaNome: 'Londrina',
    onVerOutrasCidades: vi.fn(), onVoltarParaMinhaCidade: vi.fn(),
  }

  it('oferece "Ver outras cidades" (a cidade em si já está no título da página)', () => {
    const onVer = vi.fn()
    render(<CidadeDaBusca {...base} cidadeNome="Londrina" origem="salva" onVerOutrasCidades={onVer} />)
    fireEvent.click(screen.getByRole('button', { name: 'Ver outras cidades' }))
    expect(onVer).toHaveBeenCalledTimes(1)
  })

  it('com todas as cidades, oferece voltar para a cidade salva', () => {
    const onVoltar = vi.fn()
    render(<CidadeDaBusca {...base} cidadeNome={null} origem={null} ampliar onVoltarParaMinhaCidade={onVoltar} />)
    expect(screen.getByText('Todas as cidades')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Voltar para Londrina' }))
    expect(onVoltar).toHaveBeenCalledTimes(1)
  })

  it('também oferece "Ver outras cidades" quando a cidade foi escrita na busca', () => {
    const onVer = vi.fn()
    render(<CidadeDaBusca {...base} cidadeNome="Maringá" origem="texto" onVerOutrasCidades={onVer} />)
    fireEvent.click(screen.getByRole('button', { name: 'Ver outras cidades' }))
    expect(onVer).toHaveBeenCalledTimes(1)
  })

  it('cidade salva: "Atualizar minha localização" pede a posição ao aparelho', () => {
    const onAtualizar = vi.fn()
    render(<CidadeDaBusca {...base} cidadeNome="Londrina" origem="salva" onAtualizarLocalizacao={onAtualizar} />)
    fireEvent.click(screen.getByRole('button', { name: 'Não é aqui? Atualizar minha localização' }))
    expect(onAtualizar).toHaveBeenCalledTimes(1)
  })

  it('enquanto procura a cidade, o botão fica desligado e diz o que faz', () => {
    render(<CidadeDaBusca {...base} cidadeNome="Londrina" origem="salva" onAtualizarLocalizacao={vi.fn()} estadoLocalizacao="pedindo" />)
    const botao = screen.getByRole('button', { name: 'Procurando a sua cidade…' }) as HTMLButtonElement
    expect(botao.disabled).toBe(true)
  })

  it('se a cidade nova não é atendida, avisa que a anterior continua valendo', () => {
    render(<CidadeDaBusca {...base} cidadeNome="Londrina" origem="salva" onAtualizarLocalizacao={vi.fn()} estadoLocalizacao="sem_cidade" />)
    expect(screen.getByRole('status').textContent).toContain('Mantivemos a cidade anterior')
  })

  it('se a pessoa negou a permissão, orienta a usar os filtros', () => {
    render(<CidadeDaBusca {...base} cidadeNome="Londrina" origem="salva" onAtualizarLocalizacao={vi.fn()} estadoLocalizacao="negado" />)
    expect(screen.getByRole('status').textContent).toContain('filtros')
  })

  it('cidade da URL (gravada pela home) com o mesmo nome da salva também oferece atualizar', () => {
    render(<CidadeDaBusca {...base} cidadeNome="Londrina" origem="filtro" onAtualizarLocalizacao={vi.fn()} />)
    expect(screen.getByRole('button', { name: 'Não é aqui? Atualizar minha localização' })).toBeTruthy()
  })

  it('cidade escolhida nos filtros ou escrita na busca não oferece atualizar (não é a cidade salva)', () => {
    render(<CidadeDaBusca {...base} cidadeNome="Maringá" origem="filtro" onAtualizarLocalizacao={vi.fn()} />)
    expect(screen.queryByRole('button', { name: /Atualizar minha localização/ })).toBeNull()
  })

  it('não aparece quando não há cidade', () => {
    const { container } = render(<CidadeDaBusca {...base} cidadeNome={null} origem={null} />)
    expect(container.firstChild).toBeNull()
  })
})

describe('ConviteLocalizacao', () => {
  it('explica o uso e só pede ao tocar no botão', () => {
    render(<ConviteLocalizacao />)
    expect(solicitarLocalizacao).not.toHaveBeenCalled()
    expect(document.body.textContent).toMatch(/não guardamos a sua posição exata/i)
    expect(screen.getByRole('link', { name: /como tratamos seus dados/i }).getAttribute('href')).toBe('/privacidade')

    fireEvent.click(screen.getByRole('button', { name: 'Usar minha localização' }))
    expect(solicitarLocalizacao).toHaveBeenCalledTimes(1)
  })

  it('"Agora não" some e não volta nas próximas visitas', () => {
    const { container, unmount } = render(<ConviteLocalizacao />)
    fireEvent.click(screen.getByRole('button', { name: 'Agora não' }))
    expect(container.firstChild).toBeNull()
    unmount()

    const proxima = render(<ConviteLocalizacao />)
    expect(proxima.container.firstChild).toBeNull()
  })

  it('mostra que está procurando enquanto espera', () => {
    estadoLocalizacao = 'pedindo'
    render(<ConviteLocalizacao />)
    const botao = screen.getByRole('button', { name: /procurando a sua cidade/i }) as HTMLButtonElement
    expect(botao.disabled).toBe(true)
  })

  it.each([
    ['negado', /escolher a sua cidade nos filtros/i],
    ['sem_cidade', /ainda não temos profissionais cadastrados na sua cidade/i],
    ['indisponivel', /não deixa usar a localização/i],
  ])('quando %s, orienta o que fazer em vez de insistir', (estado, texto) => {
    estadoLocalizacao = estado
    render(<ConviteLocalizacao />)
    expect(screen.getByRole('status').textContent).toMatch(texto)
    expect(screen.queryByRole('button', { name: 'Usar minha localização' })).toBeNull()
  })

  it('quando dá erro, oferece tentar de novo', () => {
    estadoLocalizacao = 'erro'
    render(<ConviteLocalizacao />)
    fireEvent.click(screen.getByRole('button', { name: 'Tentar de novo' }))
    expect(solicitarLocalizacao).toHaveBeenCalledTimes(1)
  })
})

function lista(n: number): Prestador[] {
  return Array.from({ length: n }, (_, i) => ({
    id: i + 1, nome: `Prof ${i + 1}`, cidade_id: 'c1', categoria_id: 'k1', categoria: 'Pedreiro',
  })) as unknown as Prestador[]
}

describe('ResultadosPaginados', () => {
  it('mostra 10 por vez e "Ver mais" abre os próximos', () => {
    render(<ResultadosPaginados prestadores={lista(25)} quantidadeInicial={10} session={null} contextoAnuncio="pedreiro" />)
    expect(screen.getAllByTestId('card')).toHaveLength(10)
    expect(screen.getByText('Mostrando 10 de 25')).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: 'Ver mais 10' }))
    expect(screen.getAllByTestId('card')).toHaveLength(20)

    fireEvent.click(screen.getByRole('button', { name: 'Ver mais 5' }))
    expect(screen.getAllByTestId('card')).toHaveLength(25)
    expect(screen.queryByRole('button', { name: /ver mais/i })).toBeNull()
    expect(screen.getByText('Mostrando 25 de 25')).toBeTruthy()
  })

  it('até 10 resultados não mostra "Ver mais" nem contador', () => {
    render(<ResultadosPaginados prestadores={lista(7)} quantidadeInicial={10} session={null} contextoAnuncio="" />)
    expect(screen.getAllByTestId('card')).toHaveLength(7)
    expect(screen.queryByText(/mostrando/i)).toBeNull()
  })

  it('um anúncio a cada 4 cards (2 anúncios nos 10 primeiros)', () => {
    render(<ResultadosPaginados prestadores={lista(25)} quantidadeInicial={10} session={null} contextoAnuncio="" />)
    expect(screen.getAllByTestId('anuncio')).toHaveLength(2)
  })

  it('ao voltar do perfil reabre com a quantidade que estava aberta', () => {
    render(<ResultadosPaginados prestadores={lista(25)} quantidadeInicial={20} session={null} contextoAnuncio="" />)
    expect(screen.getAllByTestId('card')).toHaveLength(20)
  })

  it('guarda a quantidade aberta para o voltar', () => {
    render(<ResultadosPaginados prestadores={lista(25)} quantidadeInicial={10} session={null} contextoAnuncio="" />)
    fireEvent.click(screen.getByRole('button', { name: 'Ver mais 10' }))
    expect(sessionStorage.getItem('pqf:qtd:' + window.location.pathname + window.location.search)).toBe('20')
  })
})

describe('DicaDaLista', () => {
  it('na primeira visita mostra a dica, inclusive o aviso sobre perfis de dados públicos', () => {
    render(<DicaDaLista />)
    expect(screen.getByText(/pedir orçamento não custa nada/i)).toBeTruthy()
    expect(screen.getByText(/dados públicos de contato/i)).toBeTruthy()
  })

  it('"Entendi" fecha a dica e lembra disso neste aparelho', () => {
    const { unmount } = render(<DicaDaLista />)
    fireEvent.click(screen.getByRole('button', { name: 'Entendi' }))
    expect(screen.queryByRole('complementary')).toBeNull()
    expect(localStorage.getItem(CHAVE_DICA_LISTA)).toBe('1')

    unmount()
    render(<DicaDaLista />)
    expect(screen.queryByRole('complementary')).toBeNull()
  })
})

describe('ResultadosPaginados — selos de CNPJ', () => {
  const lista = (n: number) =>
    Array.from({ length: n }, (_, i) => ({ id: i + 1, nome: `Prof ${i + 1}`, slug: `p-${i + 1}`, origem_tipo: 'registro_direto' }) as unknown as Prestador)

  it('consulta só os cards visíveis e marca quem tem selo', async () => {
    buscarSelosPublicos.mockReset()
    buscarSelosPublicos.mockResolvedValue([
      { prestador_id: 2, tipo: 'cnpj', verificado_em: null, valido_ate: null, consultado_em: '2026-11-17T15:00:00Z', data_abertura: null },
    ])
    buscarNiveisDosPrestadores.mockReset()
    buscarNiveisDosPrestadores.mockResolvedValue(new Map([[2, 'prata']]))
    buscarPlacarDosPrestadores.mockReset()
    buscarPlacarDosPrestadores.mockResolvedValue(new Map([[2, { indicam: 7, naoIndicam: 3 }]]))
    render(<ResultadosPaginados prestadores={lista(25)} quantidadeInicial={10} session={null} contextoAnuncio="" />)
    await vi.waitFor(() => expect(screen.getByText('Prof 2 [selo] [prata] [nao:3]')).toBeTruthy())
    expect(buscarPlacarDosPrestadores.mock.calls[0][0]).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10])
    expect(buscarSelosPublicos).toHaveBeenCalledTimes(1)
    expect(buscarSelosPublicos.mock.calls[0][0]).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10])
    expect(screen.getByText('Prof 1')).toBeTruthy() // sem selo: sem marca
  })

  it('se a consulta de selos falhar, a lista aparece normalmente', async () => {
    buscarSelosPublicos.mockReset()
    buscarSelosPublicos.mockRejectedValue(new Error('rede'))
    buscarNiveisDosPrestadores.mockResolvedValue(new Map())
    render(<ResultadosPaginados prestadores={lista(3)} quantidadeInicial={10} session={null} contextoAnuncio="" />)
    await vi.waitFor(() => expect(buscarSelosPublicos).toHaveBeenCalled())
    expect(screen.getAllByTestId('card')).toHaveLength(3)
  })
})
