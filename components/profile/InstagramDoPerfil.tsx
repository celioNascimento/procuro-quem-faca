// components/profile/InstagramDoPerfil.tsx — botão "Instagram" do perfil público.
// O endereço é montado aqui a partir do usuário guardado (instagram.com/<usuario>); o que vier fora do formato
// do Instagram não aparece, mesmo que alguém tenha gravado direto no banco.
import { Instagram } from 'lucide-react'
import { arrobaDoInstagram, enderecoDoInstagram, usuarioDeInstagramValido } from '@/lib/instagram'

export function InstagramDoPerfil({ usuario }: { usuario?: string | null }) {
  if (!usuario || !usuarioDeInstagramValido(usuario)) return null
  return (
    <a
      href={enderecoDoInstagram(usuario)}
      target="_blank"
      rel="noopener noreferrer"
      data-testid="perfil-instagram"
      className="mt-3 flex min-h-12 w-full items-center justify-center gap-2 rounded-[2rem] border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 shadow-sm transition-all hover:border-pink-200 hover:text-pink-600 active:scale-[0.98]"
    >
      <Instagram size={18} aria-hidden="true" />
      <span className="truncate">Ver Instagram <span className="font-semibold text-slate-400">{arrobaDoInstagram(usuario)}</span></span>
    </a>
  )
}
