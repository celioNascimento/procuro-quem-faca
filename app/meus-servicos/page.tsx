// app/meus-servicos/page.tsx

import { Suspense } from 'react'
import PainelDoCliente from '@/components/meus-servicos/PainelDoCliente'
import PainelDoClienteSkeleton from '@/components/skeletons/PainelDoClienteSkeleton'

export default function MeusServicosPage() {
  return (
    <Suspense fallback={<PainelDoClienteSkeleton />}>
      <PainelDoCliente />
    </Suspense>
