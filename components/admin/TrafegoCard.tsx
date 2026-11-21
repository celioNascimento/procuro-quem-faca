// components/admin/TrafegoCard.tsx
// "Tráfego: o que é real". Só exibe; a leitura vem de lib/admin/trafego.ts.
import { AlertTriangle } from 'lucide-react'
import type { LeituraTrafego, ResumoTrafego } from '@/lib/admin/trafego'
import { Card, Segmented } from '@/components/admin/ui'

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
        <p className="text-sm font-semibold text-pqf-ink">{rotulo}</p>
        {nota && <p className="text-xs text-pqf-muted">{nota}</p>}
      </div>
      <p className="shrink-0 text-lg font-bold tabular-nums text-pqf-ink">{valor}</p>
    </div>
  )
}

export function TrafegoCard({ dias, onDias, resumo, leitura, carregando, erro }: Props) {
  return (
    <div data-testid="trafego-card">
      <Card
        titulo="Tráfego: o que é real"
        descricao={`Separa equipe, anônimos e sinais de robô, nos últimos ${dias} dias.`}
        acoes={
          <Segmented
            label="Período do tráfego"
            valor={String(dias)}
            onChange={(v) => onDias(Number(v) as 7 | 30)}
            opcoes={[{ valor: '7', rotulo: '7 dias' }, { valor: '30', rotulo: '30 dias' }]}
          />
        }
      >
        {erro && <p role="alert" className="mb-3 rounded-lg bg-red-50 p-3 text-sm font-semibold text-red-700">{erro}</p>}

        {carregando ? (
          <div className="h-32 animate-pulse rounded-lg bg-slate-100" />
        ) : (
          <>
            {leitura.alertas.length > 0 && (
              <ul className="mb-4 space-y-2" data-testid="trafego-alertas">
                {leitura.alertas.map((a) => (
                  <li key={a} className="flex items-start gap-2 rounded-lg bg-amber-50 p-3 text-sm font-semibold text-amber-900">
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
      </Card>
    </div>
  )
}
