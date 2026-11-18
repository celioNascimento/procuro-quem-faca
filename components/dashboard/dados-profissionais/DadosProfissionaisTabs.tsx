// components/dashboard/dados-profissionais/DadosProfissionaisTabs.tsx
// Casca da aba "Dados Profissionais": barra de evolução + duas abas (Meu perfil | CNPJ).
// O formulário de perfil continua o mesmo (EditarPerfilTab), sem alteração.
'use client'

import { useRef, useState, type KeyboardEvent } from 'react'
import { BadgeCheck, UserCircle2 } from 'lucide-react'
import EditarPerfilTab from '@/components/dashboard/EditarPerfilTab'
import { BarraEvolucao } from './BarraEvolucao'
import { AbaCnpj } from './AbaCnpj'
import { useSeloCnpj } from '@/hooks/useSeloCnpj'
import { useExtrasEvolucao } from '@/hooks/useExtrasEvolucao'
import { montarConquistas } from '@/lib/selos/evolucao'

export type SubAbaDados = 'perfil' | 'cnpj'

const SUB_ABAS = [
  { id: 'perfil', label: 'Meu perfil', icon: UserCircle2 },
  { id: 'cnpj', label: 'CNPJ', icon: BadgeCheck },
] as const

interface Props {
  prestadorId: number | null
  subAbaInicial?: SubAbaDados
}

export default function DadosProfissionaisTabs({ prestadorId, subAbaInicial = 'perfil' }: Props) {
  const [subAba, setSubAba] = useState<SubAbaDados>(subAbaInicial)
  const botoes = useRef<Record<string, HTMLButtonElement | null>>({})
  const selo = useSeloCnpj(prestadorId)
  const extras = useExtrasEvolucao(prestadorId, selo.fase)
  const conquistas = montarConquistas(selo.fase, extras)

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
    <div className="flex flex-col gap-6">
      <BarraEvolucao conquistas={conquistas} nivel={extras?.nivel ?? null} />

      <div role="tablist" aria-label="Seções de dados profissionais" className="flex w-full gap-1 rounded-2xl bg-slate-100 p-1 sm:w-fit">
        {SUB_ABAS.map(({ id, label, icon: Icone }) => {
          const ativa = subAba === id
          return (
            <button
              key={id}
              ref={(el) => {
                botoes.current[id] = el
              }}
              id={`dados-tab-${id}`}
              type="button"
              role="tab"
              aria-selected={ativa}
              aria-controls={`dados-painel-${id}`}
              tabIndex={ativa ? 0 : -1}
              onClick={() => setSubAba(id)}
              onKeyDown={aoTeclar}
              className={`flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl px-5 py-2 text-xs font-black uppercase tracking-widest transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-100 sm:flex-none ${
                ativa ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-blue-600'
              }`}
            >
              <Icone size={14} aria-hidden="true" />
              {label}
            </button>
          )
        })}
      </div>

      <div role="tabpanel" id={`dados-painel-${subAba}`} aria-labelledby={`dados-tab-${subAba}`}>
        {subAba === 'perfil' ? <EditarPerfilTab /> : <AbaCnpj selo={selo} temPerfil={prestadorId !== null} />}
      </div>
    </div>
  )
}
