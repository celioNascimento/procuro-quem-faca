// app/(admin)/admin/logs/page.tsx

'use client'

import { AlertTriangle, Download, FileText, MessageCircle, RefreshCw, Search, User } from 'lucide-react'
import { useAdminLogs } from '@/hooks/useAdminLogs'
import type { LogAtividade } from '@/lib/services/adminLogs.service'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell
} from 'recharts'
import { Button, Card, EmptyState, Field, Input, PageHeader, Segmented, Select } from '@/components/admin/ui'

export default function AdminLogs() {
  const {
    refreshing, logsFiltrados, dadosGrafico,
    busca, setBusca, dataInicio, setDataInicio, tipoFiltro, setTipoFiltro,
    periodoGrafico, setPeriodoGrafico,
    carregarLogs, exportarCSV, resetarFiltros,
  } = useAdminLogs()

  const renderDetalhes = (log: LogAtividade) => {
    const d = log.detalhes || {}
    switch (log.acao) {
      case 'BUSCA_SEM_SUCESSO': return <span className="font-medium text-amber-700">&quot;{String(d.termo ?? '')}&quot;</span>
      case 'CLIQUE_PERFIL': return <span className="font-medium text-pqf-blue">{String(d.nome ?? '')}</span>
      case 'DENUNCIA_PERFIL': return <span className="font-medium text-red-700">{typeof d.motivo === 'string' ? d.motivo.substring(0, 30) : ''}</span>
      case 'CLIQUE_WHATSAPP_ORCAMENTO': return <span className="font-medium text-emerald-700">{String(d.nome_prestador ?? 'Prestador')}</span>
      default: return <span className="text-xs text-pqf-muted">Evento de sistema</span>
    }
  }

  const iconeDoLog = (acao: string) => {
    if (acao.includes('BUSCA')) return <Search size={16} className="text-amber-600" aria-hidden="true" />
    if (acao.includes('DENUNCIA')) return <AlertTriangle size={16} className="text-red-600" aria-hidden="true" />
    if (acao === 'CLIQUE_WHATSAPP_ORCAMENTO') return <MessageCircle size={16} className="text-emerald-600" aria-hidden="true" />
    if (acao === 'CLIQUE_PERFIL') return <User size={16} className="text-pqf-blue" aria-hidden="true" />
    return <FileText size={16} className="text-pqf-muted" aria-hidden="true" />
  }

  const temFiltro = Boolean(busca || dataInicio || tipoFiltro !== 'TODOS')

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 px-4 pb-20 md:px-6">
      <PageHeader
        titulo="Logs e analytics"
        descricao="Atividade registrada na plataforma: buscas, cliques e denúncias."
        acoes={
          <Button
            variante="secundario"
            onClick={carregarLogs}
            disabled={refreshing}
            icone={<RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} aria-hidden="true" />}
          >
            Atualizar
          </Button>
        }
      />

      <Card>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Field label="Busca por e-mail ou termo">
            <Input type="text" placeholder="Filtrar registros" value={busca} onChange={(e) => setBusca(e.target.value)} />
          </Field>
          <Field label="Data do log">
            <Input type="date" value={dataInicio} onChange={(e) => setDataInicio(e.target.value)} />
          </Field>
          <Field label="Tipo de evento">
            <Select value={tipoFiltro} onChange={(e) => setTipoFiltro(e.target.value)}>
              <option value="TODOS">Todos os eventos</option>
              <option value="ACESSO_SITE">Acessos ao site</option>
              <option value="BUSCA_SEM_SUCESSO">Buscas vazias</option>
              <option value="DENUNCIA_PERFIL">Denúncias</option>
              <option value="CLIQUE_PERFIL">Cliques em perfis</option>
              <option value="CLIQUE_WHATSAPP_ORCAMENTO">Cliques no WhatsApp</option>
            </Select>
          </Field>
        </div>
      </Card>

      <Card
        titulo="Atividade por período"
        acoes={
          <Segmented
            label="Período do gráfico"
            valor={periodoGrafico}
            onChange={(p) => setPeriodoGrafico(p as 'DIA' | 'MES')}
            opcoes={[{ valor: 'DIA', rotulo: 'Dia' }, { valor: 'MES', rotulo: 'Mês' }]}
          />
        }
      >
        <div className="h-[250px] w-full">
          <ResponsiveContainer width="100%" height="100%" minWidth={250} minHeight={250} initialDimension={{ width: 600, height: 250 }}>
            <BarChart data={dadosGrafico}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} dy={10} />
              <YAxis hide />
              <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '12px' }} />
              <Bar dataKey="total" radius={[6, 6, 0, 0]} barSize={30}>
                {dadosGrafico.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.buscas > 0 ? '#f59e0b' : '#1a5cc8'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <p className="mt-2 text-xs text-pqf-muted">Barras em âmbar indicam dias com buscas sem resultado.</p>
      </Card>

      <Card
        titulo={`Linha do tempo (${logsFiltrados.length})`}
        acoes={
          <div className="flex items-center gap-2">
            {temFiltro && (
              <Button variante="fantasma" onClick={resetarFiltros}>Limpar filtros</Button>
            )}
            <Button variante="secundario" onClick={exportarCSV} icone={<Download size={16} aria-hidden="true" />}>
              Exportar CSV
            </Button>
          </div>
        }
      >
        {logsFiltrados.length === 0 ? (
          <EmptyState titulo="Nenhum registro" descricao={temFiltro ? 'Nenhum log corresponde aos filtros.' : 'Ainda não há logs.'} />
        ) : (
          <ul className="max-h-[600px] divide-y divide-slate-100 overflow-y-auto">
            {logsFiltrados.map((log) => (
              <li key={log.id} className="flex items-center gap-4 py-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-50">
                  {iconeDoLog(log.acao)}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-pqf-ink">{log.acao.replace(/_/g, ' ')}</p>
                    <span className="max-w-[180px] truncate text-xs text-pqf-muted">{log.usuario_email || 'Visitante anônimo'}</span>
                  </div>
                  <div className="mt-0.5 text-sm">{renderDetalhes(log)}</div>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-sm tabular-nums text-pqf-ink">{new Date(log.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</p>
                  <p className="text-xs text-pqf-muted">{new Date(log.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  )
}
