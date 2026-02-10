'use client'
import { useState, useEffect } from 'react'

export default function AuthSkeleton() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Enquanto não estiver montado no cliente, renderizamos um container vazio 
  // que combina com o que o servidor espera (evitando o mismatch)
  if (!mounted) {
    return <div className="fixed inset-0 bg-[#F8FAFC]" />
  }

  return (
    <div className="fixed inset-0 z-[999] bg-[#F8FAFC] flex flex-col items-center justify-center p-6 animate-pulse">
      {/* Logo Placeholder */}
      <div className="w-32 h-12 bg-slate-200/60 rounded-2xl mb-8" />
      
      {/* Card Placeholder */}
      <div className="w-full max-w-[400px] bg-white rounded-[3rem] p-10 border border-slate-100 shadow-xl">
        <div className="h-8 bg-slate-100 rounded-lg w-3/4 mb-6" />
        <div className="space-y-4">
          <div className="h-12 bg-slate-50 rounded-2xl w-full" />
          <div className="h-12 bg-slate-50 rounded-2xl w-full" />
          <div className="h-12 bg-blue-100 rounded-2xl w-full mt-6" />
        </div>
      </div>
    </div>
  )
}