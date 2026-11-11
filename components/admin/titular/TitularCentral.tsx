// components/admin/titular/TitularCentral.tsx
//
// Fila de pedidos do titular de dados. O prazo de resposta é de 15 dias (config/controlador.ts).

'use client'

import { useState } from 'react'
import { useAdminTitular } from '@/hooks/admin/useAdminTitular'
import type { PedidoAdmin } from '@/lib/services/adminTitular.service'
import { ROTULO_TIPO_PEDIDO } from '@/lib/titular/pedido'
import { formatarDataPrazo, situacaoPrazo, statusEstaAberto } from '@/lib/titular/prazo'
import { buildLinkWhatsapp } from '@/lib/utils/whatsapp'

const ROTULO_STATUS: Record<string, string> = {
  recebida: 'Nova',
  em_analise: 'Em análise',
  atendida: 'Atendida',
  negada: 'Negada',
}

function Prazo({ pedido }: { pedido: PedidoAdmin }) {
  const situacao = situacaoPrazo(pedido.prazo_resposta, pedido.status)
  if (situacao.tipo === 'encerrada') {
    return <span className="text-[10px] text-zinc-400">Encerrada</span>
  }
  const texto =
    situacao.tipo === 'atrasada' ? `Atrasada ${situacao.dias} dia${situacao.dias > 1 ? 's' : ''}`
    : situacao.tipo === 'hoje' ? 'Vence hoje'
    : `Faltam ${situacao.dias} dia${situacao.dias > 1 ? 's' : ''}`
  const cor =
    situacao.tipo === 'atrasada' ? 'bg-red-50 text-red-600'
    : situacao.tipo === 'hoje' ? 'bg-amber-50 text-amber-700'
    : 'bg-zinc-100 text-zinc-500'
  return (
    <span className={`rounded px-1.5 py-px text-[10px] font-semibold ${cor}`}>
      {texto} · até {formatarDataPrazo(pedido.prazo_resposta)}
    </span>
  )
}

function linkContato(contato: string): string | undefined {
  return contato.includes('@') ? `mailto:${contato}` : buildLinkWhatsapp(contato)
}

function CartaoPedido({
  pedido, processando, onEmAnalise, onConcluir, onEnviarLink,
}: {
  pedido: PedidoAdmin
  processando: boolean
  onEmAnalise: () => void
  onConcluir: (status: 'atendida' | 'negada', resposta: string) => void
  onEnviarLink: () => void
}) {
  const [resposta, setResposta] = useState(pedido.resposta ?? '')
  const aberto = statusEstaAberto(pedido.status)
  const perfil = pedido.prestadores
  const podeEnviarLink = aberto && Boolean(perfil) && !perfil?.user_id && Boolean(perfil?.whatsapp)
  const contato = linkContato(pedido.contato)

  return (
    <article className="space-y-3 rounded-2xl border border-zinc-100 bg-white p-4">
      <header className="flex flex-wrap items-center gap-2">
        <span className="rounded bg-blue-50 px-1.5 py-px text-[10px] font-semibold uppercase tracking-wide text-blue-600">
          {ROTULO_TIPO_PEDIDO[pedido.tipo] ?? pedido.tipo}
        </span>
        <span className="rounded bg-zinc-100 px-1.5 py-px text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
          {ROTULO_STATUS[pedido.status] ?? pedido.status}
        </span>
        <Prazo pedido={pedido} />
        <span className="ml-auto font-mono text-[10px] text-zinc-300">#{pedido.id.slice(0, 8).toUpperCase()}</span>
      </header>

      <div className="space-y-1 text-[13px] text-zinc-700">
        <p><strong className="text-zinc-900">{pedido.nome_solicitante || 'Sem nome informado'}</strong></p>
        <p>
          Contato:{' '}
          {contato
            ? <a href={contato} target="_blank" rel="noreferrer" className="font-semibold text-blue-600 underline">{pedido.contato}</a>
            : pedido.contato}
        </p>
        {perfil && (
          <p>
            Perfil: <strong>{perfil.nome}</strong>
            {perfil.user_id ? ' (já tem conta)' : perfil.whatsapp ? '' : ' (sem WhatsApp)'}
          </p>
        )}
        {!perfil && pedido.prestador_id === null && pedido.tipo === 'exclusao' && (
          <p className="text-[11px] text-zinc-400">Sem perfil ligado, ou o perfil já foi excluído.</p>
        )}
        {pedido.descricao && <p className="whitespace-pre-wrap rounded-xl bg-zinc-50 p-3 text-[12px] text-zinc-600">{pedido.descricao}</p>}
        <p className="text-[10px] text-zinc-400">Recebido em {new Date(pedido.created_at).toLocaleDateString('pt-BR')}</p>
      </div>

      {aberto && (
        <div className="space-y-2 border-t border-zinc-50 pt-3">
          {podeEnviarLink && (
            <button
              type="button"
              disabled={processando}
              onClick={onEnviarLink}
              className="w-full rounded-xl bg-[#25D366] py-2.5 text-[11px] font-semibold text-white disabled:opacity-40"
            >
              Enviar link ao WhatsApp do perfil
            </button>
          )}
          {pedido.status === 'recebida' && (
            <button
              type="button"
              disabled={processando}
              onClick={onEmAnalise}
              className="w-full rounded-xl border border-zinc-200 bg-zinc-50 py-2 text-[11px] font-semibold text-zinc-600 disabled:opacity-40"
            >
              Marcar em análise
            </button>
          )}
          <label className="block space-y-1">
            <span className="text-[10px] font-semibold uppercase tracking-wide text-zinc-400">Resposta registrada</span>
            <textarea
              value={resposta}
              onChange={e => setResposta(e.target.value)}
              rows={2}
              placeholder="O que foi respondido ao titular..."
              className="w-full resize-none rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs text-zinc-700 focus:border-zinc-400 focus:outline-none"
            />
          </label>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={processando}
              onClick={() => onConcluir('atendida', resposta)}
              className="flex-1 rounded-xl bg-zinc-900 py-2.5 text-[11px] font-semibold text-white disabled:opacity-40"
            >
              Marcar como atendida
            </button>
            <button
              type="button"
              disabled={processando || resposta.trim().length === 0}
              onClick={() => onConcluir('negada', resposta)}
              title="Para negar, registre o motivo na resposta"
              className="rounded-xl border border-zinc-200 px-4 py-2.5 text-[11px] font-semibold text-zinc-500 disabled:opacity-40"
            >
              Negar
            </button>
          </div>
        </div>
      )}

      {!aberto && pedido.resposta && (
        <p className="whitespace-pre-wrap rounded-xl bg-zinc-50 p-3 text-[12px] text-zinc-500">
          <strong className="text-zinc-600">Resposta:</strong> {pedido.resposta}
        </p>
      )}
    </article>
  )
}

export function TitularCentral() {
  const {
    lista, total, carregando, filtro, setFiltro, processandoId, erro,
    marcarEmAnalise, concluir, enviarLinkAoWhatsappDoPerfil,
  } = useAdminTitular()

  if (carregando) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="size-5 animate-spin rounded-full border-2 border-zinc-800 border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl space-y-5 pb-16">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-black text-zinc-900">Pedidos do titular</h1>
          <p className="text-xs text-zinc-400">
            Responda em até 15 dias. O link pessoal vai sempre ao WhatsApp cadastrado no perfil.
          </p>
        </div>
        <div className="flex gap-1 rounded-xl bg-zinc-100 p-1 text-[11px] font-semibold">
          {(['abertas', 'todas'] as const).map(opcao => (
            <button
              key={opcao}
              type="button"
              onClick={() => setFiltro(opcao)}
              className={`rounded-lg px-3 py-1.5 ${filtro === opcao ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-500'}`}
            >
              {opcao === 'abertas' ? 'Em aberto' : `Todas (${total})`}
            </button>
          ))}
        </div>
      </div>

      {erro && (
        <p role="alert" className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-[12px] font-semibold text-red-600">{erro}</p>
      )}

      {lista.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-zinc-200 p-10 text-center text-sm text-zinc-400">
          {filtro === 'abertas' ? 'Nenhum pedido em aberto.' : 'Nenhum pedido registrado ainda.'}
        </p>
      ) : (
        <div className="space-y-3">
          {lista.map(pedido => (
            <CartaoPedido
              key={pedido.id}
              pedido={pedido}
              processando={processandoId === pedido.id}
              onEmAnalise={() => marcarEmAnalise(pedido.id)}
              onConcluir={(status, resposta) => concluir(pedido.id, status, resposta)}
              onEnviarLink={() => enviarLinkAoWhatsappDoPerfil(pedido)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
