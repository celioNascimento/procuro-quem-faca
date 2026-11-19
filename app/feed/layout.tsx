// app/feed/layout.tsx — metadados da página (a página é "client" e não pode declará-los).
import type { Metadata } from 'next'
import type { ReactNode } from 'react'

export const metadata: Metadata = {
  title: 'Trabalhos concluídos',
  description: 'Veja trabalhos reais concluídos por profissionais de Londrina e escolha quem chamar.',
}

export default function FeedLayout({ children }: { children: ReactNode }) {
  return children
}
