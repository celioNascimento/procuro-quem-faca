// components/shared/AvatarPrestador.tsx
//
// Foto do prestador com reserva: sem foto (ou foto que não carrega), mostra o ícone da área
// (mesmo visual da lista de busca) ou, sem ícone conhecido, as iniciais coloridas.
// Antes os cards apontavam para /placeholder-avatar.png, que não existe: imagem quebrada.
'use client'

import { useState } from 'react'
import { corDasIniciais, getIniciais } from '@/lib/prestadorUtils'
import { iconeDaCategoria, visualDaArea } from '@/lib/areaVisual'

type Props = {
  foto?: string | null
  nome?: string | null
  categoria?: Parameters<typeof iconeDaCategoria>[0]
  /** Classes de tamanho e forma (ex.: "size-14 rounded-2xl"). */
  className?: string
  /** Tamanho do ícone/inicial; padrão para avatares de ~56 px. */
  iconeClassName?: string
}

export default function AvatarPrestador({
  foto,
  nome,
  categoria,
  className = 'size-14 rounded-2xl',
  iconeClassName = 'size-6',
}: Props) {
  const [falhou, setFalhou] = useState(false)
  const temFoto = Boolean(foto) && !falhou
  const visual = visualDaArea(iconeDaCategoria(categoria))

  if (temFoto) {
    return (
      <span className={`flex shrink-0 items-center justify-center overflow-hidden border border-slate-100 bg-slate-50 ${className}`}>
        <img
          src={foto ?? undefined}
          alt={nome ? `Foto de ${nome}` : 'Foto do prestador'}
          className="size-full object-contain p-1"
          onError={() => setFalhou(true)}
        />
      </span>
    )
  }

  const cores = visual ? visual.cores : corDasIniciais(nome || '')
  return (
    <span role="img" aria-label={nome ? `Sem foto de ${nome}` : 'Sem foto'} className={`flex shrink-0 items-center justify-center overflow-hidden border ${cores} ${className}`}>
      {visual ? (
        <visual.Icone aria-hidden="true" strokeWidth={1.75} className={iconeClassName} />
      ) : (
        <span aria-hidden="true" className="text-sm font-bold">{getIniciais(nome || '')}</span>
      )}
    </span>
  )
}
