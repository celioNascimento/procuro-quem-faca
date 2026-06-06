'use client'
import EditarPerfilTab from '@/components/dashboard/EditarPerfilTab'

/**
 * Página de Perfil do Dashboard
 * * Agora a largura e o fundo são ditados pelo DashboardLayout.
 * * A página injeta o componente em 100% da área útil disponibilizada.
 */
export default function PerfilPage() {
  return (
    <div className="w-full">
      <EditarPerfilTab />
    </div>
  )
}