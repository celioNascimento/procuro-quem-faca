// components/dashboard/CentralDivulgacaoTab.tsx
'use client'
import { useState } from 'react'
import { Loader2, Smartphone, Car, Link2 } from 'lucide-react'
import { useKitDivulgacao } from '@/hooks/useKitDivulgacao'
import { CartaoDigitalPanel } from './divulgacao/CartaoDigitalPanel'
import { MaterialFisicoPanel } from './divulgacao/MaterialFisicoPanel'
import { LinksPanel } from './divulgacao/LinksPanel'

type SubAba = 'cartao' | 'fisico' | 'links'
const SUBABAS: { id: SubAba; label: string; icon: React.ReactNode }[] = [
  { id: 'cartao', label: 'Cartão digital & WhatsApp', icon: <Smartphone size={14} aria-hidden="true" /> },
  { id: 'fisico', label: 'Adesivos & QR Code', icon: <Car size={14} aria-hidden="true" /> },
  { id: 'links', label: 'Links & orçamentos', icon: <Link2 size={14} aria-hidden="true" /> },
]

export default function CentralDivulgacaoTab({ prestadorId }: { prestadorId: number | null }) {
  const [aba, setAba] = useState<SubAba>('cartao')
  const { dados, imagens, loading, erro } = useKitDivulgacao(prestadorId)

  if (loading) {
    return (
      <div className="flex min-h-64 items-center justify-center" role="status">
        <Loader2 className="size-8 animate-spin text-blue-600" aria-hidden="true" />
        <span className="sr-only">Preparando seus materiais</span>
      </div>
    )
  }
  if (erro || !dados || !imagens) {
    return <p role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">Não foi possível carregar seus materiais agora. Atualize a página e tente de novo.</p>
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-lg font-black tracking-tight text-slate-900">Central de divulgação</h2>
        <p className="mt-1 max-w-2xl text-sm text-slate-600">Materiais prontos com os dados do seu perfil. Tudo é gratuito e sempre aponta para a sua vitrine.</p>
      </div>
      <div role="tablist" aria-label="Materiais de divulgação" className="flex gap-2 overflow-x-auto">
        {SUBABAS.map(s => (
          <button key={s.id} role="tab" type="button" aria-selected={aba === s.id} onClick={() => setAba(s.id)}
            className={`flex min-h-11 shrink-0 items-center gap-2 rounded-xl px-4 py-2.5 text-[10px] font-black uppercase tracking-widest focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-100 ${aba === s.id ? 'bg-slate-900 text-white' : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'}`}>
            {s.icon}{s.label}
          </button>
        ))}
      </div>
      <div role="tabpanel">
        {aba === 'cartao' && <CartaoDigitalPanel dados={dados} imagens={imagens} />}
        {aba === 'fisico' && <MaterialFisicoPanel dados={dados} imagens={imagens} />}
        {aba === 'links' && <LinksPanel dados={dados} />}
      </div>
    </div>
  )
}
