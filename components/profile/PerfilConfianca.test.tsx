// components/profile/PerfilConfianca.test.tsx
import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import PerfilConfianca from '@/components/profile/PerfilConfianca'
import type { PrestadorPerfil } from '@/types/perfil'

afterEach(cleanup)

const prestador = { id: 1, nome: 'Pedro', garantia_dias: 0, cidades_atendidas: [], cidades: { nome: 'Londrina' } } as unknown as PrestadorPerfil

describe('PerfilConfianca — selo de CNPJ', () => {
  it('mostra o nível e o que foi conferido, com a data', () => {
    render(<PerfilConfianca prestador={prestador} totalIndicacoes={0} totalConcluidos={0} selo={{ consultadoEm: '2026-11-17T15:00:00Z' }} nivel="bronze" />)
    expect(screen.getByTestId('nivel-perfil').textContent).toBe('Nível Bronze')
    expect(screen.getByText('CNPJ ativo, consultado em 17/11')).toBeTruthy()
  })

  it('sem nível conhecido, mostra só o que foi conferido', () => {
    render(<PerfilConfianca prestador={prestador} totalIndicacoes={0} totalConcluidos={0} selo={{ consultadoEm: '2026-11-17T15:00:00Z' }} nivel={null} />)
    expect(screen.getByText('CNPJ ativo, consultado em 17/11')).toBeTruthy()
  })

  it('sem selo, não aparece nada sobre CNPJ', () => {
    render(<PerfilConfianca prestador={prestador} totalIndicacoes={3} totalConcluidos={0} />)
    expect(screen.queryByText(/CNPJ/)).toBeNull()
  })
})

describe('PerfilConfianca — selos calculados pelo sistema', () => {
  it('mostra experiência, tempo de CNPJ e atividade compatível, e o nível Prata', () => {
    render(
      <PerfilConfianca
        prestador={prestador} totalIndicacoes={0} totalConcluidos={0}
        selo={{ consultadoEm: '2026-11-17T15:00:00Z' }} nivel="prata"
        complementares={{ experiencia: true, tempoCnpj: 3, atividadeCompativel: true, seguro: true, cnd: false }}
      />,
    )
    expect(screen.getByTestId('caixa-confianca').className).toContain('border-slate-400')
    expect(screen.getByTestId('nivel-perfil').textContent).toBe('Nível Prata')
    expect(screen.getByText('CNPJ ativo, consultado em 17/11')).toBeTruthy()
    expect(screen.getByText('Experiência no PQF: 10 serviços avaliados por 10 clientes diferentes')).toBeTruthy()
    expect(screen.getByText('CNPJ aberto há mais de 3 anos')).toBeTruthy()
    expect(screen.getByText('Atividade registrada no CNPJ compatível com a categoria do perfil')).toBeTruthy()
    expect(screen.getByTestId('selo-seguro-texto').textContent).toMatch(/conferida pela equipe/)
    expect(screen.queryByTestId('selo-cnd-texto')).toBeNull()
  })

  it('só mostra o que foi conquistado; o que falta não aparece (nunca "0")', () => {
    render(
      <PerfilConfianca
        prestador={prestador} totalIndicacoes={0} totalConcluidos={0}
        complementares={{ experiencia: false, tempoCnpj: null, atividadeCompativel: false, seguro: false, cnd: false }}
      />,
    )
    expect(screen.queryByText(/Experiência no PQF/)).toBeNull()
    expect(screen.queryByText(/CNPJ aberto/)).toBeNull()
    expect(screen.queryByText(/Atividade do CNPJ/)).toBeNull()
  })
})

describe('PerfilConfianca — transparência das não indicações', () => {
  it('mostra o placar completo ao lado das indicações', () => {
    render(<PerfilConfianca prestador={prestador} totalIndicacoes={9} totalNaoIndicacoes={1} totalConcluidos={0} />)
    expect(screen.getByTestId('placar-nao-indicam').textContent).toContain('1 cliente não indica este profissional')
    expect(screen.queryByTestId('tag-nao-indicam')).toBeNull()
  })

  it('o perfil não mostra a tag de porcentagem: o número exato já aparece na linha do placar, sem caixa de aviso', () => {
    render(<PerfilConfianca prestador={prestador} totalIndicacoes={4} totalNaoIndicacoes={3} totalConcluidos={0} />)
    expect(screen.queryByTestId('tag-nao-indicam')).toBeNull()
    expect(screen.getByTestId('placar-nao-indicam').textContent).toContain('3 clientes não indicam')
    expect(screen.queryByTestId('aviso-nao-indicacoes')).toBeNull()
    expect(screen.queryByText(/Leia as avaliações antes de contratar/)).toBeNull()
  })

  it('o nível fica sozinho na linha de cima, sem tag de não indicações ao lado', () => {
    render(
      <PerfilConfianca
        prestador={prestador} totalIndicacoes={7} totalNaoIndicacoes={3} totalConcluidos={10}
        selo={{ consultadoEm: '2026-11-17T15:00:00Z' }} nivel="prata"
      />,
    )
    expect(screen.getByTestId('nivel-perfil').parentElement?.children.length).toBe(1)
    expect(screen.queryByTestId('tag-nao-indicam')).toBeNull()
    expect(screen.getByTestId('selo-cnpj-texto').textContent).toBe('CNPJ ativo, consultado em 17/11')
  })

  it('abaixo do limite, sem tag', () => {
    render(<PerfilConfianca prestador={prestador} totalIndicacoes={9} totalNaoIndicacoes={1} totalConcluidos={0} />)
    expect(screen.queryByTestId('tag-nao-indicam')).toBeNull()
  })

  it('aparece mesmo sem nenhuma indicação, e some quando não há não indicações', () => {
    const { unmount } = render(<PerfilConfianca prestador={prestador} totalIndicacoes={0} totalNaoIndicacoes={3} totalConcluidos={0} />)
    expect(screen.getByTestId('placar-nao-indicam').textContent).toContain('3 clientes não indicam')
    unmount()
    render(<PerfilConfianca prestador={prestador} totalIndicacoes={5} totalConcluidos={0} />)
    expect(screen.queryByTestId('placar-nao-indicam')).toBeNull()
  })

  it('os selos continuam aparecendo junto do placar de não indicações', () => {
    render(<PerfilConfianca prestador={prestador} totalIndicacoes={1} totalNaoIndicacoes={3} totalConcluidos={0} selo={{ consultadoEm: '2026-11-17T15:00:00Z' }} nivel="bronze" />)
    expect(screen.getByTestId('nivel-perfil').textContent).toBe('Nível Bronze')
    expect(screen.getByText('CNPJ ativo, consultado em 17/11')).toBeTruthy()
    expect(screen.getByTestId('placar-nao-indicam').textContent).toContain('3 clientes não indicam')
  })
})
