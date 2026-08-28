'use client'

import { useAuth } from '@/hooks/useAuth'
import { usePerfilStatus } from '@/hooks/usePerfilStatus'
import { useEditarPerfilPrestador } from '@/hooks/useEditarPerfilPrestador'
import { PortfolioToggle } from '@/components/dashboard/PortfolioToggle'
import { Loader2 } from 'lucide-react'

export default function EditarPerfilTab() {
  const { session } = useAuth()
  const { prestadorId } = usePerfilStatus()
  const { prestador, carregando, handleTogglePortfolio } = useEditarPerfilPrestador({
    prestadorId: prestadorId ?? 0,
    prestadorInicial: null,
  })

  if (!session || !prestadorId) {
    return (
      <div className="flex min-h-64 flex-col items-center justify-center gap-4">
        <Loader2 className="size-8 animate-spin text-blue-600" />
        <p className="text-sm font-medium text-slate-500">Carregando perfil...</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-8">
      {/* Seu conteúdo de edição de perfil aqui */}
      
      {/* NOVO: Seção de configuração de portfólio */}
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-black text-slate-900">Configurações do Portfólio</h2>
          <p className="text-sm text-slate-500 mt-1">
            Defina se fotos são obrigatórias nos seus serviços
          </p>
        </div>
        
        <PortfolioToggle
          prestadorId={prestadorId}
          inicial={prestador?.portfolio_obrigatorio ?? true}
          onSuccess={() => {
            // Toast de sucesso pode ser adicionado aqui
          }}
        />
      </div>
    </div>
  )
}
