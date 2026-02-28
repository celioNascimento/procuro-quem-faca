'use client'
import EditarPerfilTab from '@/components/dashboard/EditarPerfilTab'

/**
 * Página de Perfil do Dashboard
 * * Sendo JS puro, o Next.js exige apenas o 'export default'.
 * Adicionamos a largura max-w-7xl para garantir que o formulário
 * tenha o mesmo espaço visual do cadastro.
 */
export default function PerfilPage() {
  return (
    <div className="bg-[#F8FAFC] min-h-screen">
      {/* CORREÇÃO CIRÚRGICA: Removido o padding top (pt-0) para que o layout base dite a distância da logo */}
      <main className="max-w-7xl mx-auto px-4 md:px-8 pb-8 pt-0">
        <EditarPerfilTab />
      </main>
    </div>
  )
}