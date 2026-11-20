'use client'

import { useState } from 'react'
import { bloquearPrestadorDenunciado, desbloquearPrestador } from '@/lib/services/denuncia.service'

export const MENSAGEM_SEM_MOTIVO = 'Escreva o motivo do bloqueio. Ele fica registrado.'

// Bloqueio feito pela equipe, sem esperar denúncia. Usa as mesmas funções do banco da tela Denúncias.
export function useBloqueioPrestador(aoConcluir: (prestadorId: number, bloqueado: boolean) => void) {
  const [processando, setProcessando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  async function executar(prestadorId: number, bloqueado: boolean, acao: () => Promise<void>): Promise<boolean> {
    setProcessando(true)
    setErro(null)
    try {
      await acao()
      aoConcluir(prestadorId, bloqueado)
      return true
    } catch {
      setErro(bloqueado ? 'Não foi possível bloquear. Tente de novo.' : 'Não foi possível desbloquear. Tente de novo.')
      return false
    } finally {
      setProcessando(false)
    }
  }

  async function bloquear(prestadorId: number, motivo: string) {
    if (!motivo.trim()) {
      setErro(MENSAGEM_SEM_MOTIVO)
      return false
    }
    return executar(prestadorId, true, () => bloquearPrestadorDenunciado(prestadorId, motivo.trim()))
  }

  async function desbloquear(prestadorId: number) {
    return executar(prestadorId, false, () => desbloquearPrestador(prestadorId))
  }

  return { processando, erro, limparErro: () => setErro(null), bloquear, desbloquear }
}
