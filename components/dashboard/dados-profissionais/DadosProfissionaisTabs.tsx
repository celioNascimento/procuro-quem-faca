// components/dashboard/dados-profissionais/DadosProfissionaisTabs.tsx
// Casca da aba "Dados Profissionais": barra de evolução + duas abas (Meu perfil | CNPJ).
// O formulário de perfil continua o mesmo (EditarPerfilTab), sem alteração.
'use client'

import { useRef, useState, type KeyboardEvent } from 'react'
import { BadgeCheck, FileCheck2, ShieldCheck, UserCircle2 } from 'lucide-react'
import EditarPerfilTab from '@/components/dashboard/EditarPerfilTab'
import { BarraEvolucao } from './BarraEvolucao'
import { AbaCnpj } from './AbaCnpj'
import { AbaDocumento } from './AbaDocumento'
import { useDocumentoVerificacao } from '@/hooks/useDocumentoVerificacao'
import { useSeloCnpj } from '@/hooks/useSeloCnpj'
import { useExtrasEvolucao } from '@/hooks/useExtrasEvolucao'
import { montarConquistas } from '@/lib/selos/evolucao'
import { ContextualHelp } from '@/components/help/HelpCenter'
import { ajudaDaAba } from '@/lib/help/ajuda-do-painel'

export type SubAbaDados = 'perfil' | 'cnpj' | 'seguro' | 'cnd'

const SUB_ABAS = [
  { id: 'perfil', label: 'Meu perfil', icon: UserCircle2 },
  { id: 'cnpj', label: 'CNPJ', icon: BadgeCheck },
  { id: 'seguro', label: 'Seguro', icon: ShieldCheck },
  { id: 'cnd', label: 'CND', icon: FileCheck2 },
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
  const seguro = useDocumentoVerificacao(prestadorId, 'seguro')
  const cnd = useDocumentoVerificacao(prestadorId, 'cnd')
  const conquistas = montarConquistas(selo.fase, extras, { seguro: seguro.fase, cnd: cnd.fase })
  const nivel = extras?.nivel ?? null

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

      <div role="tablist" aria-label="Seções de dados profissionais" className="flex w-full gap-1 overflow-x-auto rounded-2xl bg-slate-100 p-1 sm:w-fit">
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
              className={`flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2 text-xs font-black uppercase tracking-widest transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-100 sm:flex-none ${
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
        {subAba === 'perfil' && <EditarPerfilTab />}
        {subAba === 'cnpj' && <AbaCnpj selo={selo} temPerfil={prestadorId !== null} />}
        {subAba === 'seguro' && (
          <AbaDocumento tipo="seguro" doc={seguro} temPerfil={prestadorId !== null} nivelAnteriorOk={['prata', 'ouro', 'diamante'].includes(nivel ?? '')} />
        )}
        {subAba === 'cnd' && (
          <AbaDocumento tipo="cnd" doc={cnd} temPerfil={prestadorId !== null} nivelAnteriorOk={['ouro', 'diamante'].includes(nivel ?? '')} />
        )}
      </div>

      {/* A ajuda acompanha a sub-aba: em CNPJ só fala de CNPJ e selos. */}
      <ContextualHelp audience="prestador" {...ajudaDaAba('perfil', subAba)} />
    </div>
  )
}
