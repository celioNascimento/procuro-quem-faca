// components/dashboard/CentralDivulgacaoTab.tsx
'use client'
import { useState } from 'react'
import { Loader2, Smartphone, Car, Link2, ImagePlus } from 'lucide-react'
import { useKitDivulgacao } from '@/hooks/useKitDivulgacao'
import { CartaoDigitalPanel } from './divulgacao/CartaoDigitalPanel'
import { MaterialFisicoPanel } from './divulgacao/MaterialFisicoPanel'
import { LinksPanel } from './divulgacao/LinksPanel'
import { ContextualHelp } from '@/components/help/HelpCenter'
import { temPortfolio } from '@/lib/divulgacao/portfolio'

type SubAba = 'cartao' | 'fisico' | 'links'
const SUBABAS: { id: SubAba; label: string; icon: React.ReactNode }[] = [
  { id: 'cartao', label: 'Cartão digital & WhatsApp', icon: <Smartphone size={14} aria-hidden="true" /> },
  { id: 'fisico', label: 'Adesivos & QR Code', icon: <Car size={14} aria-hidden="true" /> },
  { id: 'links', label: 'Links & mensagens', icon: <Link2 size={14} aria-hidden="true" /> },
]

interface Props {
  prestadorId: number | null
  /** Leva o prestador à aba de trabalhos, onde ele registra o primeiro. */
  onIrParaTrabalhos?: () => void
}

export default function CentralDivulgacaoTab({ prestadorId, onIrParaTrabalhos }: Props) {
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
      {!temPortfolio(dados) && (
        <aside aria-label="Seu perfil ainda não tem trabalhos" className="flex flex-col gap-3 rounded-3xl border border-blue-100 bg-blue-50 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-700"><ImagePlus size={18} aria-hidden="true" /></span>
            <div>
              <p className="text-sm font-black text-blue-950">Seus materiais já estão prontos para usar</p>
              <p className="mt-0.5 text-sm text-blue-950">Eles levam o cliente ao seu perfil. Quando você concluir um trabalho com fotos, o cartão passa a mostrar a foto do serviço e o seu perfil ganha mais confiança.</p>
            </div>
          </div>
          {onIrParaTrabalhos && (
            <button type="button" onClick={onIrParaTrabalhos} className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-200">
              Registrar um trabalho
            </button>
          )}
        </aside>
      )}
      <div role="tablist" aria-label="Materiais de divulgação" className="flex gap-2 overflow-x-auto">
        {SUBABAS.map(s => (
          <button key={s.id} role="tab" type="button" aria-selected={aba === s.id} onClick={() => setAba(s.id)}
            className={`flex min-h-11 shrink-0 items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-100 ${aba === s.id ? 'bg-slate-900 text-white' : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'}`}>
            {s.icon}{s.label}
          </button>
        ))}
      </div>
      <div role="tabpanel">
        {aba === 'cartao' && <CartaoDigitalPanel dados={dados} imagens={imagens} />}
        {aba === 'fisico' && <MaterialFisicoPanel dados={dados} imagens={imagens} />}
        {aba === 'links' && <LinksPanel dados={dados} />}
      </div>
      <ContextualHelp context="divulgacao" audience="prestador" title="Dúvidas sobre divulgação?" />
    </div>
  )
}
