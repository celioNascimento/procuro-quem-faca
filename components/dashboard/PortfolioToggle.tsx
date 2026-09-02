'use client'

import { useState } from 'react'
import { updatePortfolioObrigatorio } from '@/lib/services/prestadorPerfil.service'

interface PortfolioToggleProps {
  prestadorId: number
  inicial: boolean
  onSuccess?: (novoValor: boolean) => void
}

export function PortfolioToggle({
  prestadorId,
  inicial,
  onSuccess,
}: PortfolioToggleProps) {
  const [obrigatorio, setObrigatorio] = useState(inicial)
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  const handleToggle = async () => {
    setCarregando(true)
    setErro(null)
    try {
      const novoValor = !obrigatorio
      await updatePortfolioObrigatorio(prestadorId, novoValor)
      setObrigatorio(novoValor)
      onSuccess?.(novoValor)
    } catch (erro) {
      console.error('Erro ao atualizar portfolio:', erro)
      setErro('Erro ao atualizar configuração')
    } finally {
      setCarregando(false)
    }
  }

  return (
    <div className="flex items-center justify-between p-4 border rounded-lg gap-4">
      <div className="flex-1">
        <h3 className="font-semibold text-lg">Fotos por padrão</h3>
        <p className="text-sm text-gray-600 mt-1">
          {obrigatorio
            ? 'Ativado: todo novo serviço pede fotos. Depois, você pode usar essas imagens para criar um projeto no seu portfólio ou dispensá-las naquele serviço.'
            : 'Desativado: os serviços não pedem fotos automaticamente. Você decide em cada serviço se quer enviar imagens e criar um projeto no portfólio.'}
        </p>
        {erro && <p className="text-sm text-red-600 mt-2">{erro}</p>}
      </div>
      <button
        onClick={handleToggle}
        disabled={carregando}
        className={`px-6 py-2 rounded font-medium transition whitespace-nowrap ${
          obrigatorio
            ? 'bg-green-100 text-green-800 hover:bg-green-200'
            : 'bg-orange-100 text-orange-800 hover:bg-orange-200'
        } ${
          carregando ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
        }`}
      >
        {carregando ? 'Atualizando...' : obrigatorio ? 'Desativar' : 'Ativar'}
      </button>
    </div>
  )
}
