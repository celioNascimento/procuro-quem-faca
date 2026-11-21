'use client'

import { useState } from 'react'
import { useAdminFeed } from '@/hooks/admin/useAdminFeed'
import { Badge, Button, Card, EmptyState, Field, PageHeader, Textarea } from '@/components/admin/ui'
import {
  itensVisiveis, podeDevolver, podeRemover, ROTULO_SITUACAO, rotuloDia, totalNoPeriodo,
  type ItemFeedAdmin, type SituacaoFeed,
} from '@/lib/feed/adminFeed'

const TOM: Record<SituacaoFeed, 'sucesso' | 'neutro' | 'alerta' | 'perigo'> = {
  no_ar: 'sucesso',
  aguardando_conclusao: 'neutro',
  oculto_prestador: 'alerta',
  retirado_cliente: 'neutro',
  removido_admin: 'perigo',
}

function Dias({ porDia }: { porDia: { dia: string; total: number }[] }) {
  const maximo = Math.max(1, ...porDia.map((d) => d.total))
  return (
    <ul className="flex h-28 items-end gap-1" aria-label="Trabalhos aceitos por dia">
      {porDia.map((d) => (
        <li key={d.dia} className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-1" title={`${rotuloDia(d.dia)}: ${d.total}`}>
          <span className="text-xs tabular-nums text-pqf-muted">{d.total > 0 ? d.total : ''}</span>
          <div className={d.total > 0 ? 'w-full rounded-t bg-pqf-blue' : 'w-full rounded-t bg-slate-200'} style={{ height: `${Math.max(4, Math.round((d.total / maximo) * 70))}%` }} />
          <span className="text-xs tabular-nums text-pqf-muted">{rotuloDia(d.dia).slice(0, 2)}</span>
        </li>
      ))}
    </ul>
  )
}

function LinhaTrabalho({ item, ocupado, onRemover, onDevolver }: {
  item: ItemFeedAdmin
  ocupado: boolean
  onRemover: (motivo: string) => Promise<boolean>
  onDevolver: () => Promise<boolean>
}) {
  const [removendo, setRemovendo] = useState(false)
  const [motivo, setMotivo] = useState('')
  const [aviso, setAviso] = useState('')

  async function confirmar() {
    if (!motivo.trim()) { setAviso('Escreva o motivo da remoção. Ele fica registrado.'); return }
    setAviso('')
    if (await onRemover(motivo)) { setRemovendo(false); setMotivo('') }
  }

  return (
    <li className="py-4" data-testid="feed-trabalho">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-pqf-ink">{item.titulo}</p>
          <p className="text-xs text-pqf-muted">
            {item.prestadorNome}{item.cidade ? ` · ${item.cidade}` : ''} · aceito em {new Date(item.aceitoEm).toLocaleDateString('pt-BR')} · {item.totalFotos} {item.totalFotos === 1 ? 'foto' : 'fotos'}
          </p>
        </div>
        <div className="flex flex-wrap gap-1">
          {item.exemplo && <Badge tom="alerta">Demonstração</Badge>}
          <Badge tom={TOM[item.situacao]}>{ROTULO_SITUACAO[item.situacao]}</Badge>
        </div>
      </div>

      {item.situacao === 'removido_admin' && item.motivoRemocao && (
        <p className="mt-2 rounded-lg bg-red-50 p-3 text-sm text-red-800">Motivo da remoção: {item.motivoRemocao}</p>
      )}

      {!removendo && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {item.prestadorSlug && (
            <a href={`/${item.prestadorSlug}`} target="_blank" rel="noreferrer" className="text-sm font-semibold text-pqf-blue hover:underline">Ver perfil do prestador</a>
          )}
          {podeRemover(item.situacao) && (
            <Button disabled={ocupado} className="border-red-200 text-red-700 hover:border-red-600 hover:text-red-700" onClick={() => setRemovendo(true)}>Remover do feed</Button>
          )}
          {podeDevolver(item.situacao) && (
            <Button disabled={ocupado} onClick={() => void onDevolver()}>Devolver ao feed</Button>
          )}
        </div>
      )}

      {removendo && (
        <div className="mt-3 space-y-3 rounded-lg border border-slate-200 p-4">
          <Field label="Motivo da remoção (obrigatório, fica registrado)">
            <Textarea rows={3} value={motivo} onChange={(e) => { setMotivo(e.target.value); setAviso('') }} placeholder="O que há de errado neste trabalho?" />
          </Field>
          <p className="text-xs text-pqf-muted">O trabalho sai do feed e nem o cliente nem o prestador conseguem recolocar. Só a equipe devolve.</p>
          {aviso && <p role="alert" className="text-sm font-semibold text-red-700">{aviso}</p>}
          <div className="flex gap-2">
            <Button disabled={ocupado} className="border-red-200 bg-red-600 text-white hover:bg-red-700 hover:text-white" onClick={() => void confirmar()}>Confirmar remoção</Button>
            <Button variante="fantasma" disabled={ocupado} onClick={() => { setRemovendo(false); setMotivo(''); setAviso('') }}>Cancelar</Button>
          </div>
        </div>
      )}
    </li>
  )
}

export function FeedAdmin() {
  const { resumo, carregando, processandoId, erro, remover, devolver } = useAdminFeed()
  const [mostrarExemplos, setMostrarExemplos] = useState(false)
  const itens = itensVisiveis(resumo.itens, mostrarExemplos)
  const escondidos = resumo.itens.length - itens.length

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 px-4 pb-20 md:px-6">
      <PageHeader titulo="Feed" descricao="Trabalhos aceitos pelo cliente com o aviso do feed. Remova o que tiver conteúdo indevido." />

      {erro && <p role="alert" className="rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{erro}</p>}

      {carregando ? (
        <p role="status" className="py-16 text-center text-sm text-pqf-muted">Carregando o feed...</p>
      ) : (
        <>
          <Card titulo="Trabalhos aceitos por dia" descricao={`${totalNoPeriodo(resumo.porDia)} nos últimos ${resumo.porDia.length} dias`}>
            <Dias porDia={resumo.porDia} />
          </Card>

          <Card titulo={`Trabalhos (${itens.length})`} descricao="Os 100 mais recentes. Perfis de demonstração não entram no total por dia.">
            {(escondidos > 0 || mostrarExemplos) && (
              <div className="mb-3">
                <Button variante="fantasma" onClick={() => setMostrarExemplos((v) => !v)}>
                  {mostrarExemplos ? 'Esconder trabalhos de demonstração' : `Mostrar ${escondidos} de demonstração`}
                </Button>
              </div>
            )}
            {itens.length === 0 ? (
              <EmptyState titulo="Nenhum trabalho no feed ainda" descricao="Aparece aqui quando um cliente aceitar um trabalho com o aviso do feed." />
            ) : (
              <ul className="divide-y divide-slate-100">
                {itens.map((item) => (
                  <LinhaTrabalho
                    key={item.projetoId}
                    item={item}
                    ocupado={processandoId === item.projetoId}
                    onRemover={(motivo) => remover(item.projetoId, motivo)}
                    onDevolver={() => devolver(item.projetoId)}
                  />
                ))}
              </ul>
            )}
          </Card>
        </>
      )}
    </div>
  )
}
