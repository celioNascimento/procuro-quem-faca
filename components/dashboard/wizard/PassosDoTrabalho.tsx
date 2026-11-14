// components/dashboard/wizard/PassosDoTrabalho.tsx
//
// Indicador de passos da tela de novo trabalho + a frase "o que fazer agora". Mostra sempre em que
// passo a pessoa está, para ela nunca ficar parada sem saber o que falta.
import { Check } from 'lucide-react'
import type { PassoDoTrabalho } from '@/lib/trabalho/passos'

interface Props {
  passos: PassoDoTrabalho[]
  proximaAcao: string
}

export function PassosDoTrabalho({ passos, proximaAcao }: Props) {
  const atual = passos.findIndex((p) => p.estado === 'atual')
  return (
    <section aria-label="Passos do trabalho" className="flex flex-col gap-3 lg:flex-row lg:items-center lg:gap-6">
      <ol className="flex items-start gap-1 lg:w-[34rem] lg:shrink-0">
        {passos.map((passo, indice) => (
          <li
            key={passo.id}
            aria-current={passo.estado === 'atual' ? 'step' : undefined}
            className="flex min-w-0 flex-1 flex-col items-center gap-1 text-center"
          >
            <span
              className={`flex size-8 items-center justify-center rounded-full text-sm font-black ${
                passo.estado === 'feito'
                  ? 'bg-emerald-100 text-emerald-700'
                  : passo.estado === 'atual'
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-200'
                    : 'bg-slate-100 text-slate-400'
              }`}
            >
              {passo.estado === 'feito' ? <Check size={16} strokeWidth={3} aria-hidden="true" /> : indice + 1}
            </span>
            <span className={`text-[0.6875rem] font-semibold leading-tight [overflow-wrap:anywhere] sm:text-xs ${passo.estado === 'atual' ? 'text-blue-700' : passo.estado === 'feito' ? 'text-slate-600' : 'text-slate-400'}`}>
              {passo.rotulo}
              <span className="sr-only">{passo.estado === 'feito' ? ' (feito)' : passo.estado === 'atual' ? ' (passo atual)' : ' (ainda não)'}</span>
            </span>
          </li>
        ))}
      </ol>
      <p role="status" aria-label="O que fazer agora" className="rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-900 lg:flex-1">
        <span className="font-black">{atual >= 0 ? `Agora: ` : ''}</span>{proximaAcao}
      </p>
    </section>
  )
}
