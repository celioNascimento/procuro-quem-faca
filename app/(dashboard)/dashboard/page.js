'use client'
import EditarPerfilTab from '@/components/dashboard/EditarPerfilTab'

export default function PerfilPage() {
  return (
    <div className="bg-[#F8FAFC] min-h-screen"> {/* Alterado para o fundo cinza claro padrão do app */}
      <main className="max-w-7xl mx-auto p-4 md:p-8"> {/* Largura expandida para 7xl (1280px) */}
        {/* O componente EditarPerfilTab agora terá espaço para respirar */}
        <EditarPerfilTab />
      </main>
    </div>
  )
}