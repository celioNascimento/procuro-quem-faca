// lib/divulgacao/portfolio.ts
import type { DadosDivulgacao } from './tipos'

/** O prestador já tem ao menos um trabalho concluído com foto? Muda as chamadas ("veja o portfólio") dos materiais. */
export function temPortfolio(dados: Pick<DadosDivulgacao, 'fotosPortfolio' | 'totalConcluidos'>): boolean {
  return dados.fotosPortfolio.length > 0 || dados.totalConcluidos > 0
}
