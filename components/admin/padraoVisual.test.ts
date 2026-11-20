import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

// Telas já padronizadas no kit components/admin/ui: não podem voltar ao estilo antigo
// (slate/zinc/indigo soltos, títulos em caixa alta itálica, rótulos de 9-10px em negrito pesado).
const TELAS = [
  'app/(admin)/admin/moderacao/page.tsx',
  'app/(admin)/admin/verificacoes/page.tsx',
  'components/admin/moderacao/DenunciaCard.tsx',
  'components/admin/verificacoes/VerificacaoCard.tsx',
  'components/admin/verificacoes/DocumentoCard.tsx',
  'components/admin/titular/TitularCentral.tsx',
]
const PROIBIDO = [/font-black/, /uppercase italic/, /\bzinc-\d/, /\bindigo-\d/, /text-\[(9|10|11)px\]/]

describe('Padrão visual do admin', () => {
  for (const arquivo of TELAS) {
    it(`${arquivo} usa o kit e não o estilo antigo`, () => {
      const texto = readFileSync(arquivo, 'utf-8')
      for (const regra of PROIBIDO) expect(texto, String(regra)).not.toMatch(regra)
      expect(texto).toContain("@/components/admin/ui")
    })
  }
})
