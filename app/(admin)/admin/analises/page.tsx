// app/(admin)/admin/analises/page.tsx — aba Resumo: tráfego separado entre equipe, anônimos e robôs.
'use client'

import { useAdminTrafego } from '@/hooks/useAdminTrafego'
import { TrafegoCard } from '@/components/admin/TrafegoCard'

export default function AnalisesResumoPage() {
  const trafego = useAdminTrafego()
  return <TrafegoCard dias={trafego.dias} onDias={trafego.setDias} resumo={trafego.resumo} leitura={trafego.leitura} carregando={trafego.carregando} erro={trafego.erro} />
}
