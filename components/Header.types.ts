export interface HeaderProps {
  href?: string
  /** Alinha o cabeçalho com páginas de conteúdo largo (max-w-6xl), como a lista de resultados. */
  larga?: boolean
  /** Esconde o atalho para o feed (na própria página do feed ele seria um link para onde a pessoa já está). */
  semLinkFeed?: boolean
}
