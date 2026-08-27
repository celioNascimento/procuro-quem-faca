//components/profile/PerfilTabs.tsx

'use client'

import { useState } from 'react'
import { Images, Star, ChevronRight } from 'lucide-react'
import PortfolioGrid from '@/components/profile/PortfolioGrid'
import PerfilAvaliacoes from '@/components/profile/PerfilAvaliacoes'
import type { ProjetoPerfil } from '@/types/perfil'

type Avaliacao = {
  id: string | number
  projeto_id?: string | number
  // extend with the real shape from your types
  [key: string]: unknown
}

type Props = {
  projetos: ProjetoPerfil[]
  avaliacoes: Avaliacao[]
}

type Tab = 'portfolio' | 'avaliacoes'

export default function PerfilTabs({ projetos, avaliacoes }: Props) {
  const [aba, setAba] = useState<Tab>('portfolio')
  // When user clicks a review's project link, switch to portfolio tab
  // and (optionally) scroll/highlight that project
  const [projetoDestaque, setProjetoDestaque] = useState<string | number | null>(null)

  function irParaProjeto(projetoId: string | number) {
    setProjetoDestaque(projetoId)
    setAba('portfolio')
    // Clear highlight after animation
    setTimeout(() => setProjetoDestaque(null), 2000)
  }

  const totalAvaliacoes = avaliacoes.length
  const totalProjetos = projetos.length

  return (
    <section className="flex flex-col gap-0" aria-label="Portfólio e Avaliações">

      {/* Tab bar */}
      <div className="flex items-center gap-1 rounded-2xl bg-slate-100 p-1">
        <TabButton
          active={aba === 'portfolio'}
          onClick={() => setAba('portfolio')}
          icon={<Images size={13} strokeWidth={2.5} />}
          label="Portfólio"
          count={totalProjetos}
        />
        <TabButton
          active={aba === 'avaliacoes'}
          onClick={() => setAba('avaliacoes')}
          icon={<Star size={13} strokeWidth={2.5} />}
          label="Avaliações"
          count={totalAvaliacoes}
        />
      </div>

      {/* Tab content */}
      <div className="mt-5">
        {aba === 'portfolio' && (
          <div className="animate-in fade-in duration-200">
            <PortfolioGrid
              projetos={projetos}
              projetoDestaque={projetoDestaque}
            />
          </div>
        )}

        {aba === 'avaliacoes' && (
          <div className="animate-in fade-in duration-200">
            <PerfilAvaliacoes
              avaliacoes={avaliacoes}
              projetos={projetos}
              onVerProjeto={irParaProjeto}
            />
          </div>
        )}
      </div>
    </section>
  )
}

// ── Tab button ──────────────────────────────────────────────────────────────

function TabButton({
  active,
  onClick,
  icon,
  label,
  count,
}: {
  active: boolean
  onClick: () => void
  icon: React.ReactNode
  label: string
  count: number
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-[11px] font-black uppercase tracking-wider transition-all duration-200',
        active
          ? 'bg-white text-slate-800 shadow-sm'
          : 'text-slate-400 hover:text-slate-600',
      ].join(' ')}
    >
      {icon}
      {label}
      {count > 0 && (
        <span
          className={[
            'rounded-full px-1.5 py-0.5 text-[9px] font-black tabular-nums transition-colors',
            active ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-400',
          ].join(' ')}
        >
          {count}
        </span>
      )}
    </button>
  )
}
