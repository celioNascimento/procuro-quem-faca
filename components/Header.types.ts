export interface HeaderProps {
  href?: string
  /** Alinha o cabeçalho com páginas de conteúdo largo (max-w-6xl), como a lista de resultados. */
  larga?: boolean
  /** A página atual é o feed: o atalho do feed continua no lugar (o cabeçalho não muda de uma tela para outra), só aparece marcado. */
  feedAtivo?: boolean
}
