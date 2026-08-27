//components/profile/PerfilTabs.tsx

'use client'

import { useState } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { Images, Star } from 'lucide-react'
import PortfolioGrid from '@/components/profile/PortfolioGrid'
import PerfilAvaliacoes from '@/components/profile/PerfilAvaliacoes'
import ProjetoModal from '@/components/profile/ProjetoModal'
import type { ProjetoPerfil, AvaliacaoPerfil } from '@/types/perfil'

type Tab = 'portfolio' | 'avaliacoes'

interface Props {
  projetos: ProjetoPerfil[]
  avaliacoes: AvaliacaoPerfil[]
}

export default function PerfilTabs({ projetos, avaliacoes }: Props) {
  const [aba, setAba] = useState<Tab>('portfolio')
  const router       = useRouter()
  const pathname     = usePathname()
  const searchParams = useSearchParams()

  const projetoId    = searchParams.get('projeto')
  const projetoAberto = projetoId
    ? projetos.find(p => String(p.id) === projetoId) ?? null
    : null

  function abrirModal(projetoId: string | number) {
    router.push(`${pathname}?projeto=${projetoId}`, { scroll: false })
  }

  function fecharModal() {
    router.push(pathname, { scroll: false })
  }

  return (
    <section className="flex flex-col gap-5" aria-label="Portfólio e Avaliações">

      <div className="flex items-center gap-1 rounded-2xl bg-slate-100 p-1">
        <TabButton
          active={aba === 'portfolio'}
          onClick={() => setAba('portfolio')}
          icon={<Images size={13} strokeWidth={2.5} />}
          label="Portfólio"
          count={projetos.length}
        />
        <TabButton
          active={aba === 'avaliacoes'}
          onClick={() => setAba('avaliacoes')}
          icon={<Star size={13} strokeWidth={2.5} />}
          label="Avaliações"
          count={avaliacoes.length}
        />
      </div>

      {aba === 'portfolio' && (
        <div className="animate-in fade-in duration-200">
          <PortfolioGrid
            projetos={projetos}
            onAbrirProjeto={abrirModal}
            projetoAbertoId={projetoId}
          />
        </div>
      )}

      {aba === 'avaliacoes' && (
        <div className="animate-in fade-in duration-200">
          <PerfilAvaliacoes
            avaliacoes={avaliacoes}
            projetos={projetos}
            onVerProjeto={abrirModal}
          />
        </div>
      )}

      {/* Modal vive aqui — independente da aba ativa */}
      {projetoAberto && (
        <ProjetoModal
          projeto={projetoAberto}
          onClose={fecharModal}
        />
      )}

    </section>
  )
}

function TabButton({
  active, onClick, icon, label, count,
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
        <span className={[
          'rounded-full px-1.5 py-0.5 text-[9px] font-black tabular-nums transition-colors',
          active ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-400',
        ].join(' ')}>
          {count}
        </span>
      )}
    </button>
  )
}