import { describe, expect, it } from 'vitest'
import { TEXTO_AVISO_FEED, VERSAO_AVISO_FEED } from './feed'

describe('aviso do feed', () => {
  it('tem versão e diz o que é público e o que nunca aparece', () => {
    expect(VERSAO_AVISO_FEED).toMatch(/^\d{4}-\d{2}-feed-\d+$/)
    expect(TEXTO_AVISO_FEED).toMatch(/fotos/)
    expect(TEXTO_AVISO_FEED).toMatch(/feed/)
    expect(TEXTO_AVISO_FEED).toMatch(/nome, telefone e endereço nunca aparecem/)
    expect(TEXTO_AVISO_FEED).toMatch(/quando quiser/)
  })
})
