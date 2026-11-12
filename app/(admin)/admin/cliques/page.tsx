//app/(admin)/admin/cliques/page.tsx

'use client'

import { useAdminCliques, type PeriodoCliques } from '@/hooks/useAdminCliques'
import { Card, EmptyState, PageHeader, Segmented, StatCard } from '@/components/admin/ui'

const PERIODOS: PeriodoCliques[] = [7, 30, 90]

function formatarDia(dia: string) {
  const [, mes, d] = dia.split('-')
  return `${d}/${mes}`
}

export default function AdminCliquesPage() {
  const { periodo, trocarPeriodo, dados, carregando, erro, recarregar } = useAdminCliques()
  const resumo = dados?.resumo
  const maiorDia = Math.max(1, ...(resumo?.porDia.map((d) => d.total) ?? [1]))

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 px-4 pb-24 md:px-6">
      <PageHeader
        titulo="Cliques no WhatsApp"
        descricao="Quantas pessoas clicaram para falar com um prestador, e por onde chegaram."
        acoes={
          <Segmented
            label="Período"
            valor={String(periodo)}
            onChange={(v) => trocarPeriodo(Number(v) as PeriodoCliques)}
            opcoes={PERIODOS.map((dias) => ({ valor: String(dias), rotulo: `${dias} dias` }))}
          />
        }
      />

      {erro && (
        <div role="alert" className="flex items-center justify-between gap-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <span>{erro}</span>
          <button onClick={recarregar} className="font-semibold underline">Tentar novamente</button>
        </div>
      )}

      {dados && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-900">
          {dados.rastreio.modo === 'amostra' ? (
            <>
              <strong>Rastreio em modo amostra:</strong> só os {dados.rastreio.prestadoresNaAmostra} prestadores
              da amostra têm os cliques contados. Os demais não aparecem aqui, e isso não significa zero
              cliques. Para contar todos, o modo em <code>rastreio_config</code> precisa ser <code>todos</code>.
            </>
          ) : (
            <><strong>Rastreio em modo todos:</strong> os cliques de todos os prestadores são contados.</>
          )}
        </div>
      )}

      {dados?.truncado && (
        <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          Há mais cliques do que a página consegue carregar. Os números abaixo são parciais; use um período menor.
        </div>
      )}

      {carregando && !resumo ? (
        <p className="py-16 text-center text-sm text-pqf-muted" role="status">Carregando…</p>
      ) : resumo ? (
        <>
          <section className="grid grid-cols-3 gap-3">
            <StatCard label="Cliques" valor={resumo.total} />
            <StatCard label="Pessoas diferentes" valor={resumo.sessoesUnicas} tom="marca" />
            <StatCard label="Prestadores" valor={resumo.prestadoresUnicos} />
          </section>

          <Card titulo="Por dia">
            {resumo.total === 0 ? (
              <EmptyState titulo="Nenhum clique no período" />
            ) : (
              <div className="flex h-28 items-end gap-px" role="img" aria-label="Cliques por dia">
                {resumo.porDia.map((d) => (
                  <div
                    key={d.dia}
                    title={`${formatarDia(d.dia)}: ${d.total}`}
                    className="flex-1 rounded-t-sm bg-pqf-blue"
                    style={{ height: `${Math.max(d.total === 0 ? 2 : 8, (d.total / maiorDia) * 100)}%`, opacity: d.total === 0 ? 0.15 : 1 }}
                  />
                ))}
              </div>
            )}
            <div className="mt-2 flex justify-between text-xs text-pqf-muted">
              <span>{resumo.porDia[0] ? formatarDia(resumo.porDia[0].dia) : ''}</span>
              <span>{resumo.porDia.length ? formatarDia(resumo.porDia[resumo.porDia.length - 1].dia) : ''}</span>
            </div>
          </Card>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Card titulo="Origem e campanha">
              {resumo.porOrigem.length === 0 && <EmptyState titulo="Sem dados" />}
              {resumo.porOrigem.map((o) => (
                <div key={`${o.origem}|${o.campanha ?? ''}`} className="flex items-center justify-between border-b border-slate-100 py-2.5 last:border-0">
                  <p className="min-w-0 truncate text-sm font-medium text-pqf-ink">
                    {o.origem}
                    {o.campanha && <span className="font-normal text-pqf-muted"> · {o.campanha}</span>}
                  </p>
                  <span className="ml-3 shrink-0 text-sm tabular-nums text-pqf-muted">{o.total}</span>
                </div>
              ))}
            </Card>

            <Card titulo="Prestadores com mais cliques">
              {resumo.porPrestador.length === 0 && <EmptyState titulo="Sem dados" />}
              {resumo.porPrestador.map((p, i) => (
                <div key={p.prestadorId} className="flex items-center justify-between border-b border-slate-100 py-2.5 last:border-0">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="w-4 text-xs font-semibold tabular-nums text-pqf-muted">{i + 1}</span>
                    <p className="min-w-0 truncate text-sm font-medium text-pqf-ink">
                      {p.nome?.trim() || `Prestador ${p.prestadorId}`}
                    </p>
                  </div>
                  <span className="ml-3 shrink-0 text-sm tabular-nums text-pqf-muted">{p.total}</span>
                </div>
              ))}
            </Card>
          </div>

          <p className="text-xs leading-5 text-pqf-muted">
            Dias no horário de Brasília. “Pessoas diferentes” conta navegadores distintos (cookie de sessão);
            registros históricos importados não entram nessa conta. Cada pessoa conta uma vez a cada 24 horas por perfil.
          </p>
        </>
      ) : null}
    </div>
  )
}
