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
      console.log('🔄 Toggling portfólio...', { prestadorId, obrigatorio })
      const novoValor = !obrigatorio
      
      // Atualizar no Supabase
      await updatePortfolioObrigatorio(prestadorId, novoValor)
      
      // Atualizar estado LOCAL
      console.log('✅ Atualização bem-sucedida, atualizando estado local')
      setObrigatorio(novoValor)
      
      // Chamar callback pai para sincronizar state global
      onSuccess?.(novoValor)
      
    } catch (erro) {
      console.error('❌ Erro ao atualizar portfólio:', erro)
      const mensagem = erro instanceof Error ? erro.message : 'Erro ao atualizar configuração'
      setErro(mensagem)
    } finally {
      setCarregando(false)
    }
  }

  return (
    <div className="flex items-center justify-between p-4 border border-slate-200 rounded-2xl gap-4">
      <div className="flex-1">
        <h3 className="font-semibold text-base text-slate-900">Portfólio Obrigatório</h3>
        <p className="text-sm text-slate-600 mt-1">
          {obrigatorio
            ? 'Fotos são obrigatórias no início e fim do serviço'
            : 'Fotos são opcionais — aceite do cliente ainda é obrigatório'}
        </p>
        {erro && <p className="text-sm text-red-600 mt-2 font-medium">⚠️ {erro}</p>}
      </div>
      <button
        onClick={handleToggle}
        disabled={carregando}
        className={`px-6 py-2 rounded-lg font-black text-xs uppercase tracking-wide transition whitespace-nowrap ${
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
