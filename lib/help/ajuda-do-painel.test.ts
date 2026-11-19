import { describe, expect, it } from 'vitest'
import { ajudaDaAba, type AbaPainelPrestador, type SubAbaDadosProfissionais } from './ajuda-do-painel'
import { getHelpArticles } from './help-content'

const idsDe = (aba: AbaPainelPrestador, sub?: SubAbaDadosProfissionais) =>
  getHelpArticles('prestador', ajudaDaAba(aba, sub).context).map((a) => a.id)

describe('ajuda por aba do painel do prestador', () => {
  it('toda aba tem pelo menos um artigo', () => {
    for (const [aba, sub] of [['portfolio'], ['desempenho'], ['divulgacao'], ['perfil', 'perfil'], ['perfil', 'cnpj']] as const) {
      expect(idsDe(aba, sub).length, `${aba}/${sub}`).toBeGreaterThan(0)
    }
  })

  it('Divulgação só aparece na aba Divulgação', () => {
    expect(idsDe('divulgacao')).toContain('divulgacao-visao-geral')
    for (const [aba, sub] of [['portfolio'], ['desempenho'], ['perfil', 'perfil'], ['perfil', 'cnpj']] as const) {
      expect(idsDe(aba, sub).filter((id) => id.startsWith('divulgacao')), `${aba}/${sub}`).toEqual([])
    }
  })

  it('CNPJ, Seguro e CND mostram só selos (e o CNPJ)', () => {
    expect(idsDe('perfil', 'cnpj').sort()).toEqual(['selo-cnd-prestador', 'selo-cnpj-prestador', 'selo-seguro-prestador', 'selos-e-niveis-prestador'])
  })

  it('selos só aparecem na aba CNPJ', () => {
    for (const [aba, sub] of [['portfolio'], ['desempenho'], ['divulgacao'], ['perfil', 'perfil']] as const) {
      expect(idsDe(aba, sub).filter((id) => id.startsWith('selo')), `${aba}/${sub}`).toEqual([])
    }
  })

  it('Meu perfil traz editar perfil e ativação/bloqueio', () => {
    expect(idsDe('perfil', 'perfil')).toEqual(expect.arrayContaining(['editar-perfil-prestador', 'ativacao-perfil-prestador']))
  })

  it('Meus Trabalhos traz portfólio e garantia; Desempenho traz avaliações e garantia', () => {
    expect(idsDe('portfolio')).toEqual(expect.arrayContaining(['portfolio-prestador', 'responder-garantia']))
    expect(idsDe('desempenho')).toEqual(expect.arrayContaining(['avaliacoes-prestador', 'responder-garantia']))
  })

  it('nenhum bloco do painel tem mais de 4 atalhos (ajuda curta)', () => {
    for (const [aba, sub] of [['portfolio'], ['desempenho'], ['divulgacao'], ['perfil', 'perfil'], ['perfil', 'cnpj']] as const) {
      expect(idsDe(aba, sub).length, `${aba}/${sub}`).toBeLessThanOrEqual(4)
    }
  })
})
