import { describe, expect, it } from 'vitest'
import { nomeArquivoExportacao, resumirExportacao, ROTULO_CONSENTIMENTO, type ExportacaoDados } from '@/lib/meusDados/resumo'

const base: ExportacaoDados = { gerado_em: '2026-11-11T10:00:00Z', versao_formato: 1, conta: null, consentimentos: [] }

describe('resumirExportacao', () => {
  it('conta registros de listas e presença de objetos, na ordem da tela', () => {
    const resumo = resumirExportacao({
      ...base,
      perfil: { id: 'u1' },
      prestador: { id: 5 },
      projetos_como_prestador: [{}, {}, {}],
      avaliacoes_recebidas: [{}],
      consentimentos: [
        { tipo: 'termos_uso', versao_documento: '2026-11', concedido: true, origem: 'login', aceito_em: '2026-11-11' },
        { tipo: 'politica_privacidade', versao_documento: '2026-11', concedido: true, origem: 'login', aceito_em: '2026-11-11' },
      ],
    })
    expect(resumo.map(i => [i.chave, i.quantidade])).toEqual([
      ['perfil', 1],
      ['prestador', 1],
      ['projetos_como_prestador', 3],
      ['avaliacoes_recebidas', 1],
      ['consentimentos', 2],
    ])
  })

  it('não mostra seção vazia, nula ou ausente', () => {
    const resumo = resumirExportacao({ ...base, perfil: null, prestador: null, curtidas: [], garantias_como_cliente: [] })
    expect(resumo).toEqual([])
  })

  it('traz o rótulo em português de cada seção', () => {
    const [item] = resumirExportacao({ ...base, avaliacoes_feitas: [{}] })
    expect(item).toEqual({ chave: 'avaliacoes_feitas', rotulo: 'Avaliações que você fez', quantidade: 1 })
  })
})

describe('apoio', () => {
  it('nomeia o arquivo com a data local, com zeros à esquerda', () => {
    expect(nomeArquivoExportacao(new Date(2026, 0, 5))).toBe('meus-dados-pqf-2026-01-05.json')
    expect(nomeArquivoExportacao(new Date(2026, 10, 11))).toBe('meus-dados-pqf-2026-11-11.json')
  })

  it('rotula os tipos de aceite do banco', () => {
    expect(ROTULO_CONSENTIMENTO.termos_uso).toBe('Termos de Uso')
    expect(ROTULO_CONSENTIMENTO.politica_privacidade).toBe('Política de Privacidade')
  })
})
