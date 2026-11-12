import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Termos de Uso',
  description: 'Regras de uso do Procuro Quem Faça.',
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
