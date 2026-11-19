// components/dashboard/divulgacao/FeedDeTrabalhosPanel.tsx
// Divulgação > Feed de trabalhos: o prestador escolhe quais trabalhos concluídos aparecem no feed.
// Só entra aqui o trabalho concluído, aceito pelo cliente com o aviso do feed e não retirado por ele.
'use client'
import { Loader2 } from 'lucide-react'
import { usePortfolioDashboard } from '@/hooks/usePortfolioDashboard'
import { estadoNoFeed } from '@/lib/feed/feed'
import { FeedSwitch } from '../FeedSwitch'

export function FeedDeTrabalhosPanel() {
  const { projetos, loading, erro, erroFeed, alternarFeed } = usePortfolioDashboard()

  if (loading) {
    return (
      <div className="flex min-h-40 items-center justify-center" role="status">
        <Loader2 className="size-7 animate-spin text-blue-600" aria-hidden="true" />
        <span className="sr-only">Carregando seus trabalhos</span>
      </div>
    )
  }
  if (erro) {
    return <p role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-800">Não conseguimos carregar seus trabalhos agora. Eles continuam salvos: atualize a página e tente de novo.</p>
  }

  const elegiveis = projetos.map(p => ({ p, estado: estadoNoFeed(p) })).filter(x => x.estado !== null)

  return (
    <section aria-label="Feed de trabalhos" className="flex flex-col gap-4" data-testid="divulgacao-feed">
      <p className="max-w-2xl text-sm text-slate-600">
        No feed, clientes veem seus trabalhos concluídos e chegam ao seu perfil. Escolha abaixo quais aparecem. Desligar não apaga nada: o trabalho continua no seu perfil.
      </p>
      {erroFeed && (
        <p role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-800" data-testid="feed-erro">{erroFeed}</p>
      )}
      {elegiveis.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-slate-200 bg-white p-5 text-sm text-slate-600" data-testid="divulgacao-feed-vazio">
          Nenhum trabalho pronto para o feed ainda. Quando um cliente concluir um trabalho e aceitar que ele seja divulgado, ele aparece aqui.
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {elegiveis.map(({ p, estado }) => (
            <li key={p.id} className="flex min-w-0 flex-col gap-1.5">
              <p className="truncate px-1 text-sm font-black text-slate-800">{p.titulo}</p>
              <FeedSwitch projetoId={p.id} estado={estado!} onAlternar={alternarFeed} />
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
