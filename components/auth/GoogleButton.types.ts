export interface GoogleButtonProps {
  text?: string
  onLog?: (acao: string, detalhes?: Record<string, unknown>) => Promise<void> | void
  roleDesejado?: 'prestador' | 'cliente'
}
