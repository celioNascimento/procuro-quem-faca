// components/AvatarConta.tsx
//
// Foto da conta no cabeçalho. A foto aparece inteira (logo horizontal não é cortado no círculo). Se não há foto, ou se ela não carrega, mostra o ícone de usuário
// (nunca fica um quadro vazio). O `no-referrer` evita que o Google recuse a foto por vir de outro site.
'use client'

import { useState } from 'react'
import { User } from 'lucide-react'

interface Props {
  url?: string | null
  tamanhoIcone?: number
}

export function AvatarConta({ url, tamanhoIcone = 16 }: Props) {
  // Guarda a URL que falhou (e não um "sim/não"), para uma foto nova voltar a ser tentada.
  const [urlComFalha, setUrlComFalha] = useState<string | null>(null)

  if (url && url !== urlComFalha) {
    return (
      <img
        src={url}
        alt="Sua foto"
        referrerPolicy="no-referrer"
        onError={() => setUrlComFalha(url)}
        className="h-full w-full bg-white object-contain p-0.5"
      />
    )
  }

  return (
    <div className="flex h-full w-full items-center justify-center bg-blue-50 text-blue-600" data-testid="avatar-conta-icone">
      <User size={tamanhoIcone} aria-hidden="true" />
    </div>
  )
}
