// components/dashboard/DesempenhoDashboardTab.tsx
//
// Aba "Desempenho" do dashboard do prestador. Reúne, em duas sub-abas:
//   - Análises: visitas ao perfil e pedidos de orçamento pelo WhatsApp (antes fixos no topo);
//   - Avaliações: reputação, distribuição das notas e comentários recebidos.
//
// "Análises" abre por padrão: avaliações são poucas e esporádicas, enquanto o prestador
// volta ao painel para ver se está recebendo contato.

'use client'

import { useRef, useState, type KeyboardEvent } from 'react'
import { BarChart3, Star } from 'lucide-react'
import AvaliacoesDashboardTab from '@/components/dashboard/AvaliacoesDashboardTab'
import { CliquesWhatsappCard } from '@/components/dashboard/CliquesWhatsappCard'
import { VisitasPerfilCard } from '@/components/dashboard/VisitasPerfilCard'

export type SubAbaDesempenho = 'analises' | 'avaliacoes'

const SUB_ABAS: { id: SubAbaDesempenho; label: string; icon: typeof Star }[] = [
  { id: 'analises', label: 'Análises', icon: BarChart3 },
  { id: 'avaliacoes', label: 'Avaliações', icon: Star },
]

interface DesempenhoDashboardTabProps {
  prestadorId: number | null
  subAbaInicial?: SubAbaDesempenho
}

export default function DesempenhoDashboardTab({
  prestadorId,
  subAbaInicial = 'analises',
}: DesempenhoDashboardTabProps) {
  const [subAba, setSubAba] = useState<SubAbaDesempenho>(subAbaInicial)
  const botoes = useRef<Record<SubAbaDesempenho, HTMLButtonElement | null>>({
    analises: null,
    avaliacoes: null,
  })

  // Setas esquerda/direita alternam a sub-aba, como esperado de um tablist.
  const aoTeclar = (evento: KeyboardEvent<HTMLButtonElement>) => {
    if (evento.key !== 'ArrowLeft' && evento.key !== 'ArrowRight') return
    evento.preventDefault()
    const atual = SUB_ABAS.findIndex((item) => item.id === subAba)
    const passo = evento.key === 'ArrowRight' ? 1 : -1
    const proxima = SUB_ABAS[(atual + passo + SUB_ABAS.length) % SUB_ABAS.length].id
    setSubAba(proxima)
    botoes.current[proxima]?.focus()
  }

  return (
    <section className="flex flex-col gap-5" aria-labelledby="desempenho-titulo">
      <div>
        <p className="text-[10px] font-black uppercase tracking-[0.22em] text-blue-600">Desempenho</p>
        <h2 id="desempenho-titulo" className="mt-1 text-2xl font-black tracking-tight text-slate-900">
          Como o seu perfil está indo
        </h2>
      </div>

      <div
        role="tablist"
        aria-label="Visões de desempenho"
        className="flex w-full gap-1 rounded-2xl bg-slate-100 p-1 sm:w-fit"
      >
        {SUB_ABAS.map(({ id, label, icon: Icone }) => {
          const ativa = subAba === id
          return (
            <button
              key={id}
              ref={(elemento) => {
                botoes.current[id] = elemento
              }}
              id={`desempenho-tab-${id}`}
              type="button"
              role="tab"
              aria-selected={ativa}
              aria-controls={`desempenho-painel-${id}`}
              tabIndex={ativa ? 0 : -1}
              onClick={() => setSubAba(id)}
              onKeyDown={aoTeclar}
              className={`flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl px-5 py-2 text-[10px] font-black uppercase tracking-widest transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-100 sm:flex-none ${
                ativa ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-blue-600'
              }`}
            >
              <Icone size={14} aria-hidden="true" />
              {label}
            </button>
          )
        })}
      </div>

      <div
        role="tabpanel"
        id={`desempenho-painel-${subAba}`}
        aria-labelledby={`desempenho-tab-${subAba}`}
      >
        {subAba === 'analises' ? (
          <div className="flex flex-col gap-4">
            <VisitasPerfilCard />
            <CliquesWhatsappCard />
          </div>
        ) : (
          <AvaliacoesDashboardTab prestadorId={prestadorId} />
        )}
      </div>
    </section>
  )
}
