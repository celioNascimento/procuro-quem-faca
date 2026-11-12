import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Pedido sobre seus dados',
  description: 'Peça acesso, correção ou exclusão dos seus dados pessoais no Procuro Quem Faça.',
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
