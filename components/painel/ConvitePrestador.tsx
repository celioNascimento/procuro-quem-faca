// components/painel/ConvitePrestador.tsx

'use client'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'

// Convite discreto para quem ainda não tem cadastro profissional.
// Quem já tem perfil (completo ou pendente) acessa a área pelo cabeçalho,
// então este convite não aparece para essas contas.
export function ConvitePrestador() {
  const { session, role, roleLoading } = useAuth()

  // Espera saber o papel da conta para não mostrar o convite errado por um instante.
  if (session === undefined || !session || roleLoading) return null
  if (role === 'prestador') return null

  return (
    <p className="mt-1 text-[13px] text-slate-600">
      Oferece algum serviço?{' '}
      {/* Área de toque de 44px sem aumentar o espaço do texto (o padding é compensado pela margem negativa). */}
      <Link
        href="/cadastro"
        className="inline-block py-3 -my-3 font-semibold text-blue-700 underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-100 rounded"
      >
        Cadastre-se como prestador
      </Link>
    </p>
  )
}

export default ConvitePrestador
