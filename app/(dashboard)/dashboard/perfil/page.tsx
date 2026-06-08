'use client'
import { Suspense } from 'react'
import EditarPerfilTab from '@/components/dashboard/EditarPerfilTab'

function PerfilPageContent() {
  return (
    <div className="w-full">
      <EditarPerfilTab />
    </div>
  )
}

export default function PerfilPage() {
  return (
    <Suspense fallback={
      <div className="p-20 text-center animate-pulse font-bold text-slate-300 uppercase tracking-widest">
        Carregando perfil...
      </div>
    }>
      <PerfilPageContent />
    </Suspense>
  )
}