// components/dashboard/ResumoDesempenhoStrip.tsx
//
// Faixa compacta no topo do dashboard do prestador: visitas e contatos pelo WhatsApp dos
// últimos 7 dias, com atalho para a aba "Desempenho". Mantém o sinal de valor da plataforma
// visível sem ocupar a primeira dobra com os cards completos.

'use client'

import { ChevronRight, Eye, MessageCircle } from 'lucide-react'
import { useMeusCliques } from '@/hooks/useMeusCliques'
import { useMinhasVisitas } from '@/hooks/useMinhasVisitas'

interface ResumoDesempenhoStripProps {
  onAbrir: () => void
}

export function ResumoDesempenhoStrip({ onAbrir }: ResumoDesempenhoStripProps) {
  const visitas = useMinhasVisitas()
  const cliques = useMeusCliques()

  // Mesma regra do card de visitas: sem perfil de prestador vinculado, não há o que mostrar.
  if (!visitas.carregando && !visitas.erro && !visitas.dados) return null

  const carregando = visitas.carregando || cliques.carregando
  const visitas7d = !visitas.erro && visitas.dados ? visitas.dados.visitas7d : null
  const contatos7d =
    !cliques.erro && cliques.dados && cliques.dados.rastreando ? cliques.dados.ultimos7 : null

  // Para quem acabou de entrar, "0 visitas, 0 contatos" só desanima: a faixa espera ter o que mostrar.
  if (!carregando && (visitas7d ?? 0) === 0 && (contatos7d ?? 0) === 0) return null

  const textoValor = (valor: number | null) => (carregando || valor === null ? '—' : String(valor))
  const rotuloAcessivel = carregando
    ? 'Ver desempenho completo'
    : `Ver desempenho completo: ${visitas7d ?? 'sem dado de'} visitas e ${contatos7d ?? 'sem dado de'} contatos pelo WhatsApp nos últimos 7 dias`

  return (
    <button
      type="button"
      onClick={onAbrir}
      aria-label={rotuloAcessivel}
      className="group flex min-h-11 w-full items-center justify-between gap-3 rounded-2xl border border-slate-100 bg-white px-4 py-3 text-left transition-colors hover:border-blue-200 hover:bg-blue-50/40 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-100"
    >
      <span className="flex min-w-0 flex-wrap items-center gap-x-5 gap-y-1">
        <span className="text-xs font-bold text-slate-500">Últimos 7 dias</span>
        <span className="flex items-center gap-1.5">
          <Eye className="size-4 text-blue-600" aria-hidden="true" />
          <span className="text-base font-black leading-none text-slate-900 tabular-nums">{textoValor(visitas7d)}</span>
          <span className="text-xs font-bold text-slate-600">Visitas</span>
        </span>
        <span className="flex items-center gap-1.5">
          <MessageCircle className="size-4 text-emerald-600" aria-hidden="true" />
          <span className="text-base font-black leading-none text-slate-900 tabular-nums">{textoValor(contatos7d)}</span>
          <span className="text-xs font-bold text-slate-600">Contatos</span>
        </span>
      </span>
      <span className="flex shrink-0 items-center gap-1 text-sm font-bold text-blue-600">
        <span className="hidden sm:inline">Ver desempenho</span>
        <ChevronRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
      </span>
    </button>
  )
}
