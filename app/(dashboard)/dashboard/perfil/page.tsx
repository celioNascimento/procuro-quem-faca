// app/(dashboard)/dashboard/perfil/page.tsx

'use client'

import { Suspense, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

// Rota mantida por compatibilidade com links existentes (ex: "Minha Conta"
// em HeaderAuthButton) — redireciona para a aba "Dados Profissionais" da
// página real do dashboard, eliminando a duplicação de UI/gatekeeping que
// existia aqui antes (esta página não aplicava o mesmo bloqueio de
// cadastroCompleto que /dashboard aplica).
function RedirecionarParaDashboard() {
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const origem = searchParams.get('origem')
    const params = new URLSearchParams({ aba: 'perfil' })
    if (origem) params.set('origem', origem)
    router.replace(`/dashboard?${params.toString()}`)
  }, [router, searchParams])

  return (
    <div className="p-20 text-center animate-pulse font-bold text-slate-300 uppercase tracking-widest">
      Redirecionando...
    </div>
  )
}

export default function PerfilPage() {
  return (
    <Suspense fallback={
      <div className="p-20 text-center animate-pulse font-bold text-slate-300 uppercase tracking-widest">
        Redirecionando...
      </div>
    }>
      <RedirecionarParaDashboard />
    </Suspense>
  )
}