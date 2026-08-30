//hooks/useEditarPerfilPrestador.ts

import { useState, useCallback, useEffect } from 'react'
import { Prestador } from '@/types/prestador'
import {
  updatePortfolioObrigatorio,
  atualizarPerfilPrestador,
  getPrestador, // ← já existe no service
} from '@/lib/services/prestadorPerfil.service'

interface UseEditarPerfilPrestadorProps {
  prestadorId: number
  prestadorInicial?: Prestador | null
}

export function useEditarPerfilPrestador({
  prestadorId,
  prestadorInicial,
}: UseEditarPerfilPrestadorProps) {
  const [prestador, setPrestador] = useState<Prestador | null>(prestadorInicial ?? null)
  const [carregando, setCarregando] = useState(false)
  const [carregandoInicial, setCarregandoInicial] = useState(!prestadorInicial)
  const [erro, setErro] = useState<string | null>(null)

  // Busca o prestador real do banco sempre que o componente monta
  // (ou o prestadorId muda), em vez de depender só de prestadorInicial.
  useEffect(() => {
    if (!prestadorId) return

    let cancelado = false
    setCarregandoInicial(true)
    setErro(null)

    getPrestador(prestadorId)
      .then(data => {
        if (!cancelado) setPrestador(data)
      })
      .catch(err => {
        if (!cancelado) {
          const mensagem = err instanceof Error ? err.message : 'Erro ao carregar perfil'
          setErro(mensagem)
        }
      })
      .finally(() => {
        if (!cancelado) setCarregandoInicial(false)
      })

    return () => { cancelado = true }
  }, [prestadorId])

  const handleTogglePortfolio = useCallback(
    async (novoValor: boolean) => {
      setCarregando(true)
      setErro(null)
      try {
        await updatePortfolioObrigatorio(prestadorId, novoValor)
        setPrestador(prev =>
          prev ? { ...prev, portfolio_obrigatorio: novoValor } : null,
        )
        return novoValor
      } catch (err) {
        const mensagem =
          err instanceof Error ? err.message : 'Erro ao atualizar portfólio'
        setErro(mensagem)
        throw err
      } finally {
        setCarregando(false)
      }
    },
    [prestadorId],
  )

  const handleAtualizarPerfil = useCallback(
    async (dados: Partial<Prestador>) => {
      setCarregando(true)
      setErro(null)
      try {
        await atualizarPerfilPrestador(prestadorId, dados)
        setPrestador(prev => (prev ? { ...prev, ...dados } : null))
        return dados
      } catch (err) {
        const mensagem =
          err instanceof Error ? err.message : 'Erro ao atualizar perfil'
        setErro(mensagem)
        throw err
      } finally {
        setCarregando(false)
      }
    },
    [prestadorId],
  )

  return {
    prestador,
    carregando,
    carregandoInicial, // ← novo: usar pra mostrar loading no componente
    erro,
    handleTogglePortfolio,
    handleAtualizarPerfil,
  }
}
