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
    expect(screen.getByText('Nível Bronze · CNPJ ativo, consultado em 17/11')).toBeTruthy()
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
