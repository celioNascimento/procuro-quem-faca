// components/dashboard/AvisoGarantiaPrestador.tsx
//
// Aviso no topo de "Meus Trabalhos": quantos casos de garantia/reclamação esperam a resposta do
// prestador e até quando. Só aparece quando há caso 'aberta'. Toque abre o caso mais urgente.
// (Aviso dentro do app — não há e-mail; ver lib/garantia/avisos.ts.)

import { ArrowRight, ShieldAlert } from 'lucide-react'
import type { Projeto } from '@/hooks/usePortfolioDashboard'
import { fraseDoPrazo, pedeRespostaDoPrestador } from '@/lib/garantia/avisos'

interface Props {
  projetos: Projeto[]
  onAbrir: (projeto: Projeto) => void
  hoje?: string
}

export function AvisoGarantiaPrestador({ projetos, onAbrir, hoje }: Props) {
  const esperando = projetos
    .map((projeto) => ({ projeto, caso: (projeto.solicitacoes_garantia ?? []).find(pedeRespostaDoPrestador) }))
    .filter((x): x is { projeto: Projeto; caso: NonNullable<typeof x.caso> } => !!x.caso)
    // o que vence primeiro vem primeiro; sem prazo vai para o fim
    .sort((a, b) => (a.caso.prazo_resposta ?? '9999').localeCompare(b.caso.prazo_resposta ?? '9999'))

  if (esperando.length === 0) return null

  const primeiro = esperando[0]
  const total = esperando.length
  const prazo = fraseDoPrazo(primeiro.caso.prazo_resposta, hoje)
  const reclamacao = esperando.every((x) => x.caso.tipo === 'reclamacao')
  const palavra = reclamacao ? (total === 1 ? 'reclamação' : 'reclamações') : total === 1 ? 'caso de garantia' : 'casos de garantia'

  return (
    <button
      type="button"
      onClick={() => onAbrir(primeiro.projeto)}
      className="group flex min-h-16 w-full items-center gap-3 rounded-2xl border border-orange-200 bg-orange-50 p-4 text-left transition-colors hover:bg-orange-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-600"
    >
      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-orange-700 text-white">
        <ShieldAlert size={20} aria-hidden="true" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-base font-bold leading-tight text-orange-950">
          {total === 1 ? `1 ${palavra} esperando sua resposta` : `${total} ${palavra} esperando sua resposta`}
        </span>
        <span className="mt-1 block text-sm font-medium text-orange-900">
          {prazo ? `${prazo.charAt(0).toUpperCase()}${prazo.slice(1)}. ` : ''}Toque para responder.
        </span>
      </span>
      <ArrowRight size={20} aria-hidden="true" className="shrink-0 text-orange-700 transition-transform group-hover:translate-x-1" />
    </button>
  )
}
