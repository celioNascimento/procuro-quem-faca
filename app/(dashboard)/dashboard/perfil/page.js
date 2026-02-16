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
      <main className="max-w-7xl mx-auto p-4 md:p-8">
        {/* O EditarPerfilTab contém toda a lógica de fotos, slugs e cidades */}
        <EditarPerfilTab />
      </main>
    </div>
  )
} 