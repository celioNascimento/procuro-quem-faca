import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Meus dados',
  // Páginas pessoais: fora dos buscadores e sem repassar o endereço (que pode ter o link pessoal) a outros sites
  robots: { index: false, follow: false },
  referrer: 'no-referrer',
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
