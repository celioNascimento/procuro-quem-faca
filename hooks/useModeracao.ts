//hooks/useModeracao.ts

'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  fetchDenuncias,
  atualizarStatusDenuncia,
  bloquearPrestadorDenunciado,
  desbloquearPrestador,
  type DenunciaComPrestador,
} from '@/lib/services/denuncia.service'
import { insertLog } from '@/lib/db/logs'

type FiltroStatus = 'aberta' | 'resolvida' | 'arquivada' | 'todas'

export function useModeracao() {
  const [denuncias, setDenuncias] = useState<DenunciaComPrestador[]>([])
  const [loading, setLoading] = useState(true)
  const [filtro, setFiltro] = useState<FiltroStatus>('aberta')
  const [processando, setProcessando] = useState<string | null>(null)

  const carregar = useCallback(async () => {
    setLoading(true)
    try {
      const data = await fetchDenuncias(filtro === 'todas' ? undefined : filtro)
      setDenuncias(data)
    } catch (err) {
      console.error('Erro ao carregar denúncias:', err)
    } finally {
      setLoading(false)
    }
  }, [filtro])

  useEffect(() => { carregar() }, [carregar])

  const arquivar = useCallback(async (denunciaId: string) => {
    setProcessando(denunciaId)
    try {
      await atualizarStatusDenuncia(denunciaId, 'arquivada')
      await insertLog({ acao: 'DENUNCIA_ARQUIVADA', entidadeTipo: 'denuncia', entidadeId: denunciaId })
      await carregar()
    } finally {
      setProcessando(null)
    }
  }, [carregar])

  const resolverSemBloqueio = useCallback(async (denunciaId: string) => {
    setProcessando(denunciaId)
    try {
      await atualizarStatusDenuncia(denunciaId, 'resolvida')
      await insertLog({ acao: 'DENUNCIA_RESOLVIDA', entidadeTipo: 'denuncia', entidadeId: denunciaId })
      await carregar()
    } finally {
      setProcessando(null)
    }
  }, [carregar])

  const resolverComBloqueio = useCallback(async (denunciaId: string, prestadorId: number, motivo: string) => {
    setProcessando(denunciaId)
    try {
      await bloquearPrestadorDenunciado(prestadorId, motivo)
      await atualizarStatusDenuncia(denunciaId, 'resolvida')
      await insertLog({
        acao: 'PRESTADOR_BLOQUEADO_VIA_DENUNCIA',
        entidadeTipo: 'prestador',
        entidadeId: String(prestadorId),
        detalhes: { denuncia_id: denunciaId, motivo },
      })
      await carregar()
    } finally {
      setProcessando(null)
    }
  }, [carregar])

  const desbloquear = useCallback(async (denunciaId: string, prestadorId: number) => {
    setProcessando(denunciaId)
    try {
      await desbloquearPrestador(prestadorId)
      await insertLog({ acao: 'PRESTADOR_DESBLOQUEADO', entidadeTipo: 'prestador', entidadeId: String(prestadorId) })
      await carregar()
    } finally {
      setProcessando(null)
    }
  }, [carregar])

  return { denuncias, loading, filtro, setFiltro, processando, arquivar, resolverSemBloqueio, resolverComBloqueio, desbloquear }
}
