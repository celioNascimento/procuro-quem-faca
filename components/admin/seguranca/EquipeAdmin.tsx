// components/admin/seguranca/EquipeAdmin.tsx
// Quem tem acesso ao painel. Só o dono adiciona e remove.
'use client'

import { useState } from 'react'
import { Badge, Button, Card, Field, Input } from '@/components/admin/ui'
import { useEquipeAdmin } from '@/hooks/admin/useEquipeAdmin'
import { podeRemover, rotuloDoPapel, semDuasEtapas } from '@/lib/admin/equipe'

const data = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString('pt-BR') : 'nunca')

export function EquipeAdmin() {
  const { equipe, carregando, ocupado, erro, aviso, email, setEmail, adicionar, remover } = useEquipeAdmin()
  const [removendo, setRemovendo] = useState<string | null>(null)
  const pendentes = semDuasEtapas(equipe)

  return (
    <Card titulo="Equipe" descricao="Quem pode entrar neste painel.">
      {erro && <p role="alert" className="mb-3 rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{erro}</p>}
      {aviso && <p role="status" className="mb-3 rounded-lg border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">{aviso}</p>}

      {carregando ? (
        <p role="status" className="py-6 text-center text-sm text-pqf-muted">Carregando...</p>
      ) : (
        <>
          {pendentes.length > 0 && (
            <p className="mb-3 text-sm text-amber-900" data-testid="equipe-lembrete">
              Sem verificação em duas etapas: {pendentes.map((m) => m.email).join(', ')}.
            </p>
          )}
          <ul className="divide-y divide-slate-100" data-testid="equipe-lista">
            {equipe.membros.map((m) => (
              <li key={m.userId} className="py-3" data-testid="equipe-membro">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-pqf-ink">{m.email}{m.userId === equipe.meuId ? ' (você)' : ''}</p>
                    <p className="text-xs text-pqf-muted">Último acesso: {data(m.ultimoAcesso)}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Badge tom="neutro">{rotuloDoPapel(m.role)}</Badge>
                    <Badge tom={m.duasEtapas ? 'sucesso' : 'alerta'}>{m.duasEtapas ? 'Duas etapas ligadas' : 'Sem duas etapas'}</Badge>
                  </div>
                </div>
                {podeRemover(equipe, m) && (
                  removendo === m.userId ? (
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <p className="text-sm text-pqf-ink">Tirar {m.email} da equipe? Ela perde o acesso ao painel.</p>
                      <Button className="border-red-200 bg-red-600 text-white hover:bg-red-700 hover:text-white" disabled={ocupado} onClick={() => void remover(m.userId).then(() => setRemovendo(null))}>Sim, tirar</Button>
                      <Button variante="fantasma" disabled={ocupado} onClick={() => setRemovendo(null)}>Cancelar</Button>
                    </div>
                  ) : (
                    <Button variante="fantasma" className="mt-1" onClick={() => setRemovendo(m.userId)}>Tirar da equipe</Button>
                  )
                )}
              </li>
            ))}
          </ul>

          {equipe.euDono ? (
            <form className="mt-4 space-y-2" onSubmit={(e) => { e.preventDefault(); void adicionar() }}>
              <Field label="Adicionar pessoa">
                <Input type="email" inputMode="email" placeholder="email@exemplo.com" value={email} onChange={(e) => setEmail(e.target.value)} />
              </Field>
              <p className="text-xs text-pqf-muted">A pessoa precisa já ter conta no site. Entra como editor.</p>
              <Button type="submit" variante="primario" disabled={ocupado || !email.trim()}>Adicionar à equipe</Button>
            </form>
          ) : (
            <p className="mt-4 text-xs text-pqf-muted">Só o dono da equipe adiciona ou remove pessoas.</p>
          )}
        </>
      )}
    </Card>
  )
}
