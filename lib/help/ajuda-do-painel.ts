// lib/help/ajuda-do-painel.ts
// Qual bloco de ajuda aparece em cada aba do painel do prestador: só o que é relevante ali.
// (Divulgação não aparece em CNPJ, selos não aparecem em Meus Trabalhos, e assim por diante.)

export type AbaPainelPrestador = 'portfolio' | 'desempenho' | 'divulgacao' | 'perfil'
export type SubAbaDadosProfissionais = 'perfil' | 'cnpj' | 'seguro' | 'cnd'

export interface AjudaDaAba {
  context: string
  title: string
}

export function ajudaDaAba(aba: AbaPainelPrestador, subAba: SubAbaDadosProfissionais = 'perfil'): AjudaDaAba {
  switch (aba) {
    case 'desempenho':
      return { context: 'painel-desempenho', title: 'Dúvidas sobre avaliações e desempenho?' }
    case 'divulgacao':
      return { context: 'divulgacao', title: 'Dúvidas sobre divulgação?' }
    case 'perfil':
      return subAba !== 'perfil'
        ? { context: 'painel-dados-cnpj', title: 'Dúvidas sobre o CNPJ e os selos?' }
        : { context: 'painel-dados-perfil', title: 'Dúvidas sobre o seu perfil?' }
    case 'portfolio':
    default:
      return { context: 'painel-trabalhos', title: 'Dúvidas sobre os seus trabalhos?' }
  }
}
