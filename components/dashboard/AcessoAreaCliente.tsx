// components/dashboard/AcessoAreaCliente.tsx

import Link from 'next/link'
import { User } from 'lucide-react'

// Botão do painel profissional que leva à área do cliente.
// Análogo ao ConvitePrestador da área do cliente: quem é prestador também
// contrata serviços, então precisa chegar aos próprios pedidos sem sair da conta.
export function AcessoAreaCliente() {
  return (
    <Link
      href="/painel/perfil"
      className="inline-flex min-h-11 w-full shrink-0 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-[14px] font-semibold text-slate-700 shadow-sm transition-colors hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-100 sm:w-auto"
    >
      <User size={16} aria-hidden="true" />
      Ir para a área do cliente
    </Link>
  )
}

export default AcessoAreaCliente
