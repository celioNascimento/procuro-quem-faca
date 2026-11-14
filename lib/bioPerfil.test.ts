// lib/bioPerfil.test.ts
import { describe, expect, it } from 'vitest'
import { bioParaExibir, ehBioGenerica } from '@/lib/bioPerfil'

describe('ehBioGenerica', () => {
  it('reconhece a frase do cadastro automático e variações curtas', () => {
    expect(ehBioGenerica('Profissional qualificado disponível para atendimentos na região.')).toBe(true)
    expect(ehBioGenerica('  PROFISSIONAL QUALIFICADO para o serviço.  ')).toBe(true)
  })

  it('bio vazia conta como genérica', () => {
    expect(ehBioGenerica(null)).toBe(true)
    expect(ehBioGenerica('   ')).toBe(true)
  })

  it('bio própria nunca é genérica, mesmo começando igual quando é longa', () => {
    expect(ehBioGenerica('Instalação de chuveiro e troca de disjuntores.')).toBe(false)
    const longa = 'Profissional qualificado com 15 anos de experiência em reformas completas de apartamentos e casas, com equipe própria e orçamento por escrito.'
    expect(ehBioGenerica(longa)).toBe(false)
  })
})

describe('bioParaExibir', () => {
  it('com bio própria, mostra a bio sem alterar o texto', () => {
    expect(bioParaExibir({ bio: ' Faço reformas.\nAtendo aos sábados. ', categoria: 'Pedreiro', cidade: 'Londrina' }))
      .toEqual({ texto: 'Faço reformas.\nAtendo aos sábados.', automatica: false })
  })

  it('com a frase padrão, monta "Categoria em Cidade."', () => {
    expect(bioParaExibir({ bio: 'Profissional qualificado disponível para atendimentos na região.', categoria: 'Pedreiro', cidade: 'Londrina' }))
      .toEqual({ texto: 'Pedreiro em Londrina.', automatica: true })
  })

  it('sem cidade usa só a categoria; sem nenhum dos dois, não mostra nada', () => {
    expect(bioParaExibir({ bio: null, categoria: 'Eletricista' })).toEqual({ texto: 'Eletricista.', automatica: true })
    expect(bioParaExibir({ bio: null })).toBeNull()
  })
})
