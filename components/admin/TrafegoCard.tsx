// components/admin/TrafegoCard.tsx
// "Tráfego: o que é real". Só exibe; a leitura vem de lib/admin/trafego.ts.
import { AlertTriangle } from 'lucide-react'
import type { LeituraTrafego, ResumoTrafego } from '@/lib/admin/trafego'

interface Props {
  dias: 7 | 30
  onDias: (d: 7 | 30) => void
  resumo: ResumoTrafego
  leitura: LeituraTrafego
  carregando: boolean
  erro: string | null
}

function Linha({ rotulo, valor, nota }: { rotulo: string; valor: number; nota?: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-slate-100 py-2 last:border-0">
      <div className="min-w-0">
        <p className="text-sm font-semibold text-slate-700">{rotulo}</p>
        {nota && <p className="text-xs text-slate-500">{nota}</p>}
      </div>
      <p className="shrink-0 text-lg font-black text-slate-900">{valor}</p>
    </div>
  )
}

export function TrafegoCard({ dias, onDias, resumo, leitura, carregando, erro }: Props) {
  return (
    <section className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm sm:p-6" data-testid="trafego-card">
      <header className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-sm font-black uppercase tracking-widest text-slate-800">Tráfego: o que é real</h2>
          <p className="text-xs text-slate-500">Separa equipe, anônimos e sinais de robô, nos últimos {dias} dias.</p>
        </div>
        <div className="flex gap-1 rounded-xl bg-slate-100 p-1">
          {([7, 30] as const).map((d) => (
            <button key={d} type="button" aria-pressed={dias === d} onClick={() => onDias(d)}
              className={`min-h-9 rounded-lg px-3 text-xs font-black ${dias === d ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}>
              {d} dias
            </button>
          ))}
        </div>
      </header>

      {erro && <p role="alert" className="mb-3 rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-700">{erro}</p>}

      {carregando ? (
        <div className="h-32 animate-pulse rounded-xl bg-slate-100" />
      ) : (
        <>
          {leitura.alertas.length > 0 && (
            <ul className="mb-4 space-y-2" data-testid="trafego-alertas">
              {leitura.alertas.map((a) => (
                <li key={a} className="flex items-start gap-2 rounded-xl bg-amber-50 p-3 text-sm font-semibold text-amber-900">
                  <AlertTriangle size={16} className="mt-0.5 shrink-0" aria-hidden="true" /> {a}
                </li>
              ))}
            </ul>
          )}
          <Linha rotulo="Visitas a perfis confiáveis" valor={leitura.visitasConfiaveis} nota="Gravadas pelo servidor, sem robôs, uma por sessão e dia." />
          <Linha rotulo="Buscas feitas por outras pessoas" valor={leitura.buscasDeFora} nota={`Total ${resumo.buscas.total}; ${resumo.buscas.equipe} são da equipe. Ainda inclui testes de conhecidos.`} />
          <Linha rotulo="Visitas vindas da busca (sem a equipe)" valor={leitura.visitasDeFora} nota="Gravadas pelo navegador: podem incluir robôs antigos." />
        </>
      )}
    </section>
  )
}
