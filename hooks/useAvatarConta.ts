// hooks/useAvatarConta.ts
//
// Foto do avatar do cabeçalho. Começa na foto da conta Google (já na sessão, sem espera) e, quando
// a pessoa enviou uma foto em "Meus dados", troca por ela assim que o perfil carrega.
'use client'

import { useEffect, useState } from 'react'
import * as ClienteService from '@/lib/services/cliente.service'
import { escolherAvatarConta, type MetadadosDaConta } from '@/lib/auth/avatarConta'

export function useAvatarConta(userId: string | undefined, metadados: MetadadosDaConta): string {
  const [fotoDoPerfil, setFotoDoPerfil] = useState<string | null>(null)

  useEffect(() => {
    if (!userId) return
    let cancelado = false

    ClienteService.fetchClienteProfile(userId)
      .then((perfil) => {
        if (!cancelado) setFotoDoPerfil(perfil?.avatar_url ?? null)
      })
      .catch(() => {
        // Sem o perfil, segue valendo a foto do Google (ou o ícone).
      })

    return () => {
      cancelado = true
    }
  }, [userId])

  return escolherAvatarConta(fotoDoPerfil, metadados)
}
