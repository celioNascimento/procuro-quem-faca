//app/(admin)/admin/geografia/components/FormEstado.tsx

'use client'

import { useState, type FormEvent } from 'react'
import { Button, Card, Field, Input } from '@/components/admin/ui'

type Props = {
  onSubmit: (sigla: string, nome: string) => Promise<string | null>
}

export function FormEstado({ onSubmit }: Props) {
  const [sigla, setSigla] = useState('')
  const [nome, setNome] = useState('')
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!sigla || !nome) return
    setLoading(true)
    setErro(null)
    const err = await onSubmit(sigla, nome)
    if (err) setErro(err)
    else { setSigla(''); setNome('') }
    setLoading(false)
  }

  return (
    <Card titulo="1. Registrar estado">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="Sigla">
          <Input value={sigla} onChange={e => setSigla(e.target.value)} placeholder="Ex.: PR" maxLength={2} />
        </Field>
        <Field label="Nome do estado">
          <Input value={nome} onChange={e => setNome(e.target.value)} placeholder="Ex.: Paraná" />
        </Field>
        {erro && <p className="text-sm font-medium text-red-700">{erro}</p>}
        <Button type="submit" variante="primario" disabled={loading} className="w-full justify-center">
          {loading ? 'Salvando...' : 'Adicionar UF'}
        </Button>
      </form>
    </Card>
  )
}
