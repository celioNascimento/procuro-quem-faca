import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Política de Privacidade',
  description: 'Como o Procuro Quem Faça trata os seus dados pessoais.',
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
