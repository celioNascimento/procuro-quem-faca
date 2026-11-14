// components/profile/PerfilSobre.tsx

import type { PrestadorPerfil } from '@/types/perfil'
import { bioParaExibir } from '@/lib/bioPerfil'

interface Props {
  prestador: PrestadorPerfil
}

export default function PerfilSobre({ prestador }: Props) {
  // Bio padrão do cadastro automático não diz nada sobre a pessoa: vira uma frase com a categoria e a cidade.
  const bio = bioParaExibir({
    bio: prestador.bio,
    categoria: prestador.categorias?.nome || prestador.categoria,
    cidade: prestador.cidades?.nome,
  })

  if (!bio) return null

  return (
    <section className="rounded-[2rem] border border-slate-100 bg-white p-6 shadow-sm">
      <h2 className="mb-2 text-base font-bold text-slate-900">Sobre o profissional</h2>
      <p className="whitespace-pre-wrap text-[15px] leading-relaxed text-slate-600">{bio.texto}</p>
    </section>
  )
}
