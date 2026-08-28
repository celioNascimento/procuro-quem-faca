import { useState, useCallback } from 'react'
import { Prestador } from '@/types/prestador'
import { updatePortfolioObrigatorio, atualizarPerfilPrestador } from '@/lib/services/prestadorPerfil.service'

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
  const [erro, setErro] = useState<string | null>(null)

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
    erro,
    handleTogglePortfolio,
    handleAtualizarPerfil,
  }
}
