//app/(admin)/admin/geografia/components/TabelaCidades.tsx

'use client'

import { useState, useMemo } from 'react'
import type { Cidade, Regiao } from '../types/geografia'
import { Badge, Button, Card, EmptyState, Select } from '@/components/admin/ui'

type Props = {
  cidades: Cidade[]
  regioes: Regiao[]
  onAtualizarRegiao: (cidadeId: string, regiaoId: string | null) => Promise<string | null>
  total: number
}

export function TabelaCidades({ cidades, regioes, onAtualizarRegiao, total }: Props) {
  const [editandoId, setEditandoId]     = useState<string | null>(null)
  const [salvando, setSalvando]         = useState<string | null>(null)
  const [filtroEstado, setFiltroEstado] = useState('')
  const [filtroRegiao, setFiltroRegiao] = useState('')

  const estados = useMemo(() => {
    const siglas = [...new Set(cidades.map(c => c.estado_sigla))].sort()
    return siglas
  }, [cidades])

  const regioesFiltradas = useMemo(() => {
    if (!filtroEstado) return regioes
    return regioes.filter(r => r.estado_sigla === filtroEstado)
  }, [regioes, filtroEstado])

  const cidadesFiltradas = useMemo(() => {
    return cidades.filter(c => {
      if (filtroEstado && c.estado_sigla !== filtroEstado) return false
      if (filtroRegiao && c.regiao_id !== filtroRegiao) return false
      return true
    })
  }, [cidades, filtroEstado, filtroRegiao])

  function handleEstadoChange(sigla: string) {
    setFiltroEstado(sigla)
    setFiltroRegiao('')
  }

  async function handleRegiaoChange(cidadeId: string, regiaoId: string) {
    setSalvando(cidadeId)
    await onAtualizarRegiao(cidadeId, regiaoId || null)
    setEditandoId(null)
    setSalvando(null)
  }

  return (
    <Card
      titulo="Municípios cadastrados"
      descricao={`${cidadesFiltradas.length}${cidadesFiltradas.length !== total ? ` de ${total}` : ' no total'}`}
      acoes={
        <div className="flex flex-wrap items-center gap-2">
          <Select value={filtroEstado} onChange={e => handleEstadoChange(e.target.value)} className="w-auto py-2">
            <option value="">Todos os estados</option>
            {estados.map(sigla => (
              <option key={sigla} value={sigla}>{sigla}</option>
            ))}
          </Select>

          {filtroEstado && (
            <Select value={filtroRegiao} onChange={e => setFiltroRegiao(e.target.value)} className="w-auto py-2">
              <option value="">Todas as regiões</option>
              {regioesFiltradas.map(r => (
                <option key={r.id} value={r.id}>{r.nome}</option>
              ))}
            </Select>
          )}

          {(filtroEstado || filtroRegiao) && (
            <Button variante="fantasma" onClick={() => { setFiltroEstado(''); setFiltroRegiao('') }}>
              Limpar
            </Button>
          )}
        </div>
      }
    >
      {cidadesFiltradas.length === 0 ? (
        <EmptyState
          titulo={total === 0 ? 'Nenhuma cidade cadastrada ainda' : 'Nenhuma cidade encontrada'}
          descricao={total === 0 ? undefined : 'Ajuste os filtros para ver outros municípios.'}
        />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="py-3 pr-4 text-xs font-semibold text-pqf-muted">Município</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-pqf-muted">Região</th>
                <th className="py-3 pl-4 text-right text-xs font-semibold text-pqf-muted">UF</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {cidadesFiltradas.map(c => {
                const nomeRegiao = c.regioes?.nome ?? null
                const regioesDoCidade = regioes.filter(r => r.estado_sigla === c.estado_sigla)

                return (
                  <tr key={c.id} className="transition-colors hover:bg-pqf-blue-soft/50">
                    <td className="py-3.5 pr-4 text-sm font-medium text-pqf-ink">{c.nome}</td>
                    <td className="px-4 py-3.5 text-center">
                      {editandoId === c.id ? (
                        <Select
                          autoFocus
                          disabled={salvando === c.id}
                          defaultValue={c.regiao_id ?? ''}
                          onBlur={() => setEditandoId(null)}
                          onChange={e => handleRegiaoChange(c.id, e.target.value)}
                          className="w-auto py-1.5 text-xs"
                        >
                          <option value="">Sem região</option>
                          {regioesDoCidade.map(r => (
                            <option key={r.id} value={r.id}>{r.nome}</option>
                          ))}
                        </Select>
                      ) : (
                        <button
                          onClick={() => setEditandoId(c.id)}
                          title="Clique para vincular a região"
                          className="rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pqf-blue"
                        >
                          <Badge tom={nomeRegiao ? 'marca' : 'neutro'}>{nomeRegiao ?? 'Vincular'}</Badge>
                        </button>
                      )}
                    </td>
                    <td className="py-3.5 pl-4 text-right">
                      <Badge tom="neutro">{c.estado_sigla}</Badge>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  )
}
