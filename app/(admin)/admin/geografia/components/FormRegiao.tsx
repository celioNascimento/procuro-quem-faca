//app/(admin)/admin/geografia/components/FormRegiao.tsx

'use client'

import { useState, type FormEvent } from 'react'
import type { Estado } from '../types/geografia'
import { Button, Card, Field, Input, Select } from '@/components/admin/ui'

type Props = {
  estados: Estado[]
  onSubmit: (nome: string, estadoSigla: string) => Promise<string | null>
}

export function FormRegiao({ estados, onSubmit }: Props) {
  const [nome, setNome] = useState('')
  const [estadoSigla, setEstadoSigla] = useState('')
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  const siglaEfetiva = estadoSigla || estados[0]?.sigla || ''

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!nome || !siglaEfetiva) return
    setLoading(true)
    setErro(null)
    const err = await onSubmit(nome, siglaEfetiva)
    if (err) setErro(err)
    else setNome('')
    setLoading(false)
  }

  return (
    <Card titulo="2. Criar região">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="Estado">
          <Select value={siglaEfetiva} onChange={e => setEstadoSigla(e.target.value)}>
            {estados.map(e => <option key={e.sigla} value={e.sigla}>{e.nome}</option>)}
          </Select>
        </Field>
        <Field label="Nome da região">
          <Input value={nome} onChange={e => setNome(e.target.value)} placeholder="Ex.: Região Metropolitana" />
        </Field>
        {erro && <p className="text-sm font-medium text-red-700">{erro}</p>}
        <Button type="submit" variante="primario" disabled={loading} className="w-full justify-center">
          {loading ? 'Salvando...' : 'Salvar região'}
        </Button>
      </form>
    </Card>
  )
}
