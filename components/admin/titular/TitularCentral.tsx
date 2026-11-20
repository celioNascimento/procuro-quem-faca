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
import { Badge, Button, EmptyState, Field, PageHeader, Segmented, Textarea } from '@/components/admin/ui'

const ROTULO_STATUS: Record<string, string> = {
  recebida: 'Nova',
  em_analise: 'Em análise',
  atendida: 'Atendida',
  negada: 'Negada',
}

function Prazo({ pedido }: { pedido: PedidoAdmin }) {
  const situacao = situacaoPrazo(pedido.prazo_resposta, pedido.status)
  if (situacao.tipo === 'encerrada') {
    return <Badge>Encerrada</Badge>
  }
  const texto =
    situacao.tipo === 'atrasada' ? `Atrasada ${situacao.dias} dia${situacao.dias > 1 ? 's' : ''}`
    : situacao.tipo === 'hoje' ? 'Vence hoje'
    : `Faltam ${situacao.dias} dia${situacao.dias > 1 ? 's' : ''}`
  const tom = situacao.tipo === 'atrasada' ? 'perigo' : situacao.tipo === 'hoje' ? 'alerta' : 'neutro'
  return <Badge tom={tom}>{texto} · até {formatarDataPrazo(pedido.prazo_resposta)}</Badge>
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
    <article className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
      <header className="flex flex-wrap items-center gap-2">
        <Badge tom="marca">{ROTULO_TIPO_PEDIDO[pedido.tipo] ?? pedido.tipo}</Badge>
        <Badge>{ROTULO_STATUS[pedido.status] ?? pedido.status}</Badge>
        <Prazo pedido={pedido} />
        <span className="ml-auto font-mono text-xs text-slate-400">#{pedido.id.slice(0, 8).toUpperCase()}</span>
      </header>

      <div className="space-y-1 text-sm text-slate-700">
        <p><strong className="text-pqf-ink">{pedido.nome_solicitante || 'Sem nome informado'}</strong></p>
        <p>
          Contato:{' '}
          {contato
            ? <a href={contato} target="_blank" rel="noreferrer" className="font-semibold text-pqf-blue underline">{pedido.contato}</a>
            : pedido.contato}
        </p>
        {perfil && (
          <p>
            Perfil: <strong>{perfil.nome}</strong>
            {perfil.user_id ? ' (já tem conta)' : perfil.whatsapp ? '' : ' (sem WhatsApp)'}
          </p>
        )}
        {!perfil && pedido.prestador_id === null && pedido.tipo === 'exclusao' && (
          <p className="text-xs text-pqf-muted">Sem perfil ligado, ou o perfil já foi excluído.</p>
        )}
        {pedido.descricao && <p className="whitespace-pre-wrap rounded-lg bg-slate-50 p-3 text-sm text-slate-600">{pedido.descricao}</p>}
        <p className="text-xs text-pqf-muted">Recebido em {new Date(pedido.created_at).toLocaleDateString('pt-BR')}</p>
      </div>

      {aberto && (
        <div className="space-y-2 border-t border-slate-100 pt-3">
          {podeEnviarLink && (
            <Button variante="primario" disabled={processando} onClick={onEnviarLink} className="w-full justify-center">
              Enviar link ao WhatsApp do perfil
            </Button>
          )}
          {pedido.status === 'recebida' && (
            <Button disabled={processando} onClick={onEmAnalise} className="w-full justify-center">
              Marcar em análise
            </Button>
          )}
          <Field label="Resposta registrada">
            <Textarea
              value={resposta}
              onChange={e => setResposta(e.target.value)}
              rows={2}
              placeholder="O que foi respondido ao titular..."
            />
          </Field>
          <div className="flex gap-2">
            <Button variante="primario" disabled={processando} onClick={() => onConcluir('atendida', resposta)} className="flex-1 justify-center">
              Marcar como atendida
            </Button>
            <Button
              disabled={processando || resposta.trim().length === 0}
              onClick={() => onConcluir('negada', resposta)}
              title="Para negar, registre o motivo na resposta"
            >
              Negar
            </Button>
          </div>
        </div>
      )}

      {!aberto && pedido.resposta && (
        <p className="whitespace-pre-wrap rounded-lg bg-slate-50 p-3 text-sm text-slate-600">
          <strong className="text-pqf-ink">Resposta:</strong> {pedido.resposta}
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
        <div className="size-5 animate-spin rounded-full border-2 border-pqf-blue border-t-transparent" />
      </div>
    )
  }

  type Filtro = 'abertas' | 'todas'
  return (
    <div className="mx-auto w-full max-w-4xl space-y-6 px-4 pb-20 md:px-6">
      <PageHeader
        titulo="Pedidos do titular"
        descricao="Responda em até 15 dias. O link pessoal vai sempre ao WhatsApp cadastrado no perfil."
        acoes={
          <Segmented<Filtro>
            label="Filtrar pedidos"
            valor={filtro as Filtro}
            onChange={setFiltro}
            opcoes={[{ valor: 'abertas', rotulo: 'Em aberto' }, { valor: 'todas', rotulo: `Todas (${total})` }]}
          />
        }
      />

      {erro && (
        <p role="alert" className="rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{erro}</p>
      )}

      {lista.length === 0 ? (
        <EmptyState titulo={filtro === 'abertas' ? 'Nenhum pedido em aberto' : 'Nenhum pedido registrado ainda'} />
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
