// components/profile/SeguirPrestador.tsx — "Seguir · 12 seguidores" no cartão do perfil público.
// O prestador seguido vê só o total; quem segue não aparece para ninguém.
import Link from 'next/link'
import { UserCheck, UserPlus } from 'lucide-react'
import { textoSeguidores } from '@/lib/feed/perfilSocial'

interface Props {
  totalSeguidores: number
  seguindo: boolean
  logado: boolean
  aviso: string | null
  onSeguir: () => void
}

export function SeguirPrestador({ totalSeguidores, seguindo, logado, aviso, onSeguir }: Props) {
  const total = textoSeguidores(totalSeguidores)
  return (
    <div className="flex flex-col gap-2" data-testid="perfil-seguir-bloco">
      <button
        type="button" onClick={onSeguir} aria-pressed={seguindo} data-testid="perfil-seguir"
        className={`flex min-h-12 w-full items-center justify-center gap-2 rounded-[1.5rem] border px-4 text-sm font-black shadow-sm transition-all active:scale-95 ${seguindo ? 'border-slate-200 bg-slate-50 text-slate-700' : 'border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100'}`}
      >
        {seguindo ? <UserCheck size={16} aria-hidden="true" /> : <UserPlus size={16} aria-hidden="true" />}
        <span>{seguindo ? 'Seguindo' : 'Seguir'}</span>
        {total && <span className="font-semibold text-slate-500" data-testid="perfil-seguidores">· {total}</span>}
      </button>
      {aviso && (
        <p role="status" className="rounded-xl bg-amber-50 p-3 text-sm font-semibold text-amber-900" data-testid="perfil-aviso">
          {aviso} {!logado && <Link href="/login" className="font-black underline">Entrar</Link>}
        </p>
      )}
    </div>
  )
}
