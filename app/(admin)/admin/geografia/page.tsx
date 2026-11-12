//app/(admin)/admin/geografia/page.tsx

'use client'

import { useGeografia } from './hooks/useGeografia'
import { FormEstado } from './components/FormEstado'
import { FormRegiao } from './components/FormRegiao'
import { FormCidade } from './components/FormCidade'
import { TabelaCidades } from './components/TabelaCidades'
import { PageHeader, StatCard } from '@/components/admin/ui'

export default function SuperGestaoGeografia() {
  const { estados, regioes, cidades, loading, error, addEstado, addRegiao, addCidade, atualizarRegiaoCidade } = useGeografia()

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 px-4 pb-20 md:px-6">
      <PageHeader
        titulo="Geografia"
        descricao="Estados, regiões e municípios atendidos pela plataforma."
        acoes={<StatCard label="Municípios ativos" valor={cidades.length} />}
      />

      {error && (
        <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          Erro ao carregar dados: {error}
        </div>
      )}

      {loading && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-64 animate-pulse rounded-xl border border-slate-200 bg-white p-6">
              <div className="mb-6 h-2 w-1/3 rounded bg-slate-100" />
              <div className="space-y-4">
                <div className="h-11 rounded-lg bg-slate-50" />
                <div className="h-11 rounded-lg bg-slate-50" />
                <div className="h-11 rounded-lg bg-slate-100" />
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <FormEstado onSubmit={addEstado} />
          <FormRegiao estados={estados} onSubmit={addRegiao} />
          <FormCidade estados={estados} regioes={regioes} onSubmit={addCidade} />
        </div>
      )}

      {!loading && (
        <TabelaCidades cidades={cidades} regioes={regioes} onAtualizarRegiao={atualizarRegiaoCidade} total={cidades.length} />
      )}
    </div>
  )
}
