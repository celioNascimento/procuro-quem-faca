//app/(admin)/admin/geografia/components/FormCidade.tsx

'use client'

import { useState, useMemo, type FormEvent } from 'react'
import type { Estado, Regiao } from '../types/geografia'
import { Button, Card, Field, Input, Select } from '@/components/admin/ui'

type Props = {
  estados: Estado[]
  regioes: Regiao[]
  onSubmit: (nome: string, estadoSigla: string, regiaoId: string | null) => Promise<string | null>
}

export function FormCidade({ estados, regioes, onSubmit }: Props) {
  const [nome, setNome] = useState('')
  const [estadoSigla, setEstadoSigla] = useState('')
  const [regiaoId, setRegiaoId] = useState('')
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [sucesso, setSucesso] = useState(false)

  const siglaEfetiva = estadoSigla || estados[0]?.sigla || ''

  const regioesFiltradas = useMemo(
    () => regioes.filter(r => r.estado_sigla === siglaEfetiva),
    [regioes, siglaEfetiva]
  )

  function handleEstadoChange(sigla: string) {
    setEstadoSigla(sigla)
    setRegiaoId('') // limpa ao trocar estado
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!nome || !siglaEfetiva) return
    setLoading(true)
    setErro(null)
    setSucesso(false)
    const err = await onSubmit(nome, siglaEfetiva, regiaoId || null)
    if (err) {
      setErro(err)
    } else {
      setNome('')
      setRegiaoId('')
      setSucesso(true)
      setTimeout(() => setSucesso(false), 3000)
    }
    setLoading(false)
  }

  return (
    <Card titulo="3. Novo município">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="Estado">
          <Select value={siglaEfetiva} onChange={e => handleEstadoChange(e.target.value)}>
            {estados.map(e => <option key={e.sigla} value={e.sigla}>{e.nome}</option>)}
          </Select>
        </Field>
        <Field label={`Região${regioesFiltradas.length === 0 && siglaEfetiva ? ' — nenhuma cadastrada' : ''}`}>
          <Select
            value={regiaoId}
            onChange={e => setRegiaoId(e.target.value)}
            disabled={regioesFiltradas.length === 0}
          >
            <option value="">Sem região específica</option>
            {regioesFiltradas.map(r => <option key={r.id} value={r.id}>{r.nome}</option>)}
          </Select>
        </Field>
        <Field label="Nome da cidade">
          <Input value={nome} onChange={e => setNome(e.target.value)} placeholder="Ex.: Londrina" />
        </Field>
        {erro && <p className="text-sm font-medium text-red-700">{erro}</p>}
        {sucesso && <p role="status" className="text-sm font-medium text-emerald-700">Cidade cadastrada.</p>}
        <Button type="submit" variante="primario" disabled={loading || !nome} className="w-full justify-center">
          {loading ? 'Salvando...' : 'Cadastrar cidade'}
        </Button>
      </form>
    </Card>
  )
}
