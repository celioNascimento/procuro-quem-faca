import Link from 'next/link'
import { Card } from '@/components/admin/ui'
import { META_CONTAS, META_TRABALHOS_NO_FEED, progressoDaMeta, type MetasDoMes as Metas } from '@/lib/admin/metas'

function Linha({ rotulo, valor, meta, href }: { rotulo: string; valor: number; meta: number; href: string }) {
  const { pct, cumprida } = progressoDaMeta(valor, meta)
  return (
    <li>
      <div className="flex items-baseline justify-between gap-3">
        <Link href={href} className="text-sm font-medium text-pqf-ink hover:text-pqf-blue">{rotulo}</Link>
        <p className="text-sm tabular-nums text-pqf-muted">
          <strong className="font-semibold text-pqf-ink">{valor}</strong> de {meta}
          {cumprida && <span className="ml-2 font-semibold text-emerald-700">Meta batida</span>}
        </p>
      </div>
      <div
        className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100"
        role="progressbar" aria-label={rotulo} aria-valuemin={0} aria-valuemax={meta} aria-valuenow={Math.min(valor, meta)}
      >
        <div className={`h-full rounded-full transition-all ${cumprida ? 'bg-emerald-500' : 'bg-pqf-blue'}`} style={{ width: `${pct}%` }} />
      </div>
    </li>
  )
}

// O que o plano de 30 dias quer alcançar neste mês, em números que se acompanham de relance.
export function MetasDoMes({ metas }: { metas: Metas }) {
  return (
    <Card titulo="Metas do mês" descricao="Plano de divulgação de 30 dias. Convites de hoje ficam na tela Convites.">
      <ul className="space-y-5">
        <Linha rotulo="Profissionais com conta" valor={metas.contas} meta={META_CONTAS} href="/admin/prestadores" />
        <Linha rotulo="Trabalhos aceitos no feed" valor={metas.trabalhosNoFeed} meta={META_TRABALHOS_NO_FEED} href="/admin/prestadores" />
      </ul>
    </Card>
  )
}
