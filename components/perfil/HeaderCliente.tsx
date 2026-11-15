//components/perfil/HeaderCliente.tsx

'use client'
import { ChevronLeft } from 'lucide-react'
import { useHeaderCliente } from '@/hooks/useHeaderCliente'
import HeaderBase from '@/components/HeaderBase'
import { HeaderAuthButton } from '@/components/HeaderAuthButton'

// Cabeçalho das telas do cliente: mesmo controle de conta do cabeçalho do app
// (HeaderAuthButton), para o cliente e o profissional verem o mesmo padrão.
export default function HeaderCliente() {
  const { handleBack } = useHeaderCliente()

  return (
    <HeaderBase
      voltar={
        <button
          onClick={handleBack}
          aria-label="Voltar"
          className="flex size-11 items-center justify-center rounded-xl border border-slate-100 bg-white text-slate-500 transition-all hover:border-blue-100 hover:text-blue-600 hover:shadow-sm active:scale-95"
        >
          <ChevronLeft size={20} strokeWidth={3} />
        </button>
      }
      direita={<HeaderAuthButton />}
    />
  )
}
