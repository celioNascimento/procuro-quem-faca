// app/(admin)/admin/analises/historico/page.tsx
// Quem fez o quê no painel: bloqueios, feed, verificações, convites e equipe.

'use client'

import { RefreshCw } from 'lucide-react'
import { Badge, Button, Card, EmptyState, Field, Select } from '@/components/admin/ui'
import { useAdminAcoes } from '@/hooks/admin/useAdminAcoes'
import { fraseDaAcao, GRUPOS, grupoDaAcao, type GrupoDeAcao } from '@/lib/admin/acoes'
import { LIMITE_ACOES } from '@/lib/services/adminAcoes.service'

const quandoFormatado = (iso: string) =>
  new Date(iso).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })

export default function HistoricoPage() {
  const { visiveis, pessoas, carregando, erro, grupo, setGrupo, quem, setQuem, carregar, truncado } = useAdminAcoes()
  const temFiltro = grupo !== 'todos' || Boolean(quem)

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-pqf-muted">Quem fez o quê no painel. Ninguém consegue editar nem apagar este histórico.</p>
        <Button variante="secundario" onClick={() => void carregar()} disabled={carregando} icone={<RefreshCw size={16} className={carregando ? 'animate-spin' : ''} aria-hidden="true" />}>
          Atualizar
        </Button>
      </div>

      {erro && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{erro}</p>}

      <Card>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Field label="Tipo de ação">
            <Select value={grupo} onChange={(e) => setGrupo(e.target.value as GrupoDeAcao | 'todos')}>
              <option value="todos">Todas</option>
              {GRUPOS.map((g) => <option key={g.valor} value={g.valor}>{g.rotulo}</option>)}
            </Select>
          </Field>
          <Field label="Quem fez">
            <Select value={quem} onChange={(e) => setQuem(e.target.value)}>
              <option value="">Todos</option>
              {pessoas.map((p) => <option key={p} value={p}>{p}</option>)}
            </Select>
          </Field>
        </div>
      </Card>

      <Card titulo={`Ações (${visiveis.length})`}>
        {visiveis.length === 0 ? (
          <EmptyState
            titulo={carregando ? 'Carregando…' : 'Nada por aqui'}
            descricao={temFiltro ? 'Nenhuma ação corresponde aos filtros.' : 'Quando alguém da equipe bloquear, remover do feed ou decidir uma verificação, aparece aqui.'}
          />
        ) : (
          <ul className="divide-y divide-slate-100" data-testid="historico-lista">
            {visiveis.map((a) => (
              <li key={a.id} className="py-3" data-testid="historico-item">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <p className="min-w-0 text-sm font-medium text-pqf-ink">{fraseDaAcao(a)}</p>
                  <Badge tom="neutro">{GRUPOS.find((g) => g.valor === grupoDaAcao(a.acao))?.rotulo ?? 'Outra'}</Badge>
                </div>
                {a.motivo && <p className="mt-0.5 text-sm text-pqf-muted">Motivo: {a.motivo}</p>}
                <p className="mt-0.5 text-xs text-pqf-muted">{quandoFormatado(a.quando)}</p>
              </li>
            ))}
          </ul>
        )}
        {truncado && <p className="mt-3 text-xs text-pqf-muted">Mostrando as {LIMITE_ACOES} ações mais recentes.</p>}
      </Card>
    </div>
  )
}
