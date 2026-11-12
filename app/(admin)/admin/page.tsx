'use client'

import Link from 'next/link'
import { AnimatePresence, motion } from 'framer-motion'
import { AlertCircle, ArrowRight, RefreshCw } from 'lucide-react'
import { useAdminDashboard } from '@/hooks/useAdminDashboard'
import { useAdminPendencias } from '@/hooks/admin/useAdminPendencias'
import { Badge, Button, Card, EmptyState, PageHeader, StatCard } from '@/components/admin/ui'

interface ItemAtencao {
  href: string
  label: string
  total: number
  detalhe?: string
  alerta?: boolean
}

export default function AdminDashboard() {
  const { stats, radar, refreshing, notificacao, erro, pctAtivacao, carregarDashboard } = useAdminDashboard()
  const pendencias = useAdminPendencias()

  const naoContatados = Math.max(stats.ativacao.total - stats.ativacao.enviados, 0)
  const maxCategoria = Math.max(1, ...stats.topCategorias.map((c) => c.total))

  const atencao: ItemAtencao[] = [
    {
      href: '/admin/titular',
      label: 'Pedidos LGPD em aberto',
      total: pendencias?.titular_abertas ?? 0,
      detalhe: pendencias?.titular_atrasadas ? `${pendencias.titular_atrasadas} com prazo vencido` : undefined,
      alerta: (pendencias?.titular_atrasadas ?? 0) > 0,
    },
    { href: '/admin/moderacao', label: 'Denúncias abertas', total: pendencias?.denuncias_abertas ?? 0 },
    { href: '/admin/moderacao', label: 'Garantias abertas', total: pendencias?.garantias_abertas ?? 0 },
    { href: '/admin/moderacao', label: 'Contestações abertas', total: pendencias?.contestacoes_abertas ?? 0 },
    { href: '/admin/ativacao', label: 'Prestadores sem contato enviado', total: naoContatados },
  ].filter((i) => i.total > 0)

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 px-4 pb-24 md:px-6">
      <AnimatePresence>
        {notificacao && (
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="fixed left-4 right-4 top-6 z-[300] md:left-1/2 md:right-auto md:w-96 md:-translate-x-1/2"
            role="status"
          >
            <div className="flex items-center gap-3 rounded-xl bg-red-600 px-5 py-3.5 text-white shadow-lg">
              <AlertCircle size={18} aria-hidden="true" />
              <p className="text-sm font-medium">{notificacao}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <PageHeader
        titulo="Visão geral"
        descricao="O que precisa de ação, o andamento da campanha e a atividade da plataforma."
        acoes={
          <Button
            variante="secundario"
            onClick={() => carregarDashboard(true)}
            disabled={refreshing}
            icone={<RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} aria-hidden="true" />}
          >
            Atualizar
          </Button>
        }
      />

      {erro && (
        <div role="alert" className="flex items-center justify-between gap-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <span>{erro}</span>
          <button onClick={() => carregarDashboard(true)} className="font-semibold underline">Tentar novamente</button>
        </div>
      )}

      <Card titulo="Precisa de atenção" descricao="Filas com itens pendentes. Clique para abrir a tela correspondente.">
        {atencao.length === 0 ? (
          <EmptyState titulo="Nada pendente" descricao="Todas as filas estão em dia." />
        ) : (
          <ul className="divide-y divide-slate-100">
            {atencao.map((item) => (
              <li key={item.label}>
                <Link
                  href={item.href}
                  className="group -mx-2 flex items-center justify-between gap-4 rounded-lg px-2 py-3 hover:bg-pqf-blue-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pqf-blue"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-pqf-ink">{item.label}</p>
                    {item.detalhe && <p className="mt-0.5 text-xs text-red-700">{item.detalhe}</p>}
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge tom={item.alerta ? 'perigo' : 'marca'}>{item.total}</Badge>
                    <ArrowRight size={16} className="text-slate-400 group-hover:text-pqf-blue" aria-hidden="true" />
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label="Curadoria" valor={stats.curadoria} hint="perfis em curadoria" href="/admin/prestadores" />
        <StatCard label="Ativos" valor={stats.reivindicados} hint="perfis reivindicados" tom="marca" href="/admin/prestadores" />
        <StatCard label="Orgânicos" valor={stats.registrados} hint="cadastros diretos" href="/admin/prestadores" />
        <StatCard label="Anúncios" valor={stats.anuncios} hint="visíveis no site" href="/admin/anuncios" />
      </section>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card
          titulo="Campanha de ativação"
          descricao={`${pctAtivacao}% dos prestadores já foram contatados`}
          acoes={<Link href="/admin/ativacao" className="text-sm font-semibold text-pqf-blue hover:text-pqf-blue-hover">Abrir</Link>}
        >
          <ol className="space-y-4">
            <Funil rotulo="Total na base" valor={stats.ativacao.total} base={stats.ativacao.total} />
            <Funil rotulo="Contatados" valor={stats.ativacao.enviados} base={stats.ativacao.total} />
            <Funil rotulo="Perfis ativos" valor={stats.ativacao.ativos} base={stats.ativacao.total} />
          </ol>
        </Card>

        <Card titulo="Categorias mais buscadas" descricao="Busca registrada por categoria.">
          {stats.topCategorias.length === 0 ? (
            <EmptyState titulo="Sem dados ainda" descricao="A lista aparece quando houver buscas por categoria." />
          ) : (
            <ol className="space-y-4">
              {stats.topCategorias.map((c, i) => (
                <Funil key={`${c.nome}-${i}`} rotulo={c.nome} valor={c.total} base={maxCategoria} sufixo="buscas" />
              ))}
            </ol>
          )}
        </Card>
      </div>

      <Card
        titulo="Atividade recente"
        acoes={<Link href="/admin/logs" className="text-sm font-semibold text-pqf-blue hover:text-pqf-blue-hover">Ver todos os logs</Link>}
      >
        {radar.length === 0 ? (
          <EmptyState titulo="Nenhum evento recente" />
        ) : (
          <ul className="divide-y divide-slate-100">
            {radar.map((item, i) => (
              <li key={i} className="flex items-center justify-between gap-4 py-3">
                <div className="flex items-center gap-3 min-w-0">
                  <span
                    className={`h-2 w-2 shrink-0 rounded-full ${item.acao === 'CLIQUE_WHATSAPP_ORCAMENTO' ? 'bg-emerald-500' : 'bg-amber-500'}`}
                    aria-hidden="true"
                  />
                  <p className="truncate text-sm font-medium text-pqf-ink">
                    {item.acao === 'CLIQUE_WHATSAPP_ORCAMENTO' ? 'Clique no WhatsApp' : 'Busca sem resultado'}
                  </p>
                </div>
                <p className="shrink-0 text-xs text-pqf-muted">
                  {item.acao === 'BUSCA_SEM_SUCESSO' ? `"${item.detalhes?.termo}"` : `${item.created_at.slice(11, 16)}h`}
                </p>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  )
}

// Linha com rótulo, valor e barra proporcional. Usada no funil e no ranking.
function Funil({ rotulo, valor, base, sufixo }: { rotulo: string; valor: number; base: number; sufixo?: string }) {
  const pct = base > 0 ? Math.round((valor / base) * 100) : 0
  return (
    <li>
      <div className="mb-1.5 flex items-baseline justify-between gap-3">
        <p className="min-w-0 truncate text-sm font-medium text-pqf-ink">{rotulo}</p>
        <p className="shrink-0 text-sm tabular-nums text-pqf-muted">
          {valor}{sufixo ? ` ${sufixo}` : ''}
        </p>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-slate-100" aria-hidden="true">
        <div className="h-full rounded-full bg-pqf-blue" style={{ width: `${pct}%` }} />
      </div>
    </li>
  )
}
