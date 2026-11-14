'use client'

import { useState } from 'react'
import { updatePortfolioObrigatorio } from '@/lib/services/prestadorPerfil.service'

interface PortfolioToggleProps {
  prestadorId: number
  inicial: boolean
  onSuccess?: (novoValor: boolean) => void
}

/**
 * Interruptor de "começar com fotos". Grava na hora (não espera o botão de salvar do perfil).
 */
export function PortfolioToggle({ prestadorId, inicial, onSuccess }: PortfolioToggleProps) {
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
      setErro('Não conseguimos salvar agora. Tente de novo.')
    } finally {
      setCarregando(false)
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-start justify-between gap-4 rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
        <div className="min-w-0">
          <p id="toggle-fotos-rotulo" className="text-sm font-bold text-slate-800">Começar com registro de fotos</p>
          <p id="toggle-fotos-descricao" className="mt-1 text-sm leading-relaxed text-slate-500">
            {obrigatorio
              ? 'Ligado: ao registrar um trabalho, a opção “com fotos” já vem marcada. Em cada trabalho você pode trocar para “sem fotos”.'
              : 'Desligado: ao registrar um trabalho, a opção “sem fotos” já vem marcada. Em cada trabalho você pode escolher “com fotos”.'}
          </p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={obrigatorio}
          aria-labelledby="toggle-fotos-rotulo"
          aria-describedby="toggle-fotos-descricao"
          onClick={handleToggle}
          disabled={carregando}
          className={`relative mt-0.5 inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-100 disabled:opacity-50 ${obrigatorio ? 'bg-blue-600' : 'bg-slate-300'}`}
        >
          <span className={`inline-block size-5 rounded-full bg-white shadow transition-transform ${obrigatorio ? 'translate-x-6' : 'translate-x-1'}`} />
        </button>
      </div>
      {erro && <p role="alert" className="text-sm font-semibold text-red-600">{erro}</p>}
    </div>
  )
}
