//hooks/useHeaderCliente.ts

import { useRouter } from 'next/navigation'
import { voltarOuIr } from '@/lib/navegacao'

// Ação do botão de voltar das telas do cliente. A conta (sair, áreas) fica no HeaderAuthButton.
export function useHeaderCliente() {
  const router = useRouter()

  const handleBack = () => {
    // Sem página anterior do app (link aberto direto), vai para a home em vez de não fazer nada.
    voltarOuIr(router, '/')
  }

  return { handleBack }
}
