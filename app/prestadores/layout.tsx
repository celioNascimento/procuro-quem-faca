// app/prestadores/layout.tsx
//
// A página de resultados é "client" e não pode declarar metadados, então eles ficam aqui.
// noindex: cada combinação de busca/filtros gera um endereço diferente com quase o mesmo conteúdo, e o Google
// já tem as páginas próprias de serviço + cidade (sitemap) e os perfis. `follow` mantém os links dos perfis
// descobríveis. Não bloquear no robots.txt: bloqueado, o Google não leria o noindex.

import type { Metadata } from 'next'
import type { ReactNode } from 'react'

export const metadata: Metadata = {
  title: 'Profissionais',
  robots: { index: false, follow: true },
}

export default function PrestadoresLayout({ children }: { children: ReactNode }) {
  return children
}
