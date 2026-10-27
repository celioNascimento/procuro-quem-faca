//app/(admin)/admin/cliques/page.tsx

'use client'
import { useAdminCliques, type PeriodoCliques } from '@/hooks/useAdminCliques'

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
    <div className="max-w-5xl mx-auto pb-24 px-4 md:px-6">
      <header className="flex flex-col gap-4 pt-6 md:pt-10 pb-6 border-b border-zinc-100 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[10px] font-medium text-zinc-400 uppercase tracking-[0.2em] mb-1">Inteligência</p>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-zinc-900 leading-none">
            Cliques no WhatsApp
          </h1>
        </div>
        <div className="flex gap-1.5" role="group" aria-label="Período">
          {PERIODOS.map((dias) => (
            <button
              key={dias}
              type="button"
              onClick={() => trocarPeriodo(dias)}
              aria-pressed={periodo === dias}
              className={`rounded-xl border px-3.5 py-2 text-[11px] font-semibold transition-colors ${
                periodo === dias
                  ? 'border-zinc-900 bg-zinc-900 text-white'
                  : 'border-zinc-200 bg-white text-zinc-500 hover:border-zinc-300'
              }`}
            >
              {dias} dias
            </button>
          ))}
        </div>
      </header>

      {erro && (
        <div role="alert" className="mt-6 flex items-center justify-between gap-4 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-xs text-red-700">
          <span>{erro}</span>
          <button onClick={recarregar} className="font-bold underline">Tentar novamente</button>
        </div>
      )}

      {dados && (
        <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs leading-5 text-amber-900">
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
        <div role="alert" className="mt-3 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-xs text-red-700">
          Há mais cliques do que a página consegue carregar. Os números abaixo são parciais; use um período menor.
        </div>
      )}

      {carregando && !resumo ? (
        <p className="py-16 text-center text-[11px] text-zinc-400" role="status">Carregando…</p>
      ) : resumo ? (
        <>
          <section className="grid grid-cols-3 gap-2 md:gap-3 pt-6">
            <Cartao rotulo="Cliques" valor={resumo.total} />
            <Cartao rotulo="Pessoas diferentes" valor={resumo.sessoesUnicas} destaque />
            <Cartao rotulo="Prestadores" valor={resumo.prestadoresUnicos} />
          </section>

          <section className="mt-4 rounded-2xl border border-zinc-100 bg-white p-5 md:p-6">
            <p className="mb-4 text-[10px] font-medium text-zinc-400 uppercase tracking-widest">Por dia</p>
            {resumo.total === 0 ? (
              <p className="py-6 text-center text-[11px] text-zinc-300">Nenhum clique no período</p>
            ) : (
              <div className="flex h-28 items-end gap-px" role="img" aria-label="Cliques por dia">
                {resumo.porDia.map((d) => (
                  <div
                    key={d.dia}
                    title={`${formatarDia(d.dia)}: ${d.total}`}
                    className="flex-1 rounded-t-sm bg-blue-500/80"
                    style={{ height: `${Math.max(d.total === 0 ? 2 : 8, (d.total / maiorDia) * 100)}%`, opacity: d.total === 0 ? 0.2 : 1 }}
                  />
                ))}
              </div>
            )}
            <div className="mt-2 flex justify-between text-[9px] text-zinc-400">
              <span>{resumo.porDia[0] ? formatarDia(resumo.porDia[0].dia) : ''}</span>
              <span>{resumo.porDia.length ? formatarDia(resumo.porDia[resumo.porDia.length - 1].dia) : ''}</span>
            </div>
          </section>

          <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
            <section className="rounded-2xl border border-zinc-100 bg-white p-5 md:p-6">
              <p className="mb-4 text-[10px] font-medium text-zinc-400 uppercase tracking-widest">Origem e campanha</p>
              {resumo.porOrigem.length === 0 && <p className="py-4 text-center text-[11px] text-zinc-300">Sem dados</p>}
              {resumo.porOrigem.map((o) => (
                <div key={`${o.origem}|${o.campanha ?? ''}`} className="flex items-center justify-between border-b border-zinc-50 py-2.5 last:border-0">
                  <p className="min-w-0 truncate text-[13px] font-semibold text-zinc-800">
                    {o.origem}
                    {o.campanha && <span className="font-normal text-zinc-400"> · {o.campanha}</span>}
                  </p>
                  <span className="ml-3 shrink-0 text-[11px] tabular-nums text-zinc-500">{o.total}</span>
                </div>
              ))}
            </section>

            <section className="rounded-2xl border border-zinc-100 bg-white p-5 md:p-6">
              <p className="mb-4 text-[10px] font-medium text-zinc-400 uppercase tracking-widest">Prestadores com mais cliques</p>
              {resumo.porPrestador.length === 0 && <p className="py-4 text-center text-[11px] text-zinc-300">Sem dados</p>}
              {resumo.porPrestador.map((p, i) => (
                <div key={p.prestadorId} className="flex items-center justify-between border-b border-zinc-50 py-2.5 last:border-0">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="w-4 text-[10px] font-bold tabular-nums text-zinc-300">{i + 1}</span>
                    <p className="min-w-0 truncate text-[13px] font-semibold text-zinc-800">
                      {p.nome?.trim() || `Prestador ${p.prestadorId}`}
                    </p>
                  </div>
                  <span className="ml-3 shrink-0 text-[11px] tabular-nums text-zinc-500">{p.total}</span>
                </div>
              ))}
            </section>
          </div>

          <p className="mt-4 text-[10px] leading-4 text-zinc-400">
            Dias no horário de Brasília. “Pessoas diferentes” conta navegadores distintos (cookie de sessão);
            registros históricos importados não entram nessa conta. Cada pessoa conta uma vez a cada 24 horas por perfil.
          </p>
        </>
      ) : null}
    </div>
  )
}

function Cartao({ rotulo, valor, destaque = false }: { rotulo: string; valor: number; destaque?: boolean }) {
  return (
    <div className={`rounded-2xl border p-4 md:p-5 ${destaque ? 'border-blue-500 bg-blue-600' : 'border-zinc-100 bg-white'}`}>
      <p className={`mb-2 text-[9px] font-medium uppercase tracking-widest ${destaque ? 'text-blue-200' : 'text-zinc-400'}`}>{rotulo}</p>
      <span className={`text-2xl md:text-3xl font-bold leading-none tabular-nums ${destaque ? 'text-white' : 'text-zinc-900'}`}>{valor}</span>
    </div>
  )
}
