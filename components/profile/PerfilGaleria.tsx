'use client'

import { Images } from 'lucide-react'
import type { ProjetoPerfil } from '@/types/perfil'

interface Props {
  projetos: ProjetoPerfil[]
  titulo?: string | null
}

export default function PerfilGaleria({ projetos, titulo }: Props) {
  const fotos = projetos
    .flatMap((projeto) => projeto.portfolio_fotos.map((foto) => ({ ...foto, titulo: projeto.titulo })))
    .sort((a, b) => a.ordem - b.ordem)
    .slice(0, 5)

  if (fotos.length === 0) return null

  return (
    <section className="rounded-[2rem] border border-slate-100 bg-white p-6 shadow-sm">
      <h2 className="mb-4 text-[10px] font-black uppercase tracking-widest text-blue-600">
        {titulo?.trim() || 'Meu trabalho'}
      </h2>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {fotos.map((foto, index) => (
          <figure key={`${foto.id}-${index}`} className="group overflow-hidden rounded-xl bg-slate-100">
            <img
              src={foto.url_foto || ''}
              alt={foto.legenda || foto.titulo || 'Imagem do trabalho do profissional'}
              className="aspect-square w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          </figure>
        ))}
      </div>
      <div className="mt-3 flex items-center gap-2 text-[10px] font-semibold text-slate-400">
        <Images size={14} aria-hidden="true" />
        <span>{fotos.length} {fotos.length === 1 ? 'foto' : 'fotos'}</span>
      </div>
    </section>
  )
}
